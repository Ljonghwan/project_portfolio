// https://github.com/invertase/react-native-firebase/discussions/5386#discussioncomment-860295
// https://www.videosdk.live/blog/react-native-ios-video-calling-app-with-callkeep
// https://sendbird.com/docs/calls/sdk/v1/react-native/direct-call/receiving-a-call/receive-a-call-in-the-background

const { addObjcImports, insertContentsInsideObjcFunctionBlock, findObjcFunctionCodeBlock } = require('@expo/config-plugins/build/ios/codeMod')
const { withAppDelegate } = require('@expo/config-plugins')

const DID_FINISH_LAUNCHING = 'application:didFinishLaunchingWithOptions:'
const DID_UPDATE_PUSH_CREDENTIALS = 'pushRegistry:didUpdatePushCredentials:forType:'
const DID_RECEIVE_INCOMING_PUSH = 'pushRegistry:didReceiveIncomingPushWithPayload:forType:withCompletionHandler:'
const CONTINUE_USER_ACTIVITY = 'application:continueUserActivity:restorationHandler:'


function addContinueUserActivity(contents) {
    // call the setup of RNCallKeep
    // https://github.com/react-native-webrtc/react-native-callkeep
    // call the setup of voip push notification
    // https://github.com/react-native-webrtc/react-native-voip-push-notification
    const setupContinue = 'BOOL resultRNCall = [RNCallKeep application:application continueUserActivity:userActivity restorationHandler:restorationHandler];'
    if (!contents.includes(setupContinue)) {
        contents = insertContentsInsideObjcFunctionBlock(
            contents,
            CONTINUE_USER_ACTIVITY,
            setupContinue,
            { position: 'head' }
        )
        contents = contents.replace('[super application:application continueUserActivity:userActivity restorationHandler:restorationHandler]', '[super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || resultRNCall')
    }
    return contents
}

// https://github.com/GetStream/stream-video-js/blob/main/packages/react-native-sdk/expo-config-plugin/src/withPushAppDelegate.ts#L30
function addImports(contents) {
    return addObjcImports(
        contents,
        [
            '"RNCallKeep.h"',
            '<SendBirdCalls/SendBirdCalls-Swift.h>',
            '"RNVoipPushNotificationManager.h"',
            '<AVKit/AVKit.h>',
            '<PushKit/PushKit.h>',
            '<WebRTC/WebRTC.h>',
            '<CoreMedia/CoreMedia.h>'
        ]
    )
}

// https://github.com/GetStream/stream-video-js/blob/main/packages/react-native-sdk/expo-config-plugin/src/common/addNewLinesToAppDelegate.ts
function addNewLinesToAppDelegate(content, toAdd) {
    const lines = content.split('\n')
    let lineIndex = lines.findIndex((line) => line.match('@end'))
    if (lineIndex < 0) throw Error('Malformed app delegate')
    toAdd.unshift('')
    lineIndex -= 1
    for (const newLine of toAdd) {
        lines.splice(lineIndex, 0, newLine)
        lineIndex++
    }
    return lines.join('\n')
}


function addDidFinishLaunching(contents) {
    // call the setup of RNCallKeep
    // https://github.com/react-native-webrtc/react-native-callkeep
    // call the setup of voip push notification
    // https://github.com/react-native-webrtc/react-native-voip-push-notification
    const setupCallKeep = `
  NSString *appName = [[[NSBundle mainBundle] infoDictionary]objectForKey :@"CFBundleDisplayName"];
  [RNCallKeep setup:@{
    @"appName": appName,
    @"imageName": @"logo_white",
    @"supportsVideo": @YES,
    @"includesCallsInRecents": @YES,
    @"maximumCallGroups": @1,
    @"maximumCallsPerCallGroup": @1
  }];
  [RNVoipPushNotificationManager voipRegistration];
  `
    if (!contents.includes('[RNCallKeep setup:@')) {
        contents = insertContentsInsideObjcFunctionBlock(
            contents,
            DID_FINISH_LAUNCHING,
            setupCallKeep,
            { position: 'head' }
        )
    }
    return contents
}

