import client from './client';

export default {
  getList: () => client.post('/v1/notification/list'),
  read: (idx) => client.post('/v1/notification/read', { idx }),
  readAll: () => client.post('/v1/notification/read-all'),
  getUnreadCount: () => client.post('/v1/notification/unread-count'),
};
