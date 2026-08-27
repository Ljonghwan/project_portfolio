// Import side effects first and services
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform, Text, TextInput, PermissionsAndroid } from 'react-native';

import { getApp } from '@react-native-firebase/app';
import { getMessaging, onMessage, setBackgroundMessageHandler, requestPermission } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from 'react-native-reanimated';

import { badgeReload, forgegroundDisplayNotification, checkBackgroundGpsPermission } from '@/libs/utils';
import { useGps } from '@/libs/store';

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

/** GPS Task */
// TaskManager.unregisterAllTasksAsync();
// TaskManager.defineTask("location", ({ data: { locations }, error }) => {
//   if (error) {
//     // check `error.message` for more details.
//     console.log('Received new error', error);
//     return;
//   }

//   const lat = locations?.[0]?.coords?.latitude;
//   const lng = locations?.[0]?.coords?.longitude;
//   const accuracy = locations?.[0]?.coords?.accuracy;

//   if (!lat || !lng) return;

//   const setGps = useGps.getState().setGps;
//   setGps({ lat, lng, accuracy });
//   console.log('Received new locations -> ' + Platform.OS , { lat, lng, accuracy } );
// });

const firebase = getApp();
const messaging = getMessaging(firebase);

// FCM 리스너 등록
try {
  messaging.onMessage(async remoteMessage => {
    if(!remoteMessage?.notification?.title || !remoteMessage?.notification?.body) return;
    
    forgegroundDisplayNotification({
      title: remoteMessage?.notification?.title || 'Title',
      body: remoteMessage?.notification?.body || 'Message',
      data: remoteMessage?.data
    });
  });

  messaging.setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('FCM 백그라운드 푸시알림 들어옴!!', remoteMessage);
    badgeReload();
  });
  console.log('✅ Background message handler set successfully!');
} catch (e) {
  console.error('❌ Failed to set background handler:', e);
}


// Expo Notifications 설정
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
