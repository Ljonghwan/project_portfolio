import client from './client';

export async function getCouponList() {
    const res = await client.post('/v1/coupon/list');
    return res.data;
}

export async function useCoupon(userCouponIdx) {
    const res = await client.post('/v1/coupon/use', { userCouponIdx });
    // 서버는 { ok: true, status: 'used' } | { ok: false, msg: '...' } 반환
    if (!res.data?.ok) {
        throw new Error(res.data?.msg || '쿠폰 사용에 실패했습니다.');
    }
    return res.data;
}
