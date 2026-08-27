const { AndroidConfig, withAndroidManifest, withDangerousMod, withAppBuildGradle, withSettingsGradle } = require('@expo/config-plugins');
const { mergeContents } = require('@expo/config-plugins/build/utils/generateCode');

const withInCallManagerBuildGradle = (config) => {
  return withAppBuildGradle(config, async (config) => {
    if (config.modResults.language === 'groovy') {
      const content = config.modResults.contents;
      if (!content.includes('react-native-incall-manager')) {
        config.modResults.contents = content.replace(
          /(if \(hermesEnabled.toBoolean\(\)\) {\s*implementation\("com.facebook.react:hermes-android"\)\s*} else {\s*implementation jscFlavor\s*}\s*)/,
          `$1    implementation project(':react-native-incall-manager')
`
        );
      }
    }
    return config;
  });
};

const withInCallManagerSettingsGradle = (config) => {
  return withSettingsGradle(config, async (config) => {
    const settingsContent = config.modResults.contents;
    if (!settingsContent.includes('react-native-incall-manager')) {
      config.modResults.contents = `${settingsContent}

include ':react-native-incall-manager'
project(':react-native-incall-manager').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-incall-manager/android')`;
    }
    return config;
  });
};

module.exports = function withCustomManifest(config) {
  config = withInCallManagerBuildGradle(config);
  config = withInCallManagerSettingsGradle(config);
  
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // MainActivity에 showWhenLocked 속성 추가
    const mainActivity = androidManifest.manifest.application[0].activity.find(
      (act) => act.$['android:name'] === '.MainActivity'
    );
    if (mainActivity) {
      mainActivity.$['android:showWhenLocked'] = 'true';
      mainActivity.$['android:turnScreenOn'] = 'true';
    }

    // ForegroundService 추가
    if (!androidManifest.manifest.application[0].service) {
      androidManifest.manifest.application[0].service = [];
    }

    androidManifest.manifest.application[0].service.push({
      $: {
        'android:name': 'app.notifee.core.ForegroundService',
        'android:foregroundServiceType': 'microphone',
        'tools:replace': 'android:foregroundServiceType'
      }
    });

    return config;
  });
};