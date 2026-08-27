import client from './client';
import { logReviewWritten } from '../utils/analytics';

export const reviewApi = {
    /** 드라이브 리뷰 목록 */
    getList: (params) => client.post('/v1/review/list', params),

    /** 드라이브 리뷰 상세 */
    getDetail: (idx) => client.get(`/v1/review/detail/${idx}`),

    /** 매너 평가 작성 */
    createMannerEval: (data) => client.post('/v1/review/manner-eval', data),

    /** 장소 검색 (네이버 지역검색 프록시, 페이지네이션 지원) */
    searchPlace: (query, start = 1) => client.post('/v1/review/search-place', { query, start }),

    /** 드라이브 후기 작성 */
    createReview: async (data) => {
        const res = await client.post('/v1/review/create', data);
        logReviewWritten(data?.matchIdx);
        return res;
    },

    /** 내 매너평가 목록 (tab: 'received' | 'sent') */
    getMyEvaluations: (tab) => client.post('/v1/review/my-evaluations', { tab }),

    /** 평가 미완료 매칭 목록 */
    getPendingEvaluations: () => client.post('/v1/review/pending-evaluations'),

    /** 본인 드라이브 후기 작성 여부 체크 */
    checkMyReview: (matchIdx) => client.post('/v1/review/check-my-review', { matchIdx }),
};
