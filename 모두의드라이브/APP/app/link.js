import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import useAuthStore from '../src/store/authStore';
import { COLORS } from '../src/constants/config';
import { navigateByLinkType } from '../src/utils/navigateByLinkType';

// 딥링크(https://modudrive.co.kr/link?type=…&target=… / mode-drive://link?…) 진입 화면.
// 인증 확정을 기다렸다가 배너·팝업과 같은 라우팅 규약(navigateByLinkType)으로 넘긴다.
export default function LinkScreen() {
    const router = useRouter();
    const { type, target } = useLocalSearchParams();
    const isLoading = useAuthStore((s) => s.isLoading);
    const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
    // 같은 type:target 조합만 dedup. 불리언 latch로 두면 link 화면이 살아 있는 동안
    // 도착한 두 번째 딥링크가 params만 갱신돼(리마운트 없음) 아무 동작 없이 소실된다.
    const handledKey = useRef(null);

    useEffect(() => {
        if (isLoading) return;
        const key = `${type ?? ''}:${target ?? ''}`;
        if (handledKey.current === key) return;
        handledKey.current = key;

        if (!isLoggedIn) {
            // 로그인 플로우는 index.js가 담당 (로그인 후 목적지 복원은 이번 범위 아님)
            router.replace('/');
            return;
        }

        // link 화면을 스택에서 걷어낸 뒤(replace) 홈 위에 목적지를 push(navigate).
        // 목적지로 곧장 replace하면 상세에서 뒤로가기 시 앱이 종료된다.
        router.replace('/(tabs)/home');
        // 딥링크 URL은 누구나 만들 수 있으므로 외부 URL 열기(external)는 허용하지 않는다(open redirect).
        // external은 관리자가 등록하는 배너·팝업 경로에서만 쓴다.
        if (type !== 'external') navigateByLinkType(router, type, target);
    }, [isLoading, isLoggedIn, router, type, target]);

    return (
        <View testID="link-screen" style={styles.container}>
            <ActivityIndicator size="small" color={COLORS.textPrimary} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white,
    },
});
