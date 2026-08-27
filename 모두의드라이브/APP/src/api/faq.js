import client from './client';

export async function getFaqCategories() {
    const res = await client.post('/v1/faq/categories');
    return res.data || [];
}

export async function getFaqList(categoryIdx) {
    const params = {};
    if (categoryIdx) params.categoryIdx = categoryIdx;
    const res = await client.post('/v1/faq/list', params);
    return res.data || [];
}

export async function getFaqDetail(idx) {
    const res = await client.post('/v1/faq/detail', { idx });
    return res.data;
}