function addDidUpdatePushCredentials(contents) {
    if (!contents.includes('didInvalidatePushTokenForType:(PKPushType)type')) {
        contents = addNewLinesToAppDelegate(contents, [
            `
- (void)pushRegistry:(PKPushRegistry *)registry didInvalidatePushTokenForType:(PKPushType)type {
  // --- The system calls this method when a previously provided push token is no longer valid for use. No action is necessary on your part to reregister the push type. Instead, use this method to notify your server not to send push notifications using the matching push token.
}
`
        ])
    }

    const updatedPushCredentialsMethod = '[RNVoipPushNotificationManager didUpdatePushCredentials:credentials forType:(NSString *)type];'
    if (!contents.includes(updatedPushCredentialsMethod)) {
        if (!findObjcFunctionCodeBlock(contents, DID_UPDATE_PUSH_CREDENTIALS)) {
            contents = addNewLinesToAppDelegate(contents, [
                `- (void)pushRegistry:(PKPushRegistry *)registry didUpdatePushCredentials:(PKPushCredentials *)credentials forType:(PKPushType)type {
    ${updatedPushCredentialsMethod}
}`
            ])
        }
        else {
            contents = insertContentsInsideObjcFunctionBlock(
                contents,
                DID_UPDATE_PUSH_CREDENTIALS,
                updatedPushCredentialsMethod,
                { position: 'tail' }
            )
        }
    }
    return contents
}

function addDidReceiveIncomingPush(contents) {
    // https://github.com/GetStream/stream-video-js/blob/main/packages/react-native-sdk/expo-config-plugin/src/withPushAppDelegate.ts#L30
    // https://github.com/react-native-webrtc/react-native-callkeep#pushkit
    const onIncomingPush = `
  [SBCSendBirdCall pushRegistry:registry didReceiveIncomingPushWith:payload for:type completionHandler:^(NSUUID * _Nullable uuid) {
    // IMPORTANT: Incoming calls MUST be reported when receiving a PushKit push.
    //  If you don't report to CallKit, the app will be terminated.

    if(uuid != nil) {
      // Report valid call
      SBCDirectCall* call = [SBCSendBirdCall callForUUID: uuid];
      [RNCallKeep reportNewIncomingCall: [uuid UUIDString]
                                 handle: [[call remoteUser] userId]
                             handleType: @"generic"
                               hasVideo: [call isVideoCall]
                    localizedCallerName: [[call remoteUser] nickname]
                        supportsHolding: YES
                           supportsDTMF: YES
                       supportsGrouping: YES
                     supportsUngrouping: YES
                            fromPushKit: YES
                                payload: [payload dictionaryPayload]
                  withCompletionHandler: completion];
    } else {
      // Report and end invalid call
      NSUUID* uuid = [NSUUID alloc];
      NSString* uuidString = [uuid UUIDString];

      [RNCallKeep reportNewIncomingCall: uuidString
                                 handle: @"invalid"
                             handleType: @"generic"
                               hasVideo: NO
                    localizedCallerName: @"invalid"
                        supportsHolding: NO
                           supportsDTMF: NO
                       supportsGrouping: NO
                     supportsUngrouping: NO
                            fromPushKit: YES
                                payload: [payload dictionaryPayload]
                  withCompletionHandler: completion];
      [RNCallKeep endCallWithUUID:uuidString reason:1];
    }
  }];
`
    if (!contents.includes('[RNVoipPushNotificationManager didReceiveIncomingPushWithPayload')) {
        if (!findObjcFunctionCodeBlock(contents, DID_RECEIVE_INCOMING_PUSH)) {
            contents = addNewLinesToAppDelegate(contents, [
                `- (void)pushRegistry:(PKPushRegistry *)registry didReceiveIncomingPushWithPayload:(PKPushPayload *)payload forType:(PKPushType)type withCompletionHandler:(void (^)(void))completion {
${onIncomingPush}
}`
            ])
        }
        else {
            contents = insertContentsInsideObjcFunctionBlock(
                contents,
                DID_RECEIVE_INCOMING_PUSH,
                onIncomingPush,
                { position: 'tail' }
            )
        }
    }
    return contents
}


// https://www.sitepen.com/blog/doing-more-with-expo-using-custom-native-code
// https://docs.expo.dev/config-plugins/plugins-and-mods/
// https://github.com/invertase/react-native-firebase/discussions/5386
module.exports = function withPrefixedName(config, prefix) {
    //return config
    return withAppDelegate(config, (cfg) => {
        const { modResults } = cfg
        if (['objc', 'objcpp'].includes(modResults.language)) {
            modResults.contents = addImports(modResults.contents)
            modResults.contents = addDidFinishLaunching(modResults.contents)
            modResults.contents = addDidUpdatePushCredentials(modResults.contents)
            modResults.contents = addDidReceiveIncomingPush(modResults.contents)
            modResults.contents = addContinueUserActivity(modResults.contents)
            // console.log(modResults.contents)
        }
        return cfg
    })
}