import client from './client';
import useLikeStore from '../store/likeStore';

export const userApi = {
    /** 유저 좋아요 토글 — 결과를 likeStore에 반영 (다른 화면 즉시 동기화) */
    like: async (targetUserIdx) => {
        const res = await client.post('/v1/user/like', { targetUserIdx });
        useLikeStore.getState().setLike(Number(targetUserIdx), res.data.isLiked);
        return res;
    },

    /** 유저 좋아요 목록 (tab: 'sent' | 'received') */
    getLikeList: (tab) => client.post('/v1/user/like-list', { tab }),

    /**
     * 친구 찾기 — 활성 회원 목록
     * params: { page, limit, sort: 'recent'|'matchCount'|'manner',
     *          filters: { role, regionSido, regionSigungu, gender, age, carType } }
     */
    findList: (params) => client.post('/v1/user/find', params),
};
