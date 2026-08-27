const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// RNFirebase 26 은 iOS 의존성을 Swift Package Manager 로 해석하는데, firebase-ios-sdk 의
// Swift Package 는 dynamic 산출물만 제공한다. 이 프로젝트는 use_frameworks! :linkage => :static
// (app.json expo-build-properties) 이라 SPM 을 그대로 두면 pod 마다 Firebase 프레임워크를
// 중복 임베드해 pod install 이 실패한다.
//
// 라이브러리가 안내하는 해결 경로는 두 가지 — dynamic 전환 / SPM 해제.
// 후자를 택했다: static 은 Kakao SDK 등 기존 pod 이 이미 전제하는 설정이라 dynamic 으로 바꾸면
// 영향 범위가 프로젝트 전체로 번진다. CocoaPods 모드는 static/dynamic 양쪽을 지원한다.
// (@react-native-firebase/app/README.md — "iOS Dependency Resolution: SPM vs CocoaPods")
//
// RNFirebase 의 Expo 플러그인은 AppDelegate 와 GoogleService plist 만 다루고 Podfile 은
// 건드리지 않으므로, 여기서 직접 넣는다.
const FLAG = '$RNFirebaseDisableSPM = true';

module.exports = function withIosFirebaseNoSPM(config) {
    return withDangerousMod(config, [
        'ios',
        (config) => {
            const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
            const contents = fs.readFileSync(podfilePath, 'utf8');
            if (!contents.includes(FLAG)) {
                // 어떤 target 블록보다도 앞에 있어야 한다 (firebase_spm.rb 요구사항)
                fs.writeFileSync(podfilePath, contents.replace(/^target /m, `${FLAG}\n\ntarget `));
            }
            return config;
        },
    ]);
};
