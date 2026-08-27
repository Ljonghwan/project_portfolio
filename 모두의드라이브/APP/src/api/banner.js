import client from './client';

export const bannerApi = {
    getList: () => client.post('/banner'),
};
