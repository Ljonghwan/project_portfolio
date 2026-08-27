import client from './client';
import {
    logMeetingDetailView,
    logMeetingCreated,
    logParticipationApplied,
    logApplicationApproved,
    logMatchCompleted,
    logDriveCompleted,
} from '../utils/analytics';

/** 매칭이 완료 상태로 관측되면 drive_completed 를 1회 발송한다 (analytics 쪽에서 중복 차단) */
function trackCompleted(match) {
    if (match?.status === 'completed') logDriveCompleted(match.idx);
}

export const matchApi = {
    /** 오너/게스트 매칭 목록 */
    getList: (params) => client.post('/v1/match/list', params),

    /** 내 매칭 목록 */
    getMyList: async (params) => {
        const res = await client.post('/v1/match/my-list', params);
        (res.data?.list ?? []).forEach(trackCompleted);
        return res;
    },

    /** 매칭 상세 */
    getDetail: async (idx) => {
        const res = await client.post('/v1/match/detail', { idx });
        const match = res.data;
        logMeetingDetailView({
            meetingId: match?.idx,
            meetingType: match?.matchType,
            region: match?.meetingRegions?.[0]?.sido,
        });
        trackCompleted(match);
        return res;
    },

    /** 매칭 신청 */
    apply: async (matchIdx, message) => {
        const res = await client.post('/v1/match/apply', { matchIdx, message });
        logParticipationApplied(matchIdx);
        return res;
    },

    /** 매칭 신청 취소 */
    cancel: (matchIdx) => client.post('/v1/match/cancel', { matchIdx }),

    /** 좋아요 토글 */
    like: (matchIdx) => client.post('/v1/match/like', { matchIdx }),

    /** 신청 수락 (작성자) */
    accept: async (matchIdx, participantIdx) => {
        const res = await client.post('/v1/match/accept', { matchIdx, participantIdx });
        logApplicationApproved(matchIdx);
        // 정원이 차서 이번 수락으로 매칭이 확정된 경우에만 (그룹 매칭 미충족이면 'matching')
        if (res.data?.newMatchStatus === 'confirmed') logMatchCompleted(matchIdx);
        return res;
    },

    /** 신청 거절 (작성자) */
    reject: (matchIdx, participantIdx) => client.post('/v1/match/reject', { matchIdx, participantIdx }),

    /** 매칭 삭제 (작성자) */
    deleteMatch: (matchIdx) => client.post('/v1/match/delete', { matchIdx }),

    /** 매칭 생성 */
    create: async (body) => {
        const res = await client.post('/v1/match/create', body);
        logMeetingCreated({
            meetingId: res.data?.idx,
            meetingType: body?.matchType,
            region: body?.meetingRegions?.[0]?.sido,
        });
        return res;
    },

    /** 매칭 수정 */
    update: (body) => client.post('/v1/match/update', body),

    /** 드라이브 시간대 겹침 검사 — result: { conflict } */
    checkSchedule: (params) => client.post('/v1/match/check-schedule', params),

    /** 좋아요 목록 (tab: 'sent' | 'received') */
    getLikeList: (tab) => client.post('/v1/match/like-list', { tab }),

    /** 노쇼 이의신청 대상 매칭 목록 */
    getInquiryTargets: () => client.post('/v1/match/inquiry-targets', {}),

    /** 진행 중 매칭 개수 (탈퇴 가드 등) */
    getActiveCount: () => client.post('/v1/match/active-count', {}),
};
