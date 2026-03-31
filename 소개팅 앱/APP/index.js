// Import side effects first and services
import { Platform, Text, TextInput, PermissionsAndroid, Alert } from 'react-native';
import {
    configureReanimatedLogger,
    ReanimatedLogLevel,
} from 'react-native-reanimated';

import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import Permissions, { PERMISSIONS } from 'react-native-permissions';
import { throttle } from 'lodash';
import { LocaleConfig } from 'react-native-calendars';

import { badgeReload } from '@/libs/utils';

console.red = (message, obj) => {
    console.log("\x1b[31m" + message + " " + JSON.stringify(obj, null, 2) + "\x1b[0m");
};
console.green = (message, obj) => {
    console.log("\x1b[32m" + message + " " + JSON.stringify(obj, null, 2) + "\x1b[0m");
};
console.yellow = (message, obj) => {
    console.log("\x1b[33m" + message + " " + JSON.stringify(obj, null, 2) + "\x1b[0m");
};

LocaleConfig.locales['ko'] = {
    monthNames: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    monthNamesShort: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    dayNames: ['일', '월', '화', '수', '목', '금', '토'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토']
};
  
LocaleConfig.defaultLocale = 'ko';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true; // 파이어베이스 콘솔 경고성문구 제거
configureReanimatedLogger({
    level: ReanimatedLogLevel.error,
    strict: false, // Reanimated runs in strict mode by default
});

const throttledDataFunc = throttle(() => {
    badgeReload();
}, 1000, { leading: true, trailing: false });

// FCM 리스너 등록
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('FCM 백그라운드 푸시알림 들어옴!!', remoteMessage);
    if(Platform.OS === 'android') throttledDataFunc();
});

// SendbirdCalls.Logger.setLogLevel('info');

// Expo Notifications 설정
if (Platform.OS === 'android') {
    Notifications.deleteNotificationChannelAsync('expo_notifications_fallback_notification_channel');

    Notifications.setNotificationChannelAsync('default', {
        name: '앱 알림',  // "Miscellaneous" 대신 표시될 이름
        description: '앱 알림',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
    });
}
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});


requestPermission();
// requestPermission();

async function requestPermission() {

    if (Platform.OS === 'ios') {
        const authorizationStatus = await messaging().requestPermission();
        console.log('authorizationStatus', authorizationStatus);
    } else {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }

    const CALL_PERMISSIONS = Platform.select({
        // android: [PERMISSIONS.ANDROID.RECORD_AUDIO, PERMISSIONS.ANDROID.BLUETOOTH_CONNECT],
        android: [PERMISSIONS.ANDROID.RECORD_AUDIO],
        ios: [PERMISSIONS.IOS.MICROPHONE],
        default: [],
    });

    const result = await Permissions.requestMultiple(CALL_PERMISSIONS);
    console.log('result', result)

}


console.log('expo-router entry 시작');
// Register app entry through Expo Router
import 'expo-router/entry';
