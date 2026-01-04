import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  I18nManager,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useFocusEffect } from '@react-navigation/native';
import * as Updates from 'expo-updates';
import { supabase } from './supabaseClient'; // 1. استيراد Supabase

const USER_SETTINGS_KEY = '@Settings:generalSettings';
const USER_PROFILE_DATA_KEY = '@Profile:userProfileData';
const USER_SUBSCRIPTION_DATA_KEY = '@App:userSubscriptionData';

const SettingsScreen = ({
  navigation,
  languageProp,
  changeLanguageProp,
  darkModeProp,
  toggleDarkModeProp,
  goBack,
  updateGoalWeightInParent,
  enableNotifications,
  disableNotifications,
}) => {
  const [isUserPremium, setIsUserPremium] = useState(false); 
  
  useFocusEffect(
    useCallback(() => {
      const checkUserStatus = async () => {
        try {
            const subscriptionDataString = await AsyncStorage.getItem(USER_SUBSCRIPTION_DATA_KEY);
            let isPremium = false;
            if (subscriptionDataString) {
                const subscriptionData = JSON.parse(subscriptionDataString);
                if (subscriptionData.expiryDate && Date.now() < subscriptionData.expiryDate) {
                    isPremium = true;
                } else if (subscriptionData.expiryDate) {
                    await AsyncStorage.removeItem(USER_SUBSCRIPTION_DATA_KEY);
                }
            }
            setIsUserPremium(isPremium);
        } catch (e) {
          console.error("Failed to load premium status.", e);
          setIsUserPremium(false);
        }
      };
      checkUserStatus();
    }, [])
  );

  const [username, setUsername] = useState('');
  const [height, setHeight] = useState('');
  const [weightGoal, setWeightGoal] = useState('');
  const [notifications, setNotifications] = useState('on');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(languageProp);
  const [isDarkMode, setIsDarkMode] = useState(darkModeProp);

  useEffect(() => {
    setSelectedLanguage(languageProp);
    setIsDarkMode(darkModeProp);
  }, [languageProp, darkModeProp]);

  const translations = {
    ar: {
      settingsTitle: 'الإعدادات', usernameLabel: 'اسم المستخدم:', heightLabel: 'الطول (سم):', weightGoalLabel: 'هدف الوزن (كجم):', languageLabel: 'اللغة:', notificationsLabel: 'الإشعارات:', notificationsOn: 'تشغيل', notificationsOff: 'إيقاف', saveButton: 'حفظ الإعدادات', modalMessage: 'تم حفظ الإعدادات ومزامنتها بنجاح!', modalButton: 'موافق', darkModeLabel: 'الوضع الداكن:', backArrow: '←', saveErrorTitle: 'خطأ', saveErrorMessage: 'فشل حفظ الإعدادات.', loadErrorTitle: 'خطأ', loadErrorMessage: 'فشل تحميل الإعدادات.', placeholderUsername: 'أدخل اسم المستخدم', placeholderHeight: 'أدخل الطول', placeholderWeightGoal: 'أدخل الوزن المستهدف', languageChangeAlertTitle: "تغيير اللغة", languageChangeAlertMessage: "تم تحديث إعدادات اللغة. سيتم إعادة تشغيل التطبيق الآن.", premiumFeature: 'ميزة مميزة', upgradePrompt: 'هذه الميزة متاحة فقط للمشتركين. هل ترغب بالترقية الآن؟', upgrade: 'ترقية', cancel: 'إلغاء',
    },
    en: {
      settingsTitle: 'Settings', usernameLabel: 'Username:', heightLabel: 'Height (cm):', weightGoalLabel: 'Weight Goal (kg):', languageLabel: 'Language:', notificationsLabel: 'Notifications:', notificationsOn: 'On', notificationsOff: 'Off', saveButton: 'Save Settings', modalMessage: 'Settings saved & synced successfully!', modalButton: 'OK', darkModeLabel: 'Dark Mode:', backArrow: '←', saveErrorTitle: 'Error', saveErrorMessage: 'Failed to save settings.', loadErrorTitle: 'Error', loadErrorMessage: 'Failed to load settings.', placeholderUsername: 'Enter username', placeholderHeight: 'Enter height', placeholderWeightGoal: 'Enter weight goal', languageChangeAlertTitle: "Language Change", languageChangeAlertMessage: "Language settings updated. The app will restart now.", premiumFeature: 'Premium Feature', upgradePrompt: 'This feature is available for premium users only. Would you like to upgrade now?', upgrade: 'Upgrade', cancel: 'Cancel',
    }
  };
  
  const t = translations[selectedLanguage] || translations.en;
  
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const generalSettingsString = await AsyncStorage.getItem(USER_SETTINGS_KEY);
        if (generalSettingsString) {
          const gs = JSON.parse(generalSettingsString);
          setHeight(gs.height ? String(gs.height) : '');
          setWeightGoal(gs.weightGoal ? String(gs.weightGoal) : '');
          setNotifications(gs.notifications === undefined ? 'on' : gs.notifications);
        }
        const profileDataString = await AsyncStorage.getItem(USER_PROFILE_DATA_KEY);
        if (profileDataString) {
          const pd = JSON.parse(profileDataString);
          setUsername(pd.username || '');
        }
      } catch (error) {
        console.error("[SettingsScreen] Failed to load form data:", error);
      }
    };
    loadFormData();
  }, []);

  const saveAllSettings = async () => {
    try {
      const generalSettings = { height: height, weightGoal: weightGoal, notifications: notifications };
      const profileData = { username: username };
      
      // 1. الحفظ المحلي (AsyncStorage)
      await AsyncStorage.setItem(USER_SETTINGS_KEY, JSON.stringify(generalSettings));
      await AsyncStorage.setItem(USER_PROFILE_DATA_KEY, JSON.stringify(profileData));

      // 2. المزامنة مع Supabase (Update Cloud)
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const updates = {
              full_name: username,
              height: height ? parseFloat(height) : null,
              weight_goal: weightGoal ? parseFloat(weightGoal) : null,
              updated_at: new Date(),
          };
          
          const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
          if (error) console.log("Error syncing settings to Supabase:", error);
      }

      // --- منطق تغيير اللغة ---
      if (selectedLanguage !== languageProp) {
          await AsyncStorage.setItem('appLanguage', selectedLanguage);
          
          const isAr = selectedLanguage === 'ar';
          I18nManager.allowRTL(true);
          I18nManager.forceRTL(isAr);

          Alert.alert(
              t.languageChangeAlertTitle,
              t.languageChangeAlertMessage,
              [{
                  text: t.modalButton,
                  onPress: async () => {
                      try { await Updates.reloadAsync(); } catch (e) { console.log("Reload failed", e); }
                  }
              }],
              { cancelable: false }
          );
          return; 
      }

      if (toggleDarkModeProp && isDarkMode !== darkModeProp) { await toggleDarkModeProp(isDarkMode); }
      if (updateGoalWeightInParent) { updateGoalWeightInParent(weightGoal); }
      if (notifications === 'on') { if (enableNotifications) enableNotifications(); } else { if (disableNotifications) disableNotifications(); }
      
      setModalVisible(true);

    } catch (error) {
      console.error("[SettingsScreen] Failed to save settings:", error);
      Alert.alert(t.saveErrorTitle, t.saveErrorMessage);
    }
  };
  
  const handlePremiumFeaturePress = () => {
    if (!isUserPremium) {
      Alert.alert(t.premiumFeature, t.upgradePrompt, [{ text: t.cancel, style: 'cancel' }, { text: t.upgrade, onPress: () => navigation.navigate('PremiumScreen') }]);
    }
  };

  const handleGoBack = () => { if (goBack) goBack(); else if (navigation) navigation.goBack(); };
  const handleLanguageChange = (newLang) => setSelectedLanguage(newLang);
  const handleDarkModeToggle = (newDarkModeValue) => setIsDarkMode(newDarkModeValue === 'true');
  const dynamicStyles = styles(isDarkMode, isUserPremium);

  const PremiumPickerWrapper = ({ children, isLocked }) => {
    if (isLocked) { 
        return ( <TouchableOpacity onPress={handlePremiumFeaturePress} style={dynamicStyles.disabledOverlay}>{children}</TouchableOpacity> ); 
    }
    return children;
  };

  return (
    <ScrollView style={dynamicStyles.outerContainer} contentContainerStyle={dynamicStyles.scrollContentContainer} keyboardShouldPersistTaps="handled" key={`${selectedLanguage}-${isDarkMode}-${isUserPremium}`} >
      <View style={dynamicStyles.container}>
        <View style={dynamicStyles.header}>
          <TouchableOpacity onPress={handleGoBack} style={dynamicStyles.backButtonWrapper}>
             <Icon name="arrow-back" size={24} color={isDarkMode ? '#e0e0e0' : '#004d40'} style={selectedLanguage === 'ar' ? { transform: [{ scaleX: -1 }] } : {}} />
          </TouchableOpacity>
          <Text style={dynamicStyles.title}>{t.settingsTitle}</Text>
          <View style={dynamicStyles.headerPlaceholder} />
        </View>

        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.usernameLabel}</Text>
          <TextInput style={dynamicStyles.input} value={username} onChangeText={setUsername} placeholder={t.placeholderUsername} placeholderTextColor={isDarkMode ? '#aaa' : '#999'} />
        </View>

        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.heightLabel}</Text>
          <TextInput style={dynamicStyles.input} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder={t.placeholderHeight} placeholderTextColor={isDarkMode ? '#aaa' : '#999'} />
        </View>

        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.weightGoalLabel}</Text>
          <TextInput style={dynamicStyles.input} value={weightGoal} onChangeText={setWeightGoal} keyboardType="numeric" placeholder={t.placeholderWeightGoal} placeholderTextColor={isDarkMode ? '#aaa' : '#999'} />
        </View>
        
        <View style={dynamicStyles.settingItem}>
          <Text style={dynamicStyles.label}>{t.languageLabel}</Text>
          <View style={dynamicStyles.pickerContainer}>
            <Picker selectedValue={selectedLanguage} style={dynamicStyles.picker} onValueChange={handleLanguageChange} dropdownIconColor={isDarkMode ? '#ffffff' : '#555'} itemStyle={dynamicStyles.pickerItem} mode="dropdown">
              <Picker.Item label="العربية" value="ar" /><Picker.Item label="English" value="en" />
            </Picker>
          </View>
        </View>
        
        <View style={dynamicStyles.settingItem}>
          <View style={dynamicStyles.labelContainer}><Text style={dynamicStyles.label}>{t.notificationsLabel}</Text>{!isUserPremium && <Text style={dynamicStyles.premiumIcon}>👑</Text>}</View>
          <PremiumPickerWrapper isLocked={!isUserPremium}>
            <View style={[dynamicStyles.pickerContainer, !isUserPremium && dynamicStyles.disabledPickerContainer]}>
              <Picker enabled={isUserPremium} selectedValue={notifications} style={[dynamicStyles.picker, !isUserPremium && dynamicStyles.disabledText]} onValueChange={(itemValue) => setNotifications(itemValue)} dropdownIconColor={isDarkMode ? '#ffffff' : '#555'} itemStyle={dynamicStyles.pickerItem} mode="dropdown">
                <Picker.Item label={t.notificationsOn} value="on" /><Picker.Item label={t.notificationsOff} value="off" />
              </Picker>
            </View>
          </PremiumPickerWrapper>
        </View>
        
        <View style={dynamicStyles.settingItem}>
          <View style={dynamicStyles.labelContainer}><Text style={dynamicStyles.label}>{t.darkModeLabel}</Text>{!isUserPremium && <Text style={dynamicStyles.premiumIcon}>👑</Text>}</View>
          <PremiumPickerWrapper isLocked={!isUserPremium}>
            <View style={[dynamicStyles.pickerContainer, !isUserPremium && dynamicStyles.disabledPickerContainer]}>
              <Picker enabled={isUserPremium} selectedValue={String(isDarkMode)} style={[dynamicStyles.picker, !isUserPremium && dynamicStyles.disabledText]} onValueChange={handleDarkModeToggle} dropdownIconColor={isDarkMode ? '#ffffff' : '#555'} itemStyle={dynamicStyles.pickerItem} mode="dropdown">
                <Picker.Item label={t.notificationsOn} value="true" /><Picker.Item label={t.notificationsOff} value="false" />
              </Picker>
            </View>
          </PremiumPickerWrapper>
        </View>

        <View style={dynamicStyles.saveButtonContainer}><Button title={t.saveButton} onPress={saveAllSettings} color={isDarkMode ? '#4CAF50' : '#388e3c'} /></View>

        <Modal visible={modalVisible} animationType="fade" transparent={true} onRequestClose={() => setModalVisible(false)}>
          <View style={dynamicStyles.modalOverlay}><View style={dynamicStyles.modalContent}><Text style={dynamicStyles.modalMessage}>{t.modalMessage}</Text><Button title={t.modalButton} onPress={() => setModalVisible(false)} color={isDarkMode ? '#4CAF50' : '#388e3c'} /></View></View>
        </Modal>
      </View>
    </ScrollView>
  );
};

