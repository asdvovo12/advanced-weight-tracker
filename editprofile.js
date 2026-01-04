// EditProfileScreen.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  TextInput,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { launchImageLibrary } from 'react-native-image-picker';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import defaultAvatar from './assets/profile.png'; // Ensure this path is correct

// --- Constants (No changes) ---
const PRIMARY_GREEN_COLOR_LIGHT = '#4CAF50';
const PRIMARY_GREEN_COLOR_DARK = '#2E7D32';
const LOGGED_IN_EMAIL_KEY = 'loggedInUserEmail';
const USER_PROFILE_DATA_KEY = '@Profile:userProfileData';
const DEFAULT_PROFILE_IMAGE = defaultAvatar;

// --- Translation Dictionary (No changes) ---
const translations = {
  ar: {
    editProfileTitle: 'تعديل الملف الشخصي',
    saveButton: 'حفظ',
    loading: 'جار التحميل...',
    usernameLabel: 'اسم المستخدم:',
    usernamePlaceholder: 'أدخل اسم المستخدم الخاص بك',
    emailLabel: 'البريد الإلكتروني:',
    emailReadOnlyInfo: 'لا يمكن تغيير عنوان البريد الإلكتروني.',
    phoneLabel: 'رقم الهاتف:',
    phonePlaceholder: 'أدخل رقم هاتفك',
    genderLabel: 'الجنس:',
    male: 'ذكر',
    female: 'أنثى',
    dobLabel: 'تاريخ الميلاد:',
    selectDatePlaceholder: 'اختر التاريخ',
    profilePhotoTitle: 'صورة الملف الشخصي',
    selectAction: 'اختر إجراءً',
    choosePhoto: 'اختيار صورة',
    deletePhoto: 'حذف الصورة',
    cancel: 'إلغاء',
    saveErrorTitle: 'خطأ',
    saveErrorMessage: 'تعذر حفظ تغييرات الملف الشخصي. يرجى المحاولة مرة أخرى.',
    imagePickerErrorTitle: 'خطأ',
    imagePickerErrorMessage: 'تعذر تحديد الصورة. يرجى المحاولة مرة أخرى.',
    photoRemovedSuccessTitle: 'نجاح',
    photoRemovedSuccessMessage: 'تمت إزالة صورة الملف الشخصي.',
    goBack: 'رجوع',
    cameraIconDesc: 'تغيير الصورة',
    infoTitle: 'معلومة',
    failedToLoadDetails: "فشل تحميل تفاصيل الملف الشخصي.",
    ok: 'موافق',
  },
  en: {
    editProfileTitle: 'Edit Profile',
    saveButton: 'SAVE',
    loading: 'Loading...',
    usernameLabel: 'Username:',
    usernamePlaceholder: 'Enter your username',
    emailLabel: 'Email:',
    emailReadOnlyInfo: 'Email address cannot be changed.',
    phoneLabel: 'Phone:',
    phonePlaceholder: 'Enter your phone number',
    genderLabel: 'Gender:',
    male: 'Male',
    female: 'Female',
    dobLabel: 'Date of Birth:',
    selectDatePlaceholder: 'Select Date',
    profilePhotoTitle: 'Profile Photo',
    selectAction: 'Select an action',
    choosePhoto: 'Choose Photo',
    deletePhoto: 'Delete Photo',
    cancel: 'Cancel',
    saveErrorTitle: 'Error',
    saveErrorMessage: 'Could not save profile changes. Please try again.',
    imagePickerErrorTitle: 'Error',
    imagePickerErrorMessage: 'Could not select image. Please try again.',
    photoRemovedSuccessTitle: 'Success',
    photoRemovedSuccessMessage: 'Profile photo removed.',
    goBack: 'Back',
    cameraIconDesc: 'Change photo',
    infoTitle: 'Info',
    failedToLoadDetails: "Failed to load profile details.",
    ok: 'OK',
  }
};

