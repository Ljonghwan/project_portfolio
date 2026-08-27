import { create } from 'zustand';

let _id = 0;

const usePopupStore = create((set, get) => ({
    queue: [],

    show: (type, props = {}, priority = 0) => {
        const id = ++_id;
        set((state) => ({
            queue: [...state.queue, { id, type, props, priority }]
                .sort((a, b) => b.priority - a.priority),
        }));
        return id;
    },

    close: (id) => {
        set((state) => {
            if (id) {
                return { queue: state.queue.filter((p) => p.id !== id) };
            }
            // id 없으면 현재 최상위 팝업 닫기
            return { queue: state.queue.slice(1) };
        });
    },

    closeByType: (type) => {
        set((state) => ({
            queue: state.queue.filter((p) => p.type !== type),
        }));
    },

    closeAll: () => set({ queue: [] }),
}));

export default usePopupStore;
