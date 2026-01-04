// config/constants.js

// AsyncStorage Keys
export const USER_SETTINGS_KEY = '@Settings:generalSettings';
export const APP_LANGUAGE_KEY = '@App:language';
export const APP_DARK_MODE_KEY = '@App:darkMode';
export const USER_PROFILE_DATA_KEY = '@Profile:userProfileData';
export const INTENDED_ROUTE_AFTER_RESTART_KEY = '@App:intendedRouteAfterRestart'; // From your App.js

// Notification and Task Related Keys
export const LAST_TIP_INDEX_KEY = '@App:daily_tip_last_index_v4'; // Incremented version
export const DAILY_TIP_NOTIFICATION_TASK = '@App:DAILY_TIP_NOTIFICATION_TASK_V4';
export const DAILY_NOTIFICATION_ID = 'daily_tip_notification_id_v4';

// Example of app-wide translations (can be expanded or managed differently)
export const appTranslations = {
  ar: {
    restartTitle: "إعادة تشغيل التطبيق",
    restartMessage: "تم تغيير اللغة. يرجى إعادة تشغيل التطبيق لتطبيق التغييرات.",
    okButton: "موافق",
    manualRestartMessage: "تم تغيير اللغة. يرجى إعادة تشغيل التطبيق يدويًا لتطبيق التغييرات.",
    permissionRequiredTitle: "إذن مطلوب",
    permissionRequiredMessage: "نحتاج إذن الإشعارات لنرسل لك نصائح يومية!",
    dailyTipNotificationTitle: "💡 نصيحة اليوم",
    notificationsEnabledAlert: "تمكين الإشعارات",
    notificationsEnabledMessage: "سيتم الآن جدولة النصائح اليومية.",
    notificationsDisabledAlert: "تعطيل الإشعارات",
    notificationsDisabledMessage: "لن يتم الآن جدولة النصائح اليومية.",
    errorAlertTitle: "خطأ",
    enableErrorAlertMessage: "لم نتمكن من تمكين الإشعارات.",
    disableErrorAlertMessage: "لم نتمكن من تعطيل الإشعارات."
  },
  en: {
    restartTitle: "App Restart",
    restartMessage: "Language has been changed. Please restart the app to apply changes.",
    okButton: "OK",
    manualRestartMessage: "Language has been changed. Please restart the app manually to apply changes.",
    permissionRequiredTitle: "Permission Required",
    permissionRequiredMessage: "We need notification permissions to send you daily tips!",
    dailyTipNotificationTitle: "💡 Daily Tip",
    notificationsEnabledAlert: "Notifications Enabled",
    notificationsEnabledMessage: "Daily tips will now be scheduled.",
    notificationsDisabledAlert: "Notifications Disabled",
    notificationsDisabledMessage: "Daily tips will no longer be scheduled.",
    errorAlertTitle: "Error",
    enableErrorAlertMessage: "Could not enable notifications.",
    disableErrorAlertMessage: "Could not disable notifications."
  }
};