// --- Styles (No changes) ---
const baseStyles = StyleSheet.create({
    safeArea: { flex: 1, },
    loadingContainer: { flex:1, justifyContent: 'center', alignItems: 'center', },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, height: 56, },
    headerButton: { padding: 5, },
    headerTitle: { fontSize: 18, fontWeight: 'bold', },
    saveText: { fontSize: 16, fontWeight: 'bold', },
    scrollView: { flex: 1, },
    scrollContent: { paddingBottom: 30, },
    profilePicSection: { alignItems: 'center', paddingBottom: 30, paddingTop: 20, },
    profilePicContainer: { position: 'relative', width: 120, height: 120, },
    profilePic: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: '#FFFFFF', },
    cameraIconContainer: { position: 'absolute', bottom: 0, right: 0, borderRadius: 15, padding: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', },
    cameraIcon: { color: '#FFFFFF', },
    detailsSection: { paddingHorizontal: 25, paddingTop: 20, marginTop: -10, borderTopLeftRadius: 10, borderTopRightRadius: 10, },
    fieldContainer: { marginBottom: 20, },
    fieldLabel: { fontSize: 14, marginBottom: 8, },
    textInput: { fontSize: 16, borderBottomWidth: 1, paddingVertical: Platform.OS === 'ios' ? 12 : 8, height: 45, backgroundColor: 'transparent', },
    staticFieldValue: { fontSize: 16, paddingVertical: Platform.OS === 'ios' ? 12 : 10, height: 45, lineHeight: Platform.OS === 'ios' ? 20 : 24, },
    pickerContainer: { borderBottomWidth: 1, height: 50, justifyContent: 'center', backgroundColor: 'transparent', },
    picker: { height: 50, width: '100%', backgroundColor: 'transparent', },
    iosPickerItem: { height: 150, fontSize: 16, },
    separator: { height: 1, marginTop: 5, },
    separatorAfterPicker: { height: 1, marginTop: Platform.OS === 'ios' ? 0 : -5, },
    datePickerTouchable: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 45, paddingVertical: 0, },
    dateIconPosition: { marginLeft: 10, },
});
const lightStyles = StyleSheet.create({
    safeArea: { backgroundColor: PRIMARY_GREEN_COLOR_LIGHT }, loadingText: { color: '#4A5568' }, header: { backgroundColor: PRIMARY_GREEN_COLOR_LIGHT }, headerContent: { color: '#FFFFFF' }, scrollView: { backgroundColor: '#F7FAFC' }, profilePicSection: { backgroundColor: PRIMARY_GREEN_COLOR_LIGHT }, profilePic: { backgroundColor: '#E2E8F0' }, cameraIconContainer: { backgroundColor: PRIMARY_GREEN_COLOR_LIGHT }, detailsSection: { backgroundColor: '#FFFFFF' }, fieldLabel: { color: '#718096' }, textInput: { color: '#1A202C', borderBottomColor: '#E2E8F0' }, staticFieldValue: { color: '#1A202C' }, placeholderText: { color: '#A0AEC0' }, pickerContainer: { borderBottomColor: '#E2E8F0' }, picker: { color: '#1A202C' }, pickerDropdownIcon: { color: '#888888' }, iosPickerItem: { color: '#1A202C' }, separator: { backgroundColor: '#E2E8F0' }, separatorAfterPicker: { backgroundColor: '#E2E8F0' }, dateIcon: { color: '#888888' },
    activityIndicator: { color: PRIMARY_GREEN_COLOR_LIGHT },
});
const darkStyles = StyleSheet.create({
    safeArea: { backgroundColor: PRIMARY_GREEN_COLOR_DARK }, loadingText: { color: '#E0E0E0' }, header: { backgroundColor: PRIMARY_GREEN_COLOR_DARK }, headerContent: { color: '#FFFFFF' }, scrollView: { backgroundColor: '#121212' }, profilePicSection: { backgroundColor: PRIMARY_GREEN_COLOR_DARK }, profilePic: { backgroundColor: '#555555' }, cameraIconContainer: { backgroundColor: PRIMARY_GREEN_COLOR_DARK }, detailsSection: { backgroundColor: '#1E1E1E' }, fieldLabel: { color: '#A0AEC0' }, textInput: { color: '#E0E0E0', borderBottomColor: '#444444' }, staticFieldValue: { color: '#E0E0E0' }, placeholderText: { color: '#718096' }, pickerContainer: { borderBottomColor: '#444444' }, picker: { color: '#E0E0E0' }, pickerDropdownIcon: { color: '#BBBBBB' }, iosPickerItem: { color: '#E0E0E0' }, separator: { backgroundColor: '#444444' }, separatorAfterPicker: { backgroundColor: '#444444' }, dateIcon: { color: '#BBBBBB' },
    activityIndicator: { color: '#FFFFFF' },
});


