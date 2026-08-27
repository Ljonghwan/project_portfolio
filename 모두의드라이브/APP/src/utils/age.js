import usePopupStore from '../store/popupStore';
import useAuthStore from '../store/authStore';

/**
 * 연 나이 (현재연도 - 출생연도).
 * 관리자페이지·서버와 동일 기준이며 **생일은 무시**한다 (만 나이 아님).
 * 기준 연도는 단말 로컬 타임존이 아닌 KST로 고정한다 — 그렇지 않으면 비KST
 * 타임존 단말이 서버(KST 고정)와 1살 어긋나 경계연령(20/59세)에서 앱/서버
 * 판정이 갈릴 수 있다.
 * @param {string|Date} birthDate 'YYYY-MM-DD' 문자열 또는 Date
 * @returns {number|null}
 */
export function getAge(birthDate) {
    if (!birthDate) return null;
    const year = typeof birthDate === 'string'
        ? parseInt(birthDate.slice(0, 4), 10)
        : new Date(birthDate).getFullYear();
    if (!year || Number.isNaN(year)) return null;
    const kstYear = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCFullYear();
    return kstYear - year;
}

/** 가입 가능 연령(min~max, 연 나이 기준) 여부 */
export function isSignupAgeValid(birthDate, min, max) {
    const age = getAge(birthDate);
    return age !== null && age >= min && age <= max;
}

/** 최소 연령 하한(연 나이 hardMin 이상) 충족 여부 — 연령 제한 플래그와 무관하게 상시 적용 */
export function isSignupHardMinValid(birthDate, hardMin) {
    const age = getAge(birthDate);
    return age !== null && age >= hardMin;
}

/** 가입 중단 팝업 → 확인/딤/백 어느 쪽으로 닫혀도 가입 데이터 초기화 + 로그인(첫) 화면 복귀 */
function showSignupBlocked(router, message) {
    // onConfirm(확인 버튼)과 onClose(딤 탭 / 안드로이드 백)가 둘 다 불릴 수 있어 1회만 실행
    let stopped = false;
    const stopSignup = () => {
        if (stopped) return;
        stopped = true;
        useAuthStore.getState().resetSignupData();
        // 가입 스택을 모두 정리해야 백버튼으로 중단된 가입 화면에 되돌아가지 않는다
        if (router.canDismiss()) router.dismissAll();
        router.replace('/');
    };
    usePopupStore.getState().show('confirm', {
        title: '회원가입 제한',
        message,
        confirmText: '확인',
        onConfirm: stopSignup,
        onClose: stopSignup,
    });
}

/** 상세 연령 제한(min~max) 위반 팝업 */
export function showSignupAgeRestricted(router, min, max) {
    showSignupBlocked(router, `모두의 드라이브 이용연령을 확인해 주세요.\n모두의 드라이브는 ${min}세 이상 ${max}세 이하의 회원만 이용할 수 있습니다.`);
}

/** 최소 연령 하한(만 hardMin세) 미만 팝업 */
export function showSignupHardMinRestricted(router, hardMin) {
    showSignupBlocked(router, `만 ${hardMin}세 이상만 가입할 수 있습니다.`);
}
