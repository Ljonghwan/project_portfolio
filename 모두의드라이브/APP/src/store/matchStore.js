import { create } from 'zustand';
import { matchApi } from '../api/match';
import { bannerApi } from '../api/banner';
import client from '../api/client';

const useMatchStore = create((set, get) => ({
    // 캐시: 홈 진입 시 즉시 노출하기 위한 prefetch 데이터
    ownerList: null,
    ownerTotalCount: 0,
    guestList: null,
    guestTotalCount: 0,
    banners: null,
    config: null,
    prefetchedAt: 0,

    setHomeData: (patch) => set((s) => ({ ...s, ...patch })),

    /**
     * 메인 홈 데이터 prefetch (오너 리스트 + 배너 + config)
     * - 로그인 직후, 자동 로그인 분기에서 호출
     * - 실패해도 silent (홈 진입 시 정상 fetch로 복구)
     */
    prefetchHome: async () => {
        try {
            const [ownerRes, bannerRes, configRes] = await Promise.allSettled([
                matchApi.getList({ authorRole: 'owner', page: 1, limit: 20 }),
                bannerApi.getList(),
                client.post('/config'),
            ]);
            const patch = { prefetchedAt: Date.now() };
            if (ownerRes.status === 'fulfilled') {
                const d = ownerRes.value?.data;
                patch.ownerList = d?.list || [];
                patch.ownerTotalCount = d?.totalCount || 0;
            }
            if (bannerRes.status === 'fulfilled') {
                patch.banners = bannerRes.value?.data || [];
            }
            if (configRes.status === 'fulfilled') {
                patch.config = configRes.value?.data || null;
            }
            set((s) => ({ ...s, ...patch }));
        } catch (e) {
            // silent
        }
    },

    /**
     * 캐시 무효화 (로그아웃 시)
     */
    clearHomeCache: () => set({
        ownerList: null,
        ownerTotalCount: 0,
        guestList: null,
        guestTotalCount: 0,
        banners: null,
        config: null,
        prefetchedAt: 0,
    }),
}));

export default useMatchStore;
