import client from './client';

export async function getNoticeList() {
    const res = await client.post('/v1/notice/list');
    return res.data || [];
}

export async function getNoticeDetail(idx) {
    const res = await client.post('/v1/notice/detail', { idx });
    return res.data;
}
