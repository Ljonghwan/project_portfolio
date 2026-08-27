import { create } from 'zustand';
import client from '../api/client';

const useConfigStore = create((set, get) => ({
    loaded: false,
    // 도메인 상수
    roles: [],
    genders: [],
    carTypes: [],
    driveLevels: [],
    driveTypes: [],
    matchTypes: [],
    matchStatuses: [],
    participantStatuses: [],
    userStatuses: [],
    suspendReasons: [],
    reportReasons: [],
    reportStatuses: [],
    inquiryCategories: [],
    inquiryStatuses: [],
    pointTypes: [],
    earnTypes: [],
    spendTypes: [],
    filterAges: [],
    filterGenders: [],
    profileTags: [],
    mannerEvalItems: [],
    // 포인트/결제
    pointProducts: [],
    pointProductsIAP: [],
    bankList: [],
    refundFeeRate: 0.2,
    refundMinAmount: 5000,
    referralMaxCount: 2,
    // 가입 연령 제한 (연 나이 기준, signupAgeLimitEnabled=true 일 때만 동작 — 현재 off)
    signupAgeLimitEnabled: false,
    signupAgeHardMin: 18,
    signupAgeMin: 20,
    signupAgeMax: 59,
    // 앱 설정
    appVersion: '',
    forceUpdate: false,
    iosStoreUrl: '',
    aosStoreUrl: '',
    shareUrl: '',
    shareText: '',
    devLoginEnabled: false,
    reviewBonusEnabled: true,

    fetchConfig: async () => {
        try {
            const res = await client.post('/config');
            const data = res.data;
            set({
                loaded: true,
                roles: data.roles || [],
                genders: data.genders || [],
                carTypes: data.carTypes || [],
                driveLevels: data.driveLevels || [],
                driveTypes: data.driveTypes || [],
                matchTypes: data.matchTypes || [],
                matchStatuses: data.matchStatuses || [],
                participantStatuses: data.participantStatuses || [],
                userStatuses: data.userStatuses || [],
                suspendReasons: data.suspendReasons || [],
                reportReasons: data.reportReasons || [],
                reportStatuses: data.reportStatuses || [],
                inquiryCategories: data.inquiryCategories || [],
                inquiryStatuses: data.inquiryStatuses || [],
                pointTypes: data.pointTypes || [],
                earnTypes: data.earnTypes || [],
                spendTypes: data.spendTypes || [],
                filterAges: data.filterAges || [],
                filterGenders: data.filterGenders || [],
                profileTags: data.profileTags || [],
                mannerEvalItems: data.mannerEvalItems || [],
                pointProducts: data.pointProducts || [],
                pointProductsIAP: data.pointProductsIAP || [],
                bankList: data.bankList || [],
                refundFeeRate: data.refundFeeRate ?? 0.2,
                refundMinAmount: data.refundMinAmount ?? 5000,
                referralMaxCount: data.referralMaxCount ?? 2,
                signupAgeLimitEnabled: data.signupAgeLimitEnabled === true,
                signupAgeHardMin: data.signupAgeHardMin ?? 18,
                signupAgeMin: data.signupAgeMin ?? 20,
                signupAgeMax: data.signupAgeMax ?? 59,
                appVersion: data.appVersion || '',
                forceUpdate: !!data.forceUpdate,
                iosStoreUrl: data.iosStoreUrl || '',
                aosStoreUrl: data.aosStoreUrl || '',
                shareUrl: data.shareUrl || '',
                shareText: data.shareText || '',
                devLoginEnabled: !!data.devLoginEnabled,
                reviewBonusEnabled: data.reviewBonusEnabled !== false,
            });
        } catch (e) {
            set({ loaded: true });
        }
    },

    // 헬퍼: key로 label 찾기
    getLabel: (constName, key) => {
        const list = get()[constName];
        if (!Array.isArray(list)) return key;
        const item = list.find(i => i.key === key);
        return item ? item.label : key;
    },
}));

export default useConfigStore;
