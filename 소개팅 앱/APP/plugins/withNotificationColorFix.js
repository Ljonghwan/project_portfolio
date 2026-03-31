// expo-notifications 알림 색상 수정 firebase랑 맞추기 위해서
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withNotificationColorFix(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;

    // tools 네임스페이스 추가
    manifest.manifest.$ = manifest.manifest.$ || {};
    manifest.manifest.$['xmlns:tools'] =
      manifest.manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';

    // <application> 태그 가져오기
    const application = manifest.manifest.application?.[0];
    if (!application) return config;

    // 중복 방지를 위해 기존 meta-data 제거
    application['meta-data'] = application['meta-data']?.filter(
      (m) =>
        m.$['android:name'] !==
        'com.google.firebase.messaging.default_notification_color'
    );

    // 새 meta-data 추가
    application['meta-data'] = [
      ...(application['meta-data'] || []),
      {
        $: {
          'android:name': 'com.google.firebase.messaging.default_notification_color',
          'android:resource': '@color/notification_icon_color',
          'tools:replace': 'android:resource',
        },
      },
    ];

    return config;
  });
};
