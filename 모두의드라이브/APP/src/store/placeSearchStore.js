import { create } from 'zustand';

// 후기 작성 화면과 장소 검색 페이지 간 결과 전달용 임시 스토어
// place-search.js → setPending → router.back() → write.js useFocusEffect → consume
const usePlaceSearchStore = create((set) => ({
    pending: null, // { index, place: { placeName, address, roadAddress, lat, lng } }

    setPending: (payload) => set({ pending: payload }),
    clear: () => set({ pending: null }),
}));

export default usePlaceSearchStore;
