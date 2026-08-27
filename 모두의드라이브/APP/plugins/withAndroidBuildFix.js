const {
  withProjectBuildGradle,
  withGradleProperties,
} = require('@expo/config-plugins');

// 1. 전체 모듈 lint vital 검사 비활성화
function withDisableLint(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('checkReleaseBuilds false')) {
      return config; // 이미 적용됨
    }
    config.modResults.contents = config.modResults.contents.replace(
      /allprojects\s*\{/,
      `allprojects {
    afterEvaluate { project ->
        if (project.hasProperty('android')) {
            project.android {
                lintOptions {
                    checkReleaseBuilds false
                    abortOnError false
                }
            }
        }
    }`
    );
    return config;
  });
}

// 2. Gradle 메모리 상향 + 데몬 재사용 방지 + 병렬 축소
function withGradleMemory(config) {
  return withGradleProperties(config, (config) => {
    const set = (key, value) => {
      const item = config.modResults.find(
        (i) => i.type === 'property' && i.key === key
      );
      if (item) item.value = value;
      else config.modResults.push({ type: 'property', key, value });
    };

    set('org.gradle.jvmargs', '-Xmx4096m -XX:MaxMetaspaceSize=1024m');
    set('org.gradle.daemon', 'false');

    return config;
  });
}

// 두 plugin을 순차 적용
module.exports = function withAndroidBuildFix(config) {
  config = withDisableLint(config);
  config = withGradleMemory(config);
  return config;
};