const styles = (isDarkMode, isUserPremium) => StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: isDarkMode ? '#121212' : '#e8f5e9' }, scrollContentContainer: { padding: 20, flexGrow: 1 }, container: { flex: 1, backgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff', borderRadius: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDarkMode ? 0.6 : 0.25, shadowRadius: 3.84, elevation: 5, padding: 20 }, header: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#333' : '#eee' }, backButtonWrapper: { padding: 5 }, backButton: { fontSize: 28, color: isDarkMode ? '#FFFFFF' : '#388e3c', fontWeight: 'bold' }, title: { fontSize: 22, fontWeight: 'bold', color: isDarkMode ? '#e0e0e0' : '#004d40', textAlign: 'center', flex: 1 }, headerPlaceholder: { width: 38 }, settingItem: { marginBottom: 18 }, label: { marginBottom: 8, fontSize: 15, fontWeight: '600', color: isDarkMode ? '#bdbdbd' : '#004d40', textAlign: I18nManager.isRTL ? 'right' : 'left' }, input: { height: 50, width: '100%', paddingHorizontal: 15, borderWidth: 1, borderColor: isDarkMode ? '#444' : '#ccc', borderRadius: 8, fontSize: 16, color: isDarkMode ? '#ffffff' : '#333333', backgroundColor: isDarkMode ? '#333333' : '#f8f8f8', textAlignVertical: 'center', textAlign: I18nManager.isRTL ? 'right' : 'left' }, pickerContainer: { height: 50, width: '100%', backgroundColor: isDarkMode ? '#333333' : '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#444' : '#ccc', justifyContent: 'center', overflow: 'hidden' }, picker: { width: '100%', height: '100%', color: isDarkMode ? '#ffffff' : '#333333', backgroundColor: 'transparent' }, pickerItem: Platform.select({ android: { color: isDarkMode ? '#ffffff' : '#333333', backgroundColor: isDarkMode ? '#333333' : '#f8f8f8' }, ios: { color: isDarkMode ? '#ffffff' : '#333333' } }), saveButtonContainer: { marginTop: 10 }, modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.6)' }, modalContent: { backgroundColor: isDarkMode ? '#333333' : '#ffffff', padding: 30, borderRadius: 10, width: '85%', maxWidth: 320, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6 }, modalMessage: { fontSize: 18, marginBottom: 30, color: isDarkMode ? '#e0e0e0' : '#333333', textAlign: 'center', fontWeight: '500' }, labelContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' }, premiumIcon: { fontSize: 16, marginLeft: I18nManager.isRTL ? 0 : 8, marginRight: I18nManager.isRTL ? 8 : 0, color: '#FFD700' }, disabledPickerContainer: { backgroundColor: isDarkMode ? '#2a2a2a' : '#e0e0e0', borderColor: isDarkMode ? '#3a3a3a' : '#bdbdbd' }, disabledText: { color: isDarkMode ? '#777' : '#9E9E9E' }, disabledOverlay: {},
});

export default SettingsScreen;