import client from './client';

/**
 * 포인트 잔액 조회
 * @returns {Promise<{ total: number, paid: number, free: number }>}
 */
export async function getPointBalance() {
    const res = await client.post('/v1/point/balance');
    return res.data || { total: 0, paid: 0, free: 0 };
}

/**
 * 포인트 내역 조회
 * @param {'all'|'charge'|'earn'|'spend'} filter
 */
export async function getPointHistory(filter = 'all') {
    const res = await client.post('/v1/point/history', { filter });
    return res.data || [];
}

/**
 * [C123] 페이레터 결제 요청 (Android) — 결제창 URL 수신
 * amount는 서버가 강제하므로 클라는 productId + 결제수단(method)만 전송
 * @param {{ productId: string, method: 'card'|'kakaopay' }} params
 * @returns {Promise<{ paymentUrl: string, orderNo: string }>}
 */
export async function chargePointRequest({ productId, method }) {
    const res = await client.post('/v1/point/payment/request', { productId, method });
    return res.data;
}

/**
 * 인앱결제 포인트 충전 (iOS)
 */
export async function chargePointIAP({ productId, receipt, platform }) {
    const res = await client.post('/v1/point/charge-iap', { productId, receipt, platform });
    return res.data;
}

/**
 * 환불 신청
 */
export async function requestRefund({ bankName, accountNumber, accountHolder }) {
    const res = await client.post('/v1/point/refund', { bankName, accountNumber, accountHolder });
    return res.data;
}
