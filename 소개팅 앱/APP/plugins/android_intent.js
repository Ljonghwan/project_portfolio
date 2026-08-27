const { withAndroidManifest, ConfigPlugin } = require('@expo/config-plugins');

const withAndroidQueries = config => {
    return withAndroidManifest(config, config => {
        config.modResults.manifest.queries = [{ 
            package: [
                { $: { 'android:name': 'com.hyundaicard.appcard' } },
                { $: { 'android:name': 'com.shinhan.smartcaremgr' } },
                { $: { 'android:name': 'com.shinhan.sbanking' } },
            ] 
        }];

        return config;
    });
};

module.exports = withAndroidQueries;