import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import { startHttpMetric } from '../utils/analytics';

const client = axios.create({
    baseURL: API_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json', 'scd': process.env.EXPO_PUBLIC_SCD },
});

// ── 로그아웃 가드 ──
let isLoggingOut = false;

/** authStore.logout/withdraw에서 호출 — 인터셉터가 silentReAuth를 시도하지 않도록 */
export function setLoggingOut(flag) { isLoggingOut = flag; }

async function silentLogout() {
    if (isLoggingOut) return;
    isLoggingOut = true;
    try {
        await AsyncStorage.multiRemove(['token', 'refreshToken', 'user']);
        try {
            const useAuthStore = require('../store/authStore').default;
            useAuthStore.setState({ user: null, token: null, isLoggedIn: false });
        } catch {}
    } finally {
        setTimeout(() => { isLoggingOut = false; }, 1000);
    }
}

// ── Refresh queue (race condition 방지) ──
let refreshPromise = null;

async function refreshTokens() {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    const token = await AsyncStorage.getItem('token');

    if (!refreshToken) throw new Error('no_refresh_token');

    try {
        // 1차: refresh token으로 갱신 시도
        const res = await axios.post(`${API_URL}/v1/auth/refresh`, {
            refreshToken,
        }, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const newToken = res.data.token;
        const newRefreshToken = res.data.refreshToken;

        await AsyncStorage.setItem('token', newToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        return newToken;
    } catch (refreshError) {
        // 2차: refresh 실패 → 저장된 소셜 정보로 silent re-auth
        return await silentReAuth();
    }
}

async function silentReAuth() {
    try {
        const userStr = await AsyncStorage.getItem('user');
        if (!userStr) throw new Error('no_user');

        const user = JSON.parse(userStr);
        if (!user.socialType || !user.socialId) throw new Error('no_social_info');

        const res = await axios.post(`${API_URL}/v1/auth/social-login`, {
            socialType: user.socialType,
            socialId: user.socialId,
        }, {
            headers: { 'Content-Type': 'application/json', 'scd': process.env.EXPO_PUBLIC_SCD },
        });

        const data = res.data;

        // 정지/탈퇴/신규 유저면 재인증 불가
        if (data.isNewUser || data.code === 'suspended') throw new Error('cannot_reauth');

        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);
        if (data.user) {
            await AsyncStorage.setItem('user', JSON.stringify({ ...user, ...data.user }));
        }

        // zustand store도 갱신
        try {
            const useAuthStore = require('../store/authStore').default;
            useAuthStore.setState({ token: data.token, isLoggedIn: true });
        } catch {}

        return data.token;
    } catch (e) {
        console.warn('silentReAuth failed:', e?.message);
        throw new Error('reauth_failed');
    }
}

// 동시 요청 시 하나만 refresh, 나머지는 대기
function getNewToken() {
    if (!refreshPromise) {
        refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

// ── CRUD 최소 딜레이 (300ms) — GET/리스트 제외 ──
const CRUD_DELAY_MS = 300;
const crudMethods = new Set(['post', 'put', 'patch', 'delete']);

client.interceptors.request.use(async (config) => {
    if (crudMethods.has((config.method || '').toLowerCase())) {
        config._crudStart = Date.now();
    }
    // Firebase Performance — API 응답 시간 계측
    config._perf = startHttpMetric(`${config.baseURL || ''}${config.url || ''}`, config.method);
    // 토큰 자동 첨부
    const token = await AsyncStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

function ensureMinDelay(config) {
    if (!config?._crudStart) return Promise.resolve();
    const elapsed = Date.now() - config._crudStart;
    const remaining = CRUD_DELAY_MS - elapsed;
    if (remaining > 0) return new Promise(r => setTimeout(r, remaining));
    return Promise.resolve();
}

// ── 응답 인터셉터 — 9998 시 토큰 갱신 ──
client.interceptors.response.use(
    async (response) => {
        response.config?._perf?.stop(response.status);
        await ensureMinDelay(response.config);
        return response;
    },
    async (error) => {
        error.config?._perf?.stop(error.response?.status);
        await ensureMinDelay(error.config);
        const originalRequest = error.config;

        if (error.response?.status === 500 && error.response?.data?.code === 9998 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isLoggingOut) {
                return Promise.reject(error);
            }

            try {
                const newToken = await getNewToken();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return client(originalRequest);
            } catch {
                await silentLogout();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default client;
