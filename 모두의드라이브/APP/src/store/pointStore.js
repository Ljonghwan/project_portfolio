import { create } from 'zustand';
import { getPointBalance } from '../api/point';

const usePointStore = create((set, get) => ({
    total: 0,
    paid: 0,
    free: 0,
    loaded: false,

    fetchBalance: async () => {
        try {
            const data = await getPointBalance();
            set({
                total: data?.total ?? 0,
                paid: data?.paid ?? 0,
                free: data?.free ?? 0,
                loaded: true,
            });
        } catch {
            set({ loaded: true });
        }
    },

    refreshBalance: async () => {
        await get().fetchBalance();
    },

    reset: () => set({ total: 0, paid: 0, free: 0, loaded: false }),
}));

export default usePointStore;
