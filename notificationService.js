// services/notificationService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants'; // 1. استيراد Constants
import { Alert, Platform } from 'react-native';
import allTipsDataFromFile from './tips'; 

import {
  USER_SETTINGS_KEY,
  APP_LANGUAGE_KEY,
  DAILY_TIP_NOTIFICATION_TASK,
  DAILY_NOTIFICATION_ID, 
  LAST_TIP_INDEX_KEY,
} from './constants'; 

// 2. متغير لمعرفة هل نحن داخل Expo Go أم لا
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// إعداد Handler فقط لو لم نكن في Expo Go لتجنب المشاكل
if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// --- Core Notification Logic ---

// دالة جدولة النصيحة اليومية
async function scheduleDailyTipNotification(currentLanguage, allTranslations) {
  // حماية من الكراش في Expo Go
  if (isExpoGo) {
    console.log('[NotificationService] Skipped: Running in Expo Go');
    return;
  }

  const translations = allTranslations[currentLanguage] || allTranslations.en;
  
  try {
    if (!Device.isDevice) {
      console.log('[NotificationService] Skipping schedule on Simulator/Emulator');
      return;
    }

    const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    const settings = settingsString ? JSON.parse(settingsString) : {};

    if (settings.notifications === 'off') {
      console.log('[NotificationService] Notifications are OFF. Cancelling.');
      await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID);
      return;
    }

    const tipsForCurrentLanguage = allTipsDataFromFile[currentLanguage] || allTipsDataFromFile.en;
    if (!tipsForCurrentLanguage || tipsForCurrentLanguage.length === 0) return;

    const lastTipIndexString = await AsyncStorage.getItem(LAST_TIP_INDEX_KEY);
    let lastTipIndex = lastTipIndexString ? parseInt(lastTipIndexString, 10) : -1;
    const nextTipIndex = (lastTipIndex === -1 || isNaN(lastTipIndex)) ? 0 : (lastTipIndex + 1) % tipsForCurrentLanguage.length;
    const tipToSend = tipsForCurrentLanguage[nextTipIndex];

    const now = new Date();
    let triggerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0);
    
    if (now.getHours() >= 9) { 
      triggerDate.setDate(triggerDate.getDate() + 1);
    }

    await Notifications.cancelScheduledNotificationAsync(DAILY_NOTIFICATION_ID); 
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: translations.dailyTipNotificationTitle || (currentLanguage === 'ar' ? 'نصيحة اليوم' : 'Daily Tip'),
        body: tipToSend,
        sound: true,
        data: { screenToNavigate: 'Weight' } 
      },
      trigger: { date: triggerDate },
      identifier: DAILY_NOTIFICATION_ID,
    });

    await AsyncStorage.setItem(LAST_TIP_INDEX_KEY, nextTipIndex.toString());
    console.log(`[NotificationService] Scheduled for ${triggerDate.toLocaleString()}`);

  } catch (error) {
    console.error("[NotificationService] scheduleDailyTip Error:", error);
  }
}

// تسجيل المهمة في الخلفية
export async function registerDailyTipBackgroundTask(allTranslations, currentLanguage) {
  if (isExpoGo) return; // حماية

  try {
    const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
    const settings = settingsString ? JSON.parse(settingsString) : {};

    const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_TIP_NOTIFICATION_TASK);

    if (settings.notifications === 'off') {
      if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(DAILY_TIP_NOTIFICATION_TASK);
      }
      return;
    }

    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(DAILY_TIP_NOTIFICATION_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('[NotificationService] Background task registered.');
    }
  } catch (error) {
    console.warn('[NotificationService] Background fetch warning:', error.message);
  }
}


// --- Functions called from SettingsScreen ---

export async function enableDailyNotifications(currentLanguage, allTranslations) {
  const translations = allTranslations[currentLanguage] || allTranslations.en;
  
  // تنبيه المستخدم إذا كان يحاول التفعيل من Expo Go
  if (isExpoGo) {
    Alert.alert(
      "Expo Go Detected",
      "Notifications are not supported in Expo Go on Android (SDK 53+). Please use a Development Build."
    );
    return;
  }

  console.log("[NotificationService] Enabling daily notifications...");
  
  try {
    if (!Device.isDevice) {
      Alert.alert("Notice", "Notifications allow only on physical device.");
      return;
    }

    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;

    if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        finalStatus = newStatus;
    }

    if (finalStatus !== 'granted') {
        Alert.alert(
            translations.permissionRequiredTitle || "Permission Required", 
            translations.permissionRequiredMessage || "Please enable notifications in settings."
        );
        return;
    }
    
    await scheduleDailyTipNotification(currentLanguage, allTranslations);
    await registerDailyTipBackgroundTask(allTranslations, currentLanguage);

    Alert.alert(
        translations.notificationsEnabledAlert || "Success", 
        translations.notificationsEnabledMessage || "Notifications enabled successfully."
    );

  } catch (error) {
    console.error("[NotificationService] Error:", error);
    Alert.alert("Error", "Could not enable notifications.");
  }
}

export async function disableDailyNotifications(currentLanguage, allTranslations) {
  if (isExpoGo) return; // حماية

  const translations = allTranslations[currentLanguage] || allTranslations.en;
  console.log("[NotificationService] Disabling notifications...");
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(DAILY_TIP_NOTIFICATION_TASK);
        if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(DAILY_TIP_NOTIFICATION_TASK);
        }
    } catch (e) {
        console.log("Background task unregister ignored");
    }

    Alert.alert(
        translations.notificationsDisabledAlert || "Disabled", 
        translations.notificationsDisabledMessage || "Notifications turned off."
    );
  } catch (error) {
    console.error("[NotificationService] Error disabling:", error);
  }
}

// --- Initial Setup (Called from App.js) ---
export async function initializeNotificationsAndTasks(currentLanguage, navigation, allTranslations) {
  // أهم نقطة: الخروج فوراً إذا كنا في Expo Go لتجنب الـ Error الأحمر
  if (isExpoGo) {
    console.log("[NotificationService] Init skipped (Expo Go detected).");
    return;
  }

  if (!Device.isDevice) return;

  if (Platform.OS === 'android') {
    try {
        await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        });
    } catch (e) {
        console.warn("Channel setup failed:", e);
    }
  }

  Notifications.removeNotificationSubscription(null);
  
  Notifications.addNotificationResponseReceivedListener(response => {
    const screen = response.notification.request.content.data?.screenToNavigate;
    if (screen && navigation?.navigate) {
      navigation.navigate(screen);
    }
  });

  const settingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
  const settings = settingsString ? JSON.parse(settingsString) : {};

  if (settings.notifications !== 'off') {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') {
      await scheduleDailyTipNotification(currentLanguage, allTranslations);
      await registerDailyTipBackgroundTask(allTranslations, currentLanguage);
    }
  }
}