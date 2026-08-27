import client from './client';

const matchAlarmApi = {
    getList: () => client.post('/v1/match-alarm/list'),
    create: (data) => client.post('/v1/match-alarm/create', data),
    remove: (idx) => client.post('/v1/match-alarm/delete', { idx }),
    getCount: () => client.post('/v1/match-alarm/count'),
};

export default matchAlarmApi;
