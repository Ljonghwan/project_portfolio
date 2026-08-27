import client from './client';

export async function getEventList() {
    const res = await client.post('/v1/event/list');
    return res.data || [];
}

export async function getEventDetail(idx) {
    const res = await client.post('/v1/event/detail', { idx });
    return res.data;
}
