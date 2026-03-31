const {
    withAppDelegate,
  } = require('@expo/config-plugins')
  
  const {
    addSwiftImports,
    insertContentsInsideSwiftFunctionBlock,
    insertContentsInsideSwiftClassBlock,
  } = require('@expo/config-plugins/build/ios/codeMod')
  
  /* ---------------------------------- */
  /* Signatures */
  /* ---------------------------------- */
  const DID_FINISH_LAUNCHING =
    'application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool'
  
  const CONTINUE_USER_ACTIVITY =
    'application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool'
  
  /* ---------------------------------- */
  /* Imports */
  /* ---------------------------------- */
  function addImports(contents) {
    return addSwiftImports(contents, [
      'PushKit',
      'RNCallKeep',
      'RNVoipPushNotification',
      'SendBirdCalls',
      'AVKit',
      'WebRTC',
      'CoreMedia',
    ])
  }
  
  /* ---------------------------------- */
  /* Add PKPushRegistryDelegate */
  /* ---------------------------------- */
  function addPKPushRegistryDelegate(contents) {
    if (contents.includes('PKPushRegistryDelegate')) {
      return contents
    }
  
    return contents.replace(
      /(public\s+class\s+AppDelegate\s*:\s*ExpoAppDelegate)/,
      '$1, PKPushRegistryDelegate'
    )
  }
  
  /* ---------------------------------- */
  /* Add voipRegistry property */
  /* ---------------------------------- */
  function addVoipRegistryProperty(contents) {
    if (contents.includes('var voipRegistry: PKPushRegistry?')) {
      return contents
    }
  
    return contents.replace(
      /(public\s+class\s+AppDelegate[^{]*\{\n)/,
      `$1  var voipRegistry: PKPushRegistry?\n`
    )
  }
  
  /* ---------------------------------- */
  /* didFinishLaunching */
  /* ---------------------------------- */
  function addDidFinishLaunching(contents) {
    const body = `
      let appName = Bundle.main.object(forInfoDictionaryKey: "CFBundleDisplayName") as? String ?? ""
  
      RNCallKeep.setup([
        "appName": appName,
        "supportsVideo": true,
        "includesCallsInRecents": true,
        "maximumCallGroups": 1,
        "maximumCallsPerCallGroup": 1
      ])
  
      RNVoipPushNotificationManager.voipRegistration()
  
      voipRegistry = PKPushRegistry(queue: .main)
      voipRegistry?.delegate = self
      voipRegistry?.desiredPushTypes = [.voIP]
    `
  
    if (!contents.includes('RNCallKeep.setup')) {
      contents = insertContentsInsideSwiftFunctionBlock(
        contents,
        DID_FINISH_LAUNCHING,
        body,
        { position: 'head' }
      )
    }
  
    return contents
  }
  
  /* ---------------------------------- */
  /* PKPushRegistryDelegate methods */
  /* ---------------------------------- */
  function addPushRegistryMethods(contents) {
    if (contents.includes('didUpdate credentials')) {
      return contents
    }
  
    const body = `
    // MARK: - PKPushRegistryDelegate
  
    public func pushRegistry(
      _ registry: PKPushRegistry,
      didUpdate credentials: PKPushCredentials,
      for type: PKPushType
    ) {
      RNVoipPushNotificationManager.didUpdate(credentials, forType: type.rawValue)
    }
  
    public func pushRegistry(
      _ registry: PKPushRegistry,
      didReceiveIncomingPushWith payload: PKPushPayload,
      for type: PKPushType,
      completion: @escaping () -> Void
    ) {
  
      SendBirdCall.pushRegistry(
        registry,
        didReceiveIncomingPushWith: payload,
        for: type
      ) { uuid in
  
        if let uuid = uuid,
           let call = SendBirdCall.call(forUUID: uuid) {
  
          RNCallKeep.reportNewIncomingCall(
            uuid.uuidString,
            handle: call.remoteUser?.userId ?? "",
            handleType: "generic",
            hasVideo: call.isVideoCall,
            localizedCallerName: call.remoteUser?.nickname,
            supportsHolding: true,
            supportsDTMF: true,
            supportsGrouping: true,
            supportsUngrouping: true,
            fromPushKit: true,
            payload: payload.dictionaryPayload,
            withCompletionHandler: completion
          )
  
        } else {
          let invalidUUID = UUID().uuidString
  
          RNCallKeep.reportNewIncomingCall(
            invalidUUID,
            handle: "invalid",
            handleType: "generic",
            hasVideo: false,
            localizedCallerName: "invalid",
            supportsHolding: false,
            supportsDTMF: false,
            supportsGrouping: false,
            supportsUngrouping: false,
            fromPushKit: true,
            payload: payload.dictionaryPayload,
            withCompletionHandler: completion
          )
  
          RNCallKeep.endCall(withUUID: invalidUUID, reason: 1)
        }
      }
    }
    `
  
    return insertContentsInsideSwiftClassBlock(
      contents,
      'AppDelegate',
      body,
      { position: 'tail' }
    )
  }
  
  /* ---------------------------------- */
  /* continueUserActivity */
  /* ---------------------------------- */
  function addContinueUserActivity(contents) {
    if (contents.includes('RNCallKeep.application')) {
      return contents
    }
  
    const body = `
      let result = RNCallKeep.application(
        application,
        continue: userActivity,
        restorationHandler: restorationHandler
      )
    `
  
    contents = insertContentsInsideSwiftFunctionBlock(
      contents,
      CONTINUE_USER_ACTIVITY,
      body,
      { position: 'head' }
    )
  
    return contents.replace(
      'return super.application(application, continue: userActivity, restorationHandler: restorationHandler)',
      'return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result'
    )
  }
  
  /* ---------------------------------- */
  /* Plugin Export */
  /* ---------------------------------- */
  module.exports = function withCallKeepVoipPush(config) {
    return withAppDelegate(config, (cfg) => {
      const { modResults } = cfg
  
      if (modResults.language === 'swift') {
        modResults.contents = addImports(modResults.contents)
        modResults.contents = addPKPushRegistryDelegate(modResults.contents)
        modResults.contents = addVoipRegistryProperty(modResults.contents)
        modResults.contents = addDidFinishLaunching(modResults.contents)
        modResults.contents = addPushRegistryMethods(modResults.contents)
        modResults.contents = addContinueUserActivity(modResults.contents)
      }
  
      return cfg
    })
  }
  