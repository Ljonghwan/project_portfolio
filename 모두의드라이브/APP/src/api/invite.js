import client from './client';

/**
 * 추천 정보 조회
 * @returns {Promise<{ referralCode, referralCount, referralMaxCount, pointsEarned, hasRegistered }>}
 */
export async function getReferralInfo() {
    const res = await client.post('/v1/auth/referral-info');
    return res.data;
}

/**
 * 추천코드 등록
 */
export async function registerReferral(referralCode) {
    const res = await client.post('/v1/auth/register-referral', { referralCode });
    return res.data;
}

