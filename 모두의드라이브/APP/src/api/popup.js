import client from './client';

export const popupApi = {
    getMain: () => client.post('/popup'),
};
