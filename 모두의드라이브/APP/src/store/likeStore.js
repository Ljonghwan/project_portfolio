import { create } from 'zustand';

/**
 * 관심등록(좋아요) 상태 공유 — 화면 간 즉시 반영용
 * likes: { [userIdx]: boolean } — 서버 리스트 값보다 우선하는 오버라이드
 * 쓰기는 userApi.like() 한 곳에서만 수행 (모든 토글 호출부가 여기를 지남)
 */
const useLikeStore = create((set) => ({
    likes: {},
    setLike: (userIdx, isLiked) =>
        set((s) => ({ likes: { ...s.likes, [userIdx]: isLiked } })),
}));

export default useLikeStore;
