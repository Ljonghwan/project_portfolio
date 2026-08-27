import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    getAnalytics,
    logEvent,
    setDefaultEventParameters,
    setUserId as setAnalyticsUserId,
} from '@react-native-firebase/analytics';
import {
    getCrashlytics,
    recordError,
    setUserId as setCrashlyticsUserId,
} from '@react-native-firebase/crashlytics';
import { getPerformance, httpMetric } from '@react-native-firebase/perf';
import { AppEventsLogger, Settings } from 'react-native-fbsdk-next';
import {
    getTrackingPermissionsAsync,
    requestTrackingPermissionsAsync,
} from 'expo-tracking-transparency';

/**
 * Analytics / Crashlytics / Performance 단일 진입점.
 *
 * 화면과 API 레이어는 **이 파일만** import 한다
 * (firebase / react-native-fbsdk-next 모듈 직접 import 금지).
 * 이벤트를 추가할 때는 아래 "이벤트" 절에 함수를 하나 더 만들고 그 함수만 호출한다.
 *
 * 🚫 개인정보 금지 — 이름·전화번호·이메일·차량번호·생년월일을 **어떤 파라미터에도** 넣지 말 것.
 *    사용자 식별이 필요하면 내부 `userIdx` 만 쓴다. (CSO 가 logcat 원문으로 검사한다)
 *
 * 🚫 `traffic_source`·`traffic_type` 을 커스텀 파라미터로 넣지 말 것 —
 *    Firebase 가 캠페인 어트리뷰션을 자동 수집하므로 직접 넣으면 중복·오염된다.
 *
 * GA4 제약: 이벤트명·파라미터명 40자, 파라미터 값 100자, 이벤트당 커스텀 파라미터 25개.
 */

// 개발 빌드에서도 수집한다 (이번 카드 검증 조건). 끄고 싶으면 false 로 두면
// __DEV__ 빌드에서만 전 계측이 멈춘다.
const COLLECT_IN_DEV = true;
const enabled = COLLECT_IN_DEV || !__DEV__;

const APP_VERSION = Constants.expoConfig?.version ?? '';

/** setDefaultEventParameters 는 전체를 덮어쓰므로 현재 값을 들고 있는다 */
let defaultParams = {
    platform: Platform.OS,
    app_version: APP_VERSION,
};

/**
 * 발송은 fire-and-forget. 실패는 전부 무시한다 — 계측이 사용자 동작을 막으면 안 된다.
 * meeting_id 는 식별자이므로 문자열로 보낸다 (숫자로 주면 GA4 에 `101.0` 으로 남는다).
 */
function send(name, params) {
    if (!enabled) return;
    try {
        const payload = params?.meeting_id != null
            ? { ...params, meeting_id: String(params.meeting_id) }
            : params;
        logEvent(getAnalytics(), name, payload).catch(() => {});
    } catch {}
}

// 표준 이벤트명은 네이티브 상수에서 온다 (Meta 콘솔 표기와 철자가 다르므로 상수를 쓸 것).
// 네이티브 모듈이 없는 환경에서는 비어 있다.
const MetaEvents = AppEventsLogger?.AppEvents ?? {};

// 표준 파라미터명도 마찬가지다. 네이티브 모듈이 없으면 값이 undefined 가 되는데,
// 그대로 계산된 키로 쓰면 객체 키가 문자열 "undefined" 로 굳는다 → 리터럴 폴백이 필수.
// (구조분해 기본값은 값이 undefined 일 때만 적용되므로 두 경우를 한 번에 막는다.)
const {
    ContentID: PARAM_CONTENT_ID = 'fb_content_id',
    ContentType: PARAM_CONTENT_TYPE = 'fb_content_type',
    RegistrationMethod: PARAM_REGISTRATION_METHOD = 'fb_registration_method',
    Success: PARAM_SUCCESS = 'fb_success',
} = AppEventsLogger?.AppEventParams ?? {};

