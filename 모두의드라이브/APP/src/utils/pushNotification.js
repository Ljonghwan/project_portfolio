import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { authApi } from '../api/auth';
import useChatStore from '../store/chatStore';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
    if (error) return;
    const badge = data?.notification?.request?.content?.data?.badge;
    if (typeof badge === 'number') {
        Notifications.setBadgeCountAsync(badge).catch(() => {});
    }
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});

Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
        const data = notification.request.content.data;
        if (typeof data?.badge === 'number') {
            Notifications.setBadgeCountAsync(data.badge).catch(() => {});
        }
        // 현재 보고 있는 채팅방의 인앱 푸시는 표시하지 않음
        const currentRoomIdx = useChatStore.getState().currentRoomIdx;
        if (data?.type === 'chat' && currentRoomIdx != null && Number(data.roomIdx) === currentRoomIdx) {
            return {
                shouldShowAlert: false,
                shouldShowBanner: false,
                shouldShowList: false,
                shouldPlaySound: false,
                shouldSetBadge: false,
            };
        }
        // shouldShowAlert: 구버전 호환 / shouldShowBanner+shouldShowList: iOS 17+ (expo-notifications 0.28+) 필수
        return {
            shouldShowAlert: true,
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: true,
            shouldSetBadge: true,
        };
    },
});

export async function registerForPushNotifications() {
    if (!Device.isDevice) {
        console.warn('푸시 알림은 실기기에서만 동작합니다.');
        return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        // iOS 권한 옵션 명시 — 일부 기기/iOS 버전에서 옵션 미지정 시 알림 표시가 차단되는 사례가 있어 명시적으로 요청
        const { status } = await Notifications.requestPermissionsAsync({
            ios: {
                allowAlert: true,
                allowBadge: true,
                allowSound: true,
                allowAnnouncements: true,
                allowDisplayInCarPlay: true,
                allowCriticalAlerts: false,
                provideAppNotificationSettings: false,
                allowProvisional: false,
            },
        });
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('푸시 알림 권한이 거부되었습니다.');
        return null;
    }

    const projectId = '312269d5-ea0b-4168-8e20-f80244173db9';
    let token = null;
    try {
        const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
        token = tokenData.data;
        console.log(`[push] Expo token 발급 성공 (${Platform.OS} / ${Device.osName} ${Device.osVersion}):`, token);
    } catch (e) {
        console.warn('[push] Expo token 발급 실패:', e?.message || e);
        return null;
    }

    // 서버에 토큰 등록 (로그인 직후 refreshToken 미저장 시 실패할 수 있으므로 조용히 처리)
    try {
        await authApi.registerPushToken(token, Platform.OS);
    } catch (e) {
        console.log('[push] 푸시 토큰 등록 실패 (재시도 예정):', e?.message || e);
    }

    // Android 채널 설정
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: '기본 알림',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
        });
    }

    return token;
}