// --- Component Definition ---
const EditProfileScreen = ({
  onSaveSuccess,
  language: languageProp,
  darkMode: darkModeProp,
}) => {
    const navigation = useNavigation();

    const [currentLanguage, setCurrentLanguage] = useState(languageProp || (I18nManager.isRTL ? 'ar' : 'en'));
    const [currentDarkMode, setCurrentDarkMode] = useState(darkModeProp === undefined ? false : darkModeProp);
    const [profileData, setProfileData] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // ... (All other hooks and functions up to handleSaveChanges remain the same) ...
    useEffect(() => {
        if (languageProp && languageProp !== currentLanguage) {
            setCurrentLanguage(languageProp);
        }
    }, [languageProp, currentLanguage]);

    useEffect(() => {
        const newMode = darkModeProp === undefined ? false : darkModeProp;
        if (newMode !== currentDarkMode) {
            setCurrentDarkMode(newMode);
        }
    }, [darkModeProp, currentDarkMode]);

    const translation = useMemo(() => {
        return translations[currentLanguage] || translations.en;
    }, [currentLanguage]);

    const themeStyles = useMemo(() => {
        return currentDarkMode ? darkStyles : lightStyles;
    }, [currentDarkMode]);

    const loadProfileFormData = useCallback(async () => {
        const localTranslation = translations[currentLanguage] || translations.en;
        setIsInitialized(false);
        let loadedEmail = '';
        let loadedProfile = {};
        try {
            const storedEmail = await AsyncStorage.getItem(LOGGED_IN_EMAIL_KEY);
            loadedEmail = storedEmail || '';
            const profileDataString = await AsyncStorage.getItem(USER_PROFILE_DATA_KEY);
            if (profileDataString) {
                loadedProfile = JSON.parse(profileDataString);
            }
            const dobFromStorage = loadedProfile?.dateOfBirth ? new Date(loadedProfile.dateOfBirth) : new Date();
            const validDob = (dobFromStorage instanceof Date && !isNaN(dobFromStorage)) ? dobFromStorage : new Date();
            setProfileData({
                username: loadedProfile?.username || '',
                email: loadedEmail,
                phone: loadedProfile?.phone || '',
                gender: loadedProfile?.gender || 'Male',
                dateOfBirth: validDob,
                profileImageUrl: loadedProfile?.profileImageUrl || null,
            });
        } catch (error) {
            console.error('EditProfileScreen: Error loading profile form data:', error);
            Alert.alert(localTranslation.saveErrorTitle, localTranslation.failedToLoadDetails);
            setProfileData({ username: '', email: loadedEmail, phone: '', gender: 'Male', dateOfBirth: new Date(), profileImageUrl: null, });
        } finally {
            setIsInitialized(true);
        }
    }, [currentLanguage, currentDarkMode]);

    useFocusEffect(useCallback(() => { loadProfileFormData(); }, [loadProfileFormData]));
    
    const updateProfileField = (field, value) => {
        if (field === 'email') { Alert.alert(translation.infoTitle, translation.emailReadOnlyInfo); return; }
        setProfileData(prev => prev ? ({ ...prev, [field]: value }) : null);
    };
    const updatePhoneField = (text) => { updateProfileField('phone', text.replace(/[^0-9]/g, '')); };
    const onDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || (profileData ? profileData.dateOfBirth : new Date());
        setShowDatePicker(Platform.OS === 'ios');
        if (currentDate instanceof Date && !isNaN(currentDate)) {
            updateProfileField('dateOfBirth', currentDate);
        }
    };
    const showDatepicker = () => setShowDatePicker(true);
    const formatDate = (date) => {
        if (date instanceof Date && !isNaN(date)) {
            return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
        }
        return translation.selectDatePlaceholder;
    };
    const handleChoosePhoto = () => {
        launchImageLibrary({ mediaType: 'photo', quality: 0.8 }, (response) => {
            if (response.didCancel) return;
            if (response.errorCode) { Alert.alert(translation.imagePickerErrorTitle, translation.imagePickerErrorMessage); return; }
            if (response.assets && response.assets.length > 0) { updateProfileField('profileImageUrl', response.assets[0].uri); }
        });
    };
    const handleDeletePhoto = () => {
        updateProfileField('profileImageUrl', null);
        Alert.alert(translation.photoRemovedSuccessTitle, translation.photoRemovedSuccessMessage);
    };
    const showPhotoOptions = () => {
        if (!profileData) return;
        const options = [{ text: translation.choosePhoto, onPress: handleChoosePhoto }];
        if (profileData.profileImageUrl) { options.push({ text: translation.deletePhoto, onPress: handleDeletePhoto, style: 'destructive' }); }
        options.push({ text: translation.cancel, style: 'cancel' });
        Alert.alert(translation.profilePhotoTitle, translation.selectAction, options, { cancelable: true });
    };
    const handleGoBack = () => { if (navigation.canGoBack()) { navigation.goBack(); } };


    // START: MODIFICATION - Simplified handleSaveChanges function
    const handleSaveChanges = async () => {
        if (!profileData) return;
        try {
          const profileDataToSave = {
            username: profileData.username?.trim() || null,
            phone: profileData.phone || null,
            gender: profileData.gender || 'Male',
            dateOfBirth: (profileData.dateOfBirth instanceof Date && !isNaN(profileData.dateOfBirth))
                          ? profileData.dateOfBirth.toISOString()
                          : null,
            profileImageUrl: profileData.profileImageUrl || null,
          };

          // 1. Save data to AsyncStorage
          await AsyncStorage.setItem(USER_PROFILE_DATA_KEY, JSON.stringify(profileDataToSave));

          // 2. Call the onSaveSuccess prop if it exists
          if (onSaveSuccess) {
            onSaveSuccess(profileDataToSave);
          }
          
          // 3. Navigate directly to the Profile screen without an alert
          navigation.navigate('Profile');

        } catch (error) {
          // If saving fails, show an error alert
          Alert.alert(translation.saveErrorTitle, translation.saveErrorMessage);
        }
    };
    // END: MODIFICATION

    // --- JSX (No other changes below this point) ---
    if (!isInitialized || !profileData) {
        const loadingTheme = currentDarkMode ? darkStyles : lightStyles;
        return (
            <SafeAreaView style={[baseStyles.safeArea, loadingTheme.safeArea, baseStyles.loadingContainer]}>
                 <StatusBar barStyle={currentDarkMode ? 'light-content' : 'light-content'} backgroundColor={loadingTheme.safeArea.backgroundColor} />
                <ActivityIndicator size="large" color={loadingTheme.activityIndicator.color} />
                <Text style={loadingTheme.loadingText}>{translation.loading}</Text>
            </SafeAreaView>
        );
    }

    const profileImageSource = profileData.profileImageUrl ? { uri: profileData.profileImageUrl } : DEFAULT_PROFILE_IMAGE;
    const imageKey = profileData.profileImageUrl || 'default_avatar_key';

    return (
        <SafeAreaView style={[baseStyles.safeArea, themeStyles.safeArea]}>
            <StatusBar barStyle={'light-content'} backgroundColor={themeStyles.header.backgroundColor} />
            <View style={[baseStyles.header, themeStyles.header]}>
                <TouchableOpacity onPress={handleGoBack} style={baseStyles.headerButton}>
                    <Icon 
    name={currentLanguage === 'ar' ? "arrow-forward" : "arrow-back"} 
    size={24} 
    color={themeStyles.headerContent.color} 
/>
                </TouchableOpacity>
                <Text style={[baseStyles.headerTitle, themeStyles.headerContent]}>{translation.editProfileTitle}</Text>
                <TouchableOpacity onPress={handleSaveChanges} style={baseStyles.headerButton}>
                    <Text style={[baseStyles.saveText, themeStyles.headerContent]}>{translation.saveButton}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={[baseStyles.scrollView, themeStyles.scrollView]}
                contentContainerStyle={baseStyles.scrollContent}
                keyboardShouldPersistTaps="handled"
                key={`${currentLanguage}-${currentDarkMode}`}
            >
                <View style={[baseStyles.profilePicSection, themeStyles.profilePicSection]}>
                    <View style={baseStyles.profilePicContainer}>
                        <Image
                            source={profileImageSource}
                            style={[baseStyles.profilePic, themeStyles.profilePic]}
                            key={imageKey}
                            onError={() => { if (profileData.profileImageUrl) { updateProfileField('profileImageUrl', null); } }}
                        />
                        <TouchableOpacity
                            style={[baseStyles.cameraIconContainer, themeStyles.cameraIconContainer]}
                            onPress={showPhotoOptions}
                            accessibilityLabel={translation.cameraIconDesc}
                        >
                            <Icon name="camera" size={20} style={baseStyles.cameraIcon} />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={[baseStyles.detailsSection, themeStyles.detailsSection]}>
                    <View style={baseStyles.fieldContainer}>
                        <Text style={[baseStyles.fieldLabel, themeStyles.fieldLabel]}>{translation.usernameLabel}</Text>
                        <TextInput
                            style={[baseStyles.textInput, themeStyles.textInput, {textAlign: I18nManager.isRTL ? 'right' : 'left'}]}
                            value={profileData.username}
                            onChangeText={(text) => updateProfileField('username', text)}
                            placeholder={translation.usernamePlaceholder}
                            placeholderTextColor={themeStyles.placeholderText.color}
                            autoCapitalize="words"
                        />
                    </View>

                    <View style={baseStyles.fieldContainer}>
                        <Text style={[baseStyles.fieldLabel, themeStyles.fieldLabel]}>{translation.emailLabel}</Text>
                        <Text style={[baseStyles.staticFieldValue, themeStyles.staticFieldValue, {textAlign: I18nManager.isRTL ? 'right' : 'left'}]}>
                            {profileData.email || translation.loading}
                        </Text>
                        <View style={[baseStyles.separator, themeStyles.separator]} />
                    </View>

                     <View style={baseStyles.fieldContainer}>
                        <Text style={[baseStyles.fieldLabel, themeStyles.fieldLabel]}>{translation.phoneLabel}</Text>
                        <TextInput
                            style={[baseStyles.textInput, themeStyles.textInput, {textAlign: I18nManager.isRTL ? 'right' : 'left'}]}
                            value={profileData.phone}
                            onChangeText={updatePhoneField}
                            placeholder={translation.phonePlaceholder}
                            placeholderTextColor={themeStyles.placeholderText.color}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={baseStyles.fieldContainer}>
                        <Text style={[baseStyles.fieldLabel, themeStyles.fieldLabel]}>{translation.genderLabel}</Text>
                        {Platform.OS === 'ios' ? (
                            <Picker selectedValue={profileData.gender} onValueChange={(itemValue) => updateProfileField('gender', itemValue)} itemStyle={[baseStyles.iosPickerItem, themeStyles.iosPickerItem]}>
                                <Picker.Item label={translation.male} value="Male" />
                                <Picker.Item label={translation.female} value="Female" />
                            </Picker>
                        ) : (
                            <View style={[baseStyles.pickerContainer, themeStyles.pickerContainer]}>
                                <Picker selectedValue={profileData.gender} style={[baseStyles.picker, themeStyles.picker]} onValueChange={(itemValue) => updateProfileField('gender', itemValue)} mode="dropdown" dropdownIconColor={themeStyles.pickerDropdownIcon.color}>
                                   <Picker.Item label={translation.male} value="Male" />
                                   <Picker.Item label={translation.female} value="Female" />
                                </Picker>
                            </View>
                        )}
                        <View style={[baseStyles.separatorAfterPicker, themeStyles.separatorAfterPicker]} />
                    </View>

                    <View style={baseStyles.fieldContainer}>
                        <Text style={[baseStyles.fieldLabel, themeStyles.fieldLabel]}>{translation.dobLabel}</Text>
                        <TouchableOpacity onPress={showDatepicker} style={baseStyles.datePickerTouchable}>
                            <Text style={[ baseStyles.staticFieldValue, themeStyles.staticFieldValue, {flex: 1, textAlign: I18nManager.isRTL ? 'right' : 'left'}, (!profileData.dateOfBirth || isNaN(new Date(profileData.dateOfBirth))) && themeStyles.placeholderText ]}>
                                {formatDate(profileData.dateOfBirth)}
                            </Text>
                            <Icon name="calendar-outline" size={20} style={[baseStyles.dateIconPosition, themeStyles.dateIcon]} />
                        </TouchableOpacity>
                         <View style={[baseStyles.separator, themeStyles.separator]} />
                    </View>
                </View>

                {showDatePicker && (
                  <DateTimePicker
                      testID="dateTimePicker"
                      value={profileData.dateOfBirth instanceof Date && !isNaN(profileData.dateOfBirth) ? profileData.dateOfBirth : new Date()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={onDateChange}
                      maximumDate={new Date()}
                      textColor={currentDarkMode && Platform.OS === 'ios' ? '#FFFFFF' : '#000000'}
                  />
                )}
                 <View style={{ height: Platform.OS === 'ios' && showDatePicker ? 220 : 50 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

export default EditProfileScreen;