/**
 * Meta(Facebook) 앱 이벤트 발송. Firebase 와 완전히 독립이다 — 여기서 터져도 GA4 발송은 이미 끝나 있다.
 * 네이티브 브릿지는 undefined 파라미터를 못 받으므로(Firebase 는 조용히 무시한다) 걸러서 넘긴다.
 * 값은 전부 문자열로 보낸다 — 콘텐츠 ID 를 숫자로 주면 `101.0` 으로 남는 문제가 GA4 와 동일하다.
 */
function sendMeta(name, params) {
    if (!enabled || !name) return;
    try {
        const payload = {};
        for (const [key, value] of Object.entries(params ?? {})) {
            if (value != null) payload[key] = String(value);
        }
        AppEventsLogger.logEvent(name, payload);
    } catch {}
}

/**
 * iOS ATT. Meta 는 광고 ID 수집 가부를 SDK 에 직접 알려줘야 한다 (기본값 false = 미수집).
 * Android 에는 ATT 자체가 없으므로 아무것도 하지 않는다.
 * @param {boolean} prompt true 면 미결정 상태에서 시스템 프롬프트를 띄운다.
 *   iOS 는 설치당 1회만 띄우므로 재로그인해도 다시 노출되지 않는다.
 */
export function syncAdvertiserTracking(prompt = false) {
    if (!enabled || Platform.OS !== 'ios') return;
    (async () => {
        try {
            const { granted } = prompt
                ? await requestTrackingPermissionsAsync()
                : await getTrackingPermissionsAsync();
            await Settings.setAdvertiserTrackingEnabled(!!granted);
        } catch {}
    })();
}

/** sendOnce 직렬화 체인 — 아래 주석 참조 */
let sendOnceChain = Promise.resolve();

/**
 * 같은 id 로는 한 번만 보낸다 (기기 단위, 앱 재실행·화면 재진입에도 유지).
 *
 * ⚠️ read-modify-write 전체를 하나의 체인에 직렬화한다. `AsyncStorage.getItem` 은
 * 네이티브 브릿지를 타는 진짜 비동기라, 목록 응답처럼 같은 틱에서 여러 건이 동시에
 * 들어오면 전부 서로의 쓰기 전 배열을 읽고 각자 자기 id 만 덧붙여 저장한다
 * (lost update) → 먼저 쓴 id 가 사라져 다음 조회에서 재발송된다.
 * ponytail: 이벤트가 2종뿐이고 fire-and-forget 이라 name 별 큐 분리는 이득이 없다.
 *
 * ponytail: 보낸 id 를 전부 들고 있는다. id 는 숫자라 수천 개여도 수 KB —
 * 문제가 되면 최근 N개만 남기는 링버퍼로 바꾸면 된다.
 *
 * Meta 발송도 **이 안에서** 한다 — 함수 본문 밖에서 sendMeta 를 부르면 dedupe 를 안 타 매번 중복된다.
 * @param metaParams 있으면 Meta 로도 보낸다. 없으면 GA4 만.
 * @param metaName Meta 이벤트명. 기본은 GA4 와 같은 커스텀명이고,
 *   표준 이벤트로 보내야 하는 경우에만 상수를 넘긴다 (상수가 없는 환경이면 null 을 넘겨 무발송).
 */
function sendOnce(name, id, params, metaParams, metaName = name) {
    if (!enabled || id == null) return;
    const key = `analytics_once_${name}`;
    // run 이 내부에서 전부 catch 하므로 체인이 rejected 로 굳지 않는다
    sendOnceChain = sendOnceChain.then(async () => {
        try {
            const raw = await AsyncStorage.getItem(key);
            const sent = raw ? JSON.parse(raw) : [];
            if (sent.includes(id)) return;
            // 기록을 먼저 남긴다 — 중복 발송보다 누락이 낫다 (재시도 경로가 없다)
            await AsyncStorage.setItem(key, JSON.stringify([...sent, id]));
            send(name, params);
            if (metaParams && metaName) sendMeta(metaName, metaParams);
        } catch {}
    });
    return sendOnceChain;
}

