import client from './client';

const chatApi = {
    getRooms: () => client.post('/v1/chat/rooms'),
    getMessages: (data) => client.post('/v1/chat/messages', data),
    getMessagesSince: (roomIdx, sinceIdx) => client.post('/v1/chat/messages', { roomIdx, sinceIdx, limit: 200 }),
    read: (roomIdx) => client.post('/v1/chat/read', { roomIdx }),
    send: (data) => client.post('/v1/chat/send', data),
    getUnreadTotal: () => client.post('/v1/chat/unread-total'),
    upload: (data) => client.post('/v1/chat/upload', data),
    uploadMulti: (data) => client.post('/v1/chat/upload-multi', data),
    getMatchStatus: (roomIdx) => client.post('/v1/chat/match-status', { roomIdx }),
    confirmMatch: (roomIdx) => client.post('/v1/chat/confirm-match', { roomIdx }),
    cancelMatch: (roomIdx) => client.post('/v1/chat/cancel-match', { roomIdx }),
    getMembers: (roomIdx) => client.post('/v1/chat/members', { roomIdx }),
    reportNoshow: (data) => client.post('/v1/chat/report-noshow', data),
    cancelNoshow: (data) => client.post('/v1/chat/cancel-noshow', data),
};

export default chatApi;
