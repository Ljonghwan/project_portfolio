import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { setLoggingOut } from '../api/client';
import { setAnalyticsUser, clearAnalyticsUser, syncAdvertiserTracking } from '../utils/analytics';
import usePointStore from './pointStore';

const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isLoggedIn: false,
    isLoading: true,

    // 회원가입 중간 데이터
    signupData: {
        socialType: null,
        socialId: null,
        email: null,
        name: null,
        phone: null,
        gender: null,
        birthDate: null,
        role: null,
        nickname: null,
        regionSido: null,
        regionSigungu: null,
        cars: [],
        driveLevel: null,
        driveModes: [],
        job: null,
        hobby: null,
        bio: null,
        profileImage: null,
        introduction: null,
        photos: [],
        referralCode: null,
        marketingAgree: false,
    },

    // 앱 시작 시 저장된 토큰 확인
    initialize: async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userStr = await AsyncStorage.getItem('user');

            if (token && userStr) {
                try {
                    const user = JSON.parse(userStr);
                    set({ user, token, isLoggedIn: true, isLoading: false });
                    setAnalyticsUser(user);
                } catch {
                    await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
                    set({ isLoading: false });
                }
            } else {
                set({ isLoading: false });
            }
        } catch (e) {
            set({ isLoading: false });
        }
    },

    // 로그인 성공 처리
    setLogin: async (token, refreshToken, user) => {
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('refreshToken', refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isLoggedIn: true });
        setAnalyticsUser(user);
        // iOS ATT 프롬프트. 소셜 로그인·회원가입 완료가 둘 다 여기를 지난다.
        // await 하지 않는다 — 계측이 로그인 흐름을 막으면 안 된다.
        syncAdvertiserTracking(true);
    },

    // 내 프로필 갱신 (홈 화면용)
    fetchMe: async () => {
        try {
            const res = await authApi.getMe();
            if (res.data) {
                const merged = { ...get().user, ...res.data };
                set({ user: merged });
                await AsyncStorage.setItem('user', JSON.stringify(merged));
            }
        } catch (e) {
            // 무시 — 기존 캐시 유지
        }
    },

    // 유저 정보 업데이트
    setUser: async (userData) => {
        const merged = { ...get().user, ...userData };
        set({ user: merged });
        await AsyncStorage.setItem('user', JSON.stringify(merged));
    },

    // 로그아웃
    logout: async () => {
        setLoggingOut(true);
        try {
            await authApi.logout();
        } catch (e) {
            // 무시
        }
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        usePointStore.getState().reset();
        const useChatStore = require('./chatStore').default;
        useChatStore.getState().reset();
        const useMatchStore = require('./matchStore').default;
        useMatchStore.getState().clearHomeCache();
        set({ user: null, token: null, isLoggedIn: false });
        clearAnalyticsUser();
        setTimeout(() => setLoggingOut(false), 2000);
    },

    // 회원 탈퇴
    withdraw: async (reason, refundData) => {
        setLoggingOut(true);
        try {
            await authApi.withdraw({ reason, ...refundData });
        } catch (e) {
            setLoggingOut(false);
            throw e;
        }
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        usePointStore.getState().reset();
        const useChatStore = require('./chatStore').default;
        useChatStore.getState().reset();
        const useMatchStore = require('./matchStore').default;
        useMatchStore.getState().clearHomeCache();
        set({ user: null, token: null, isLoggedIn: false });
        clearAnalyticsUser();
        setTimeout(() => setLoggingOut(false), 2000);
    },

    // 회원가입 데이터 업데이트
    updateSignupData: (data) => {
        set((state) => ({
            signupData: { ...state.signupData, ...data }
        }));
    },

    // 회원가입 데이터 초기화
    resetSignupData: () => {
        set({
            signupData: {
                socialType: null, socialId: null, email: null, name: null,
                phone: null, gender: null, birthDate: null,
                role: null, nickname: null, regionSido: null, regionSigungu: null,
                cars: [], driveLevel: null, driveModes: [], job: null, hobby: null, bio: null,
                profileImage: null, introduction: null, photos: [], referralCode: null, marketingAgree: false,
            }
        });
    },
}));

export default useAuthStore;
