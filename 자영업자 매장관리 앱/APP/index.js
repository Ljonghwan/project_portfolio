import { PermissionsAndroid, Platform, Text, TextInput } from 'react-native';
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

import { getApp } from '@react-native-firebase/app';
import { getMessaging, requestPermission } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { LocaleConfig } from 'react-native-calendars';
import { throttle } from 'lodash';

import { initializeKakaoSDK } from '@react-native-kakao/core';

import dayjs from 'dayjs';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import 'dayjs/locale/ko';

import { forgegroundDisplayNotification, badgeReload } from '@/libs/utils';

console.red = (message, obj) => {
  console.log("\x1b[31m" + message + " " + JSON.stringify(obj, null, 2) + "\x1b[0m");
};
console.green = (message, obj) => {
  console.log("\x1b[32m" + message + " " + JSON.stringify(obj, null, 2) + "\x1b[0m");
};
console.yellow = (message, obj) => {
  console.log("\x1b[33m" + message + " " + JSON.stringify(obj, null, 2) + "\x1b[0m");
};

globalThis.RNFB_SILENCE_MODULAR_DEPRECATION_WARNINGS = true;

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false, // Reanimated runs in strict mode by default
});

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.allowFontScaling = false;
TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.allowFontScaling = false;

dayjs.locale('ko');
dayjs.extend(quarterOfYear);

LocaleConfig.locales['ko'] = {
    monthNames: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    monthNamesShort: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
    dayNames: ['일', '월', '화', '수', '목', '금', '토'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토']
};
  
LocaleConfig.defaultLocale = 'ko';

const firebase = getApp();
const messaging = getMessaging(firebase);

const throttledDataFunc = throttle(() => {
  badgeReload();
}, 1000, { leading: true, trailing: false });

// FCM 리스너 등록
try {
  messaging.onMessage(async remoteMessage => {
    if(!remoteMessage?.notification?.title || !remoteMessage?.notification?.body) return;
    
    forgegroundDisplayNotification({
      title: remoteMessage?.notification?.title || 'Title',
      body: remoteMessage?.notification?.body || 'Message',
      data: remoteMessage?.data
    });

    throttledDataFunc(); // 포그라운드일때는 IOS도 카운트 갱신
  });

  messaging.setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('FCM 백그라운드 푸시알림 들어옴!!', remoteMessage);
    if(Platform.OS === 'android') throttledDataFunc();
  });
  console.log('✅ Background message handler set successfully!');
} catch (e) {
  console.error('❌ Failed to set background handler:', e);
}

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
  handleError: (notificationId, error) => {
    console.log('notificationId, error', notificationId, error);
  },
  handleSuccess: (notificationId) => {
    console.log('notificationId, success', notificationId);
  },
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

initializeKakaoSDK('key_here');

requestPermissionFunc();

async function requestPermissionFunc() {

  if (Platform.OS === 'ios') {
    const authorizationStatus = await requestPermission(messaging);
    console.log('authorizationStatus', authorizationStatus);
  } else {
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  }

  // await checkBackgroundGpsPermission();
}







console.log('expo-router entry 시작');
// Register app entry through Expo Router
import 'expo-router/entry';