// ── 초기화 / 사용자 컨텍스트 ──

/** 앱 시작 시 1회. 기본 파라미터를 걸고 JS 예외를 Crashlytics 로 넘긴다 */
export function initAnalytics() {
    if (!enabled) return;
    try {
        setDefaultEventParameters(getAnalytics(), defaultParams);
    } catch {}
    // autoInit 이 켜져 있어도 명시 호출한다 (안전장치)
    try {
        Settings.initializeSDK();
    } catch {}
    // 여기서는 프롬프트를 띄우지 않고, 이미 결정된 ATT 상태만 SDK 에 반영한다
    syncAdvertiserTracking();
    // RN 의 JS 예외는 Crashlytics 에 기본 수집되지 않는다 — 전역 핸들러로 직접 넘긴다
    try {
        const prev = global.ErrorUtils?.getGlobalHandler?.();
        global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
            try {
                recordError(getCrashlytics(), error);
            } catch {}
            prev?.(error, isFatal);
        });
    } catch {}
}

/**
 * 로그인·회원가입·앱 시작(세션 복원) 시 호출. 식별은 userIdx 만 쓴다.
 * user 객체를 그대로 넘겨도 되며, idx 와 role 외의 필드는 읽지 않는다.
 * @param {{idx?: number|string, role?: 'owner'|'guest'}} user
 */
export function setAnalyticsUser(user) {
    if (!enabled) return;
    const id = user?.idx != null ? String(user.idx) : null;
    defaultParams = { ...defaultParams, user_type: user?.role ?? undefined };
    try {
        setDefaultEventParameters(getAnalytics(), defaultParams);
        setAnalyticsUserId(getAnalytics(), id).catch(() => {});
        if (id) setCrashlyticsUserId(getCrashlytics(), id).catch(() => {});
    } catch {}
}

/** 로그아웃·탈퇴 시 호출 */
export function clearAnalyticsUser() {
    if (!enabled) return;
    defaultParams = { platform: Platform.OS, app_version: APP_VERSION };
    try {
        setDefaultEventParameters(getAnalytics(), defaultParams);
        setAnalyticsUserId(getAnalytics(), null).catch(() => {});
    } catch {}
}

// ── 이벤트 (전부 API 성공 응답 이후에 호출한다. await 하지 말 것) ──

/** 회원가입 완료. @param method kakao | apple | phone @param role owner | guest */
export function logSignUp(method, role) {
    send('sign_up', { signup_method: method ?? 'unknown', user_type: role ?? 'unknown' });
    sendMeta(MetaEvents.CompletedRegistration, { [PARAM_REGISTRATION_METHOD]: method ?? 'unknown' });
}

/**
 * 상세 프로필 저장 완료 (가입 흐름의 '건너뛰기' 시엔 발생하지 않는다) — 최초 1회만.
 * userIdx 가 없으면 sendOnce 가 조용히 무발송하므로 호출부에서 반드시 넘길 것.
 * Meta 는 기존 표준 이벤트(CompletedTutorial) 매핑을 유지한다 — 커스텀명으로 바꾸면 누적 데이터가 끊긴다.
 */
export function logProfileComplete(userIdx) {
    sendOnce('profile_complete', userIdx, undefined,
        { [PARAM_CONTENT_ID]: 'detail_profile', [PARAM_SUCCESS]: 1 },
        // ?? null: 상수가 없는 환경에서 커스텀명으로 폴백되지 않게 (기존과 동일하게 무발송)
        MetaEvents.CompletedTutorial ?? null);
}

/** 모임 상세 조회 */
export function logMeetingDetailView({ meetingId, meetingType, region }) {
    send('meeting_detail_view', { meeting_id: meetingId, meeting_type: meetingType, region });
    sendMeta(MetaEvents.ViewedContent, { [PARAM_CONTENT_ID]: meetingId, [PARAM_CONTENT_TYPE]: meetingType, region });
}

