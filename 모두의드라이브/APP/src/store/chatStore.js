import { create } from 'zustand';
import * as Notifications from 'expo-notifications';

function updateBadge(count) {
    Notifications.setBadgeCountAsync(Math.max(0, count)).catch(() => {});
}

const useChatStore = create((set) => ({
    unreadTotal: 0,
    setUnreadTotal: (total) => {
        const count = Math.max(0, total);
        updateBadge(count);
        set({ unreadTotal: count });
    },
    decrement: (amount = 1) => set((state) => {
        const count = Math.max(0, state.unreadTotal - amount);
        updateBadge(count);
        return { unreadTotal: count };
    }),
    reset: () => {
        updateBadge(0);
        set({ unreadTotal: 0 });
    },
    pendingAction: null,
    setPendingAction: (action) => set({ pendingAction: action }),
    currentRoomIdx: null,
    setCurrentRoom: (roomIdx) => set({ currentRoomIdx: Number(roomIdx) }),
    clearCurrentRoom: () => set({ currentRoomIdx: null }),
}));

export default useChatStore;
