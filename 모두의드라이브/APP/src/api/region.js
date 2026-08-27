import client from './client';

export const regionApi = {
    getSido: () => client.post('/v1/region/sido'),
    getSigungu: (sido) => client.post('/v1/region/sigungu', { sido }),
};
