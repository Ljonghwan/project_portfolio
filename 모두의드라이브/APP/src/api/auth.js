import client from './client';
import { logSignUp, logAccountDeleted } from '../utils/analytics';

export const authApi = {
    socialLogin: (data) =>
        client.post('/v1/auth/social-login', data),

    debugLogin: (userIdx) =>
        client.post('/v1/auth/debug-login', { userIdx }),

    signup: async (data) => {
        const res = await client.post('/v1/auth/signup', data);
        // 소셜 정보가 없으면 휴대폰 가입
        logSignUp(data?.socialType || 'phone', data?.role);
        return res;
    },

    refresh: (refreshToken) =>
        client.post('/v1/auth/refresh', { refreshToken }),

    getTerms: () =>
        client.post('/v1/auth/terms'),

    getTermDetail: (idx) =>
        client.post('/v1/auth/term-detail', { idx }),

    checkNickname: (nickname) =>
        client.post('/v1/auth/check-nickname', { nickname }),

    checkReferral: (referralCode) =>
        client.post('/v1/auth/check-referral', { referralCode }),

    registerReferral: (referralCode) =>
        client.post('/v1/auth/register-referral', { referralCode }),

    sendSms: (phone) =>
        client.post('/v1/auth/send-sms', { phone }),

    verifySms: (phone, code) =>
        client.post('/v1/auth/verify-sms', { phone, code }),

    getWithdrawTerms: () =>
        client.post('/v1/auth/withdraw-terms'),

    getMe: () =>
        client.post('/v1/auth/me'),

    logout: () =>
        client.post('/v1/auth/logout'),

    withdraw: async (data) => {
        const res = await client.post('/v1/auth/withdraw', data);
        logAccountDeleted();
        return res;
    },

    updatePhone: (phone, code) =>
        client.post('/v1/auth/update-phone', { phone, code }),

    updateProfile: (data) =>
        client.post('/v1/auth/update-profile', data),

    getNotificationSettings: () =>
        client.post('/v1/auth/notification-settings/get'),

    updateNotificationSetting: (key, value) =>
        client.post('/v1/auth/notification-settings/update', { key, value }),

    registerPushToken: (token, platform) =>
        client.post('/v1/auth/push-token', { token, platform }),

    getProfile: (userIdx) =>
        client.post('/v1/auth/profile', { userIdx }),

    viewProfile: (targetIdx) =>
        client.post('/v1/auth/profile/view', { targetIdx }),

    getProfilePhotos: (userIdx) =>
        client.get(`/v1/auth/profile/photos/${userIdx}`),

    getProfileReviews: (userIdx) =>
        client.get(`/v1/auth/profile/reviews/${userIdx}`),

    reportUser: (data) =>
        client.post('/v1/auth/report', data),

    blockUser: (blockedIdx) =>
        client.post('/v1/auth/block', { blockedIdx }),

    unblockUser: (blockedIdx) =>
        client.delete('/v1/auth/block', { data: { blockedIdx } }),

    getBlockList: () =>
        client.post('/v1/auth/block-list'),
};
