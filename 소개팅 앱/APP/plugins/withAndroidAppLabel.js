const { withStringsXml, withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidAppLabel(config) {
  // strings.xml 수정
  config = withStringsXml(config, (config) => {
    const strings = config.modResults.resources.string || [];

    const existing = strings.find(
      (item) => item.$?.name === 'app_name'
    );

    if (existing) {
      existing._ = '사소한 1%';
    } else {
      strings.push({
        $: { name: 'app_name' },
        _: '사소한 1%',
      });
    }

    config.modResults.resources.string = strings;
    return config;
  });

  // AndroidManifest.xml 확인용 (label은 app_name을 쓰게 둠)
  config = withAndroidManifest(config, (config) => {
    return config;
  });

  return config;
};
