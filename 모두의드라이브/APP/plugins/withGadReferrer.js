const {
  withAppBuildGradle,
  withMainActivity,
} = require('@expo/config-plugins');

// 리워드 광고 집행용 GAD 리퍼러 (Android 전용).
// 저장소(jitpack)는 app.json의 expo-build-properties > extraMavenRepos에 등록되어 있다.
const GAD_DEPENDENCY = "implementation 'com.github.koreagpa-dev:gad-referrer:1.1.0'";
const GAD_IMPORT = 'import com.gad.referrer.ReferrerHelper';
const GAD_CONNECT = 'ReferrerHelper.connect(this, "CPE")';

// 1. app/build.gradle dependencies에 라이브러리 추가
function withGadDependency(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('gad-referrer')) {
      return config; // 이미 적용됨
    }
    config.modResults.contents = config.modResults.contents.replace(
      /dependencies\s*\{/,
      `dependencies {
    ${GAD_DEPENDENCY}`
    );
    return config;
  });
}

// 2. MainActivity.onCreate에서 리퍼러 수집 시작 (앱 최초 실행 1회만 서버로 전달됨)
function withGadConnect(config) {
  return withMainActivity(config, (config) => {
    if (config.modResults.language !== 'kt') {
      return config; // Kotlin 산출물이 아니면 손대지 않음
    }
    if (config.modResults.contents.includes('ReferrerHelper')) {
      return config; // 이미 적용됨
    }
    // import는 첫 import 줄 앞에
    config.modResults.contents = config.modResults.contents.replace(
      /^import /m,
      `${GAD_IMPORT}\nimport `
    );
    // 호출은 super.onCreate(...) 바로 뒤에 — 인자 유무에 관대하게 매칭
    config.modResults.contents = config.modResults.contents.replace(
      /^([ \t]*)(super\.onCreate\([^)]*\))/m,
      `$1$2\n$1${GAD_CONNECT}`
    );
    return config;
  });
}

// 두 plugin을 순차 적용
module.exports = function withGadReferrer(config) {
  config = withGadDependency(config);
  config = withGadConnect(config);
  return config;
};