/** 모임 개설 완료 */
export function logMeetingCreated({ meetingId, meetingType, region }) {
    send('meeting_created', { meeting_id: meetingId, meeting_type: meetingType, region });
    sendMeta('meeting_created', { [PARAM_CONTENT_ID]: meetingId, [PARAM_CONTENT_TYPE]: meetingType, region });
}

/** 참여 신청 완료 */
export function logParticipationApplied(meetingId) {
    send('participation_applied', { meeting_id: meetingId });
    sendMeta('participation_applied', { [PARAM_CONTENT_ID]: meetingId });
}

/** 참여 승인 (승인하는 오너 단말에서만 발생) */
export function logApplicationApproved(meetingId) {
    send('application_approved', { meeting_id: meetingId });
    sendMeta('application_approved', { [PARAM_CONTENT_ID]: meetingId });
}

/** 매칭 확정 — 매칭마다 1회만 */
export function logMatchCompleted(meetingId) {
    sendOnce('match_completed', meetingId, { meeting_id: meetingId }, { [PARAM_CONTENT_ID]: meetingId });
}

/** 채팅 시작 — 방마다 1회만 */
export function logChatStarted(roomIdx, meetingId) {
    sendOnce('chat_started', roomIdx, { meeting_id: meetingId }, { [PARAM_CONTENT_ID]: meetingId });
}

/** 드라이브 완료 — 매칭 상태가 completed 로 처음 관측될 때 1회만 */
export function logDriveCompleted(meetingId) {
    sendOnce('drive_completed', meetingId, { meeting_id: meetingId }, { [PARAM_CONTENT_ID]: meetingId });
}

/** 후기 작성 완료 */
export function logReviewWritten(meetingId) {
    send('review_written', { meeting_id: meetingId });
    sendMeta('review_written', { [PARAM_CONTENT_ID]: meetingId });
}

/** 회원 탈퇴 */
export function logAccountDeleted() {
    send('account_deleted');
    sendMeta('account_deleted');
}

// ── Performance ──

/**
 * HTTP 응답 시간 계측. axios 인터셉터가 쓴다.
 * 시작에서 metric 을 만들고, 끝나면 stop 에 상태 코드를 넘긴다.
 * @returns {{stop: (status?: number) => void} | null}
 */
export function startHttpMetric(url, method) {
    if (!enabled || !url) return null;
    try {
        const metric = httpMetric(getPerformance(), url, String(method || 'GET').toUpperCase());
        let started = metric.start().catch(() => {});
        return {
            stop(status) {
                Promise.resolve(started)
                    .then(() => {
                        if (status != null) metric.setHttpResponseCode(status);
                        return metric.stop();
                    })
                    .catch(() => {});
            },
        };
    } catch {
        return null;
    }
}

/** Crashlytics 수신 확인용 테스트 크래시 (검증 때만 호출) */
export function recordTestError(message = 'mode analytics test error') {
    try {
        recordError(getCrashlytics(), new Error(message));
    } catch {}
}

// 검증용 훅 — __DEV__ 빌드에서만 전역에 붙는다 (릴리스 번들에서는 통째로 제거됨).
// Metro 디버거에서 `__analytics.logSignUp('kakao')` 식으로 호출해 logcat 발송을 확인한다.
if (__DEV__) {
    global.__analytics = {
        logSignUp, logProfileComplete, logMeetingDetailView, logMeetingCreated,
        logParticipationApplied, logApplicationApproved, logMatchCompleted,
        logChatStarted, logDriveCompleted, logReviewWritten, logAccountDeleted,
        recordTestError, syncAdvertiserTracking,
        // 15초 배치 대기 없이 즉시 발송 — Meta 이벤트 매니저 "테스트 이벤트" 탭에서 실시간 확인용
        flush: () => AppEventsLogger.flush(),
        // 테스트 기기 등록·미수신 원인 판정용 광고 ID (Android 12+ 는 adb 로 조회가 막혀 SDK 가 유일 경로)
        advertiserID: () => AppEventsLogger.getAdvertiserID(),
    };
}
