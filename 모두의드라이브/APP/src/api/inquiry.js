import client from './client';

export async function getInquiryList() {
    const res = await client.post('/v1/inquiry/list');
    return res.data;
}

export async function createInquiry(data) {
    const res = await client.post('/v1/inquiry/create', data);
    return res.data;
}
