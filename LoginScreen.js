import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Keyboard, Alert, Image,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, I18nManager
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useIsFocused, CommonActions } from '@react-navigation/native';
import { supabase } from './supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

// --- Theme and Translation ---
const lightTheme = {
  background: '#f5f5f5',
  contentBackground: '#fff',
  text: '#000',
  subtleText: '#555',
  placeholderText: '#999',
  iconColor: '#888',
  primary: '#3CB043',
  primaryText: '#fff',
  primaryDisabled: '#a8d8aa',
  separator: '#eee',
  inputBorder: '#ccc',
  socialButtonBorder: '#ddd',
  socialButtonText: '#333',
};

const darkTheme = {
  background: '#121212',
  contentBackground: '#1E1E1E',
  text: '#E0E0E0',
  subtleText: '#A0A0A0',
  placeholderText: '#777',
  iconColor: '#A0A0A0',
  primary: '#4CAF50',
  primaryText: '#fff',
  primaryDisabled: '#2e7d32',
  separator: '#333',
  inputBorder: '#555',
  socialButtonBorder: '#444',
  socialButtonText: '#E0E0E0',
};

const translations = {
  ar: {
    loginTab: 'تسجيل الدخول',
    signUpTab: 'إنشاء حساب',
    loginWithFacebook: 'تسجيل الدخول عبر فيسبوك',
    loginWithGoogle: 'تسجيل الدخول عبر جوجل',
    continueWithEmail: 'أو المتابعة عبر البريد الإلكتروني',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    passwordPlaceholder: 'أدخل كلمة المرور',
    forgotPassword: 'هل نسيت كلمة المرور؟',
    loginButton: 'تسجيل الدخول',
    errorTitle: 'خطأ',
    errorEmptyFields: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.',
    loginFailedTitle: 'فشل الدخول',
    emailNotConfirmed: 'لم يتم تأكيد بريدك الإلكتروني بعد.',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    unexpectedError: 'حدث خطأ غير متوقع أثناء محاولة تسجيل الدخول.',
  },
  en: {
    loginTab: 'Login',
    signUpTab: 'Sign Up',
    loginWithFacebook: 'Login with Facebook',
    loginWithGoogle: 'Login with Google',
    continueWithEmail: 'or continue with email',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    forgotPassword: 'Forgot Password?',
    loginButton: 'Login',
    errorTitle: 'Error',
    errorEmptyFields: 'Please enter your email and password.',
    loginFailedTitle: 'Login Failed',
    emailNotConfirmed: 'Your email has not been confirmed yet.',
    invalidCredentials: 'Invalid email or password.',
    unexpectedError: 'An unexpected error occurred while trying to log in.',
  },
};

const USER_PROFILE_DATA_KEY = '@Profile:userProfileData';
const LOGGED_IN_EMAIL_KEY = 'loggedInUserEmail';
const USER_SUBSCRIPTION_STATUS_KEY = '@App:userSubscriptionStatus';

const LoginScreen = ({ language = 'ar', isDarkMode = false }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const translation = useMemo(() => translations[language] || translations.ar, [language]);
  const styles = useMemo(() => getStyles(theme), [theme]);
  
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  
  const passwordInputRef = useRef(null);

  useEffect(() => {
    I18nManager.forceRTL(language === 'ar');
    if (isFocused) { setActiveTab('Login'); }
  }, [isFocused, language]);

  const syncUserData = async (userId, userEmail, userMetadata) => {
      let remoteProfile = null;
      try {
          const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
          
          if (!profileError && profileData) {
              remoteProfile = profileData;
          }
      } catch (fetchError) {
          console.log('Error fetching profile from DB', fetchError);
      }

      const usernameToSave = 
          remoteProfile?.full_name || 
          remoteProfile?.username || 
          userMetadata?.full_name || 
          userMetadata?.name || 
          'User';

      const imageToSave = 
          remoteProfile?.avatar_url || 
          remoteProfile?.profile_image || 
          userMetadata?.avatar_url || 
          userMetadata?.picture || 
          null;
      
      const profileDataToStore = { 
          username: usernameToSave, 
          profileImageUrl: imageToSave 
      };

      await AsyncStorage.setItem(LOGGED_IN_EMAIL_KEY, userEmail);
      await AsyncStorage.setItem(USER_PROFILE_DATA_KEY, JSON.stringify(profileDataToStore));

      const isSubscribed = remoteProfile?.is_vip || remoteProfile?.is_subscribed || false;
      if (isSubscribed) {
          await AsyncStorage.setItem(USER_SUBSCRIPTION_STATUS_KEY, 'active');
      } else {
          await AsyncStorage.removeItem(USER_SUBSCRIPTION_STATUS_KEY);
      }
  };

  useEffect(() => {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
              console.log('✅ Login detected! Navigating immediately...');
              setIsGoogleLoading(false);
              setIsFacebookLoading(false);
              setIsLoading(false);
              navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Weight' }] }));
              syncUserData(session.user.id, session.user.email, session.user.user_metadata)
                  .then(() => console.log('Data synced in background'))
                  .catch((err) => console.log('Sync error:', err));
          }
      });

      const handleDeepLink = async (event) => {
        let url = event.url;
        if (url && url.includes('access_token') && url.includes('refresh_token')) {
            try {
                const accessToken = url.match(/access_token=([^&]+)/)?.[1];
                const refreshToken = url.match(/refresh_token=([^&]+)/)?.[1];
                if (accessToken && refreshToken) {
                    await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });
                }
            } catch (err) {
                console.error("Error parsing URL:", err);
            }
        }
      };

      const linkingSubscription = Linking.addEventListener('url', handleDeepLink);
      Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });

      return () => {
          authListener.subscription.unsubscribe();
          linkingSubscription.remove();
      };
  }, []);

  const handleTabPress = (tabName) => {
    setActiveTab(tabName);
    if (tabName === 'SignUp') { navigation.navigate('SignUp'); }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      return Alert.alert(translation.errorTitle, translation.errorEmptyFields);
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsLoading(false);
        if (error.message.includes('Email not confirmed')) {
          Alert.alert(translation.loginFailedTitle, translation.emailNotConfirmed);
        } else {
          Alert.alert(translation.loginFailedTitle, translation.invalidCredentials);
        }
        return;
      }
    } catch (err) {
      setIsLoading(false);
      console.error('Unexpected Login Error:', err);
      Alert.alert(translation.errorTitle, translation.unexpectedError);
    }
  };
  
  const handleSocialLogin = async (provider) => {
    await supabase.auth.signOut();
    if (anyLoading) return;
    if (provider === 'google') setIsGoogleLoading(true);
    if (provider === 'facebook') setIsFacebookLoading(true);

    try {
        const redirectUrl = Linking.createURL('/'); 
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
                queryParams: { prompt: 'select_account' }
            },
        });

        if (error) throw error;

        if (data?.url) {
            const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
            if (result.type === 'success') {
                const { data: { session } } = await supabase.auth.getSession();
            } else {
                if (provider === 'google') setIsGoogleLoading(false);
                if (provider === 'facebook') setIsFacebookLoading(false);
            }
        }
    } catch (error) {
        console.error(error);
        Alert.alert(translation.errorTitle, error.message || translation.unexpectedError);
        setIsGoogleLoading(false);
        setIsFacebookLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword', { email: email });
  };

  const anyLoading = isLoading || isGoogleLoading || isFacebookLoading;
  
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
      {/* 
        التصحيح تم هنا: 
        كان في طبقتين View بنفس الاسم مما ضاعف المسافة. 
        الآن طبقة واحدة فقط مثل صفحة الـ SignUp 
      */}
      <View style={styles.tabContainerWrapper}>
        <View style={[styles.tabContainer, language === 'ar' && { flexDirection: 'row-reverse' }]}>
            <TouchableOpacity style={[ styles.tab, activeTab === 'Login' && styles.activeTab ]} onPress={() => handleTabPress('Login')} disabled={anyLoading}>
                <Text style={[ styles.tabText, activeTab === 'Login' && styles.activeTabText ]}>{translation.loginTab}</Text>
                {activeTab === 'Login' && <View style={styles.greenLine} />}
            </TouchableOpacity>
            <TouchableOpacity style={[ styles.tab, activeTab === 'SignUp' && styles.activeTab ]} onPress={() => handleTabPress('SignUp')} disabled={anyLoading}>
                <Text style={[ styles.tabText, activeTab === 'SignUp' && styles.activeTabText ]}>{translation.signUpTab}</Text>
                {activeTab === 'SignUp' && <View style={styles.greenLine} />}
            </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <TouchableOpacity style={styles.socialButton} disabled={anyLoading} onPress={() => handleSocialLogin('facebook')}>
            {isFacebookLoading ? <ActivityIndicator size="small" color="#1877F2" style={styles.buttonIcon} /> : <FontAwesome name="facebook-square" size={24} color="#1877F2" style={styles.buttonIcon} />}
            <Text style={styles.socialButtonText}>{translation.loginWithFacebook}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialButton} disabled={anyLoading} onPress={() => handleSocialLogin('google')}>
            {isGoogleLoading ? <ActivityIndicator size="small" color={theme.iconColor} style={styles.buttonIcon} /> : <Image source={require('./assets/google.png')} style={styles.googleLogo} />}
            <Text style={styles.socialButtonText}>{translation.loginWithGoogle}</Text>
          </TouchableOpacity>

          <Text style={styles.orText}>{translation.continueWithEmail}</Text>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={theme.iconColor} style={styles.inputIcon} />
            <TextInput style={styles.input} placeholder={translation.emailPlaceholder} placeholderTextColor={theme.placeholderText} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => passwordInputRef.current?.focus()} editable={!anyLoading} blurOnSubmit={false} />
          </View>
          
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color={theme.iconColor} style={styles.inputIcon} />
            <TextInput ref={passwordInputRef} style={styles.input} placeholder={translation.passwordPlaceholder} placeholderTextColor={theme.placeholderText} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} returnKeyType="done" onSubmitEditing={handleLogin} editable={!anyLoading} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} disabled={anyLoading} style={styles.eyeIcon}>
              <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={24} color={theme.placeholderText} />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity onPress={handleForgotPassword} disabled={anyLoading} style={styles.forgotPasswordContainer}>
             <Text style={styles.forgotPasswordText}>{translation.forgotPassword}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.mainButton, anyLoading && styles.mainButtonDisabled]} onPress={handleLogin} disabled={anyLoading}>
            {isLoading ? <ActivityIndicator size="small" color={theme.primaryText} /> : <Text style={styles.mainButtonText}>{translation.loginButton}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContentContainer: { flexGrow: 1, paddingBottom: 30 },
    tabContainerWrapper: { backgroundColor: theme.contentBackground, paddingTop: Platform.OS === 'ios' ? 50 : 30, borderBottomWidth: 1, borderBottomColor: theme.separator, zIndex: 10 },
    tabContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: {},
    tabText: { fontSize: 17, fontWeight: '600', color: theme.subtleText },
    activeTabText: { color: theme.text },
    greenLine: { backgroundColor: theme.primary, height: 3, position: 'absolute', bottom: -5, left: 0, right: 0 },
    content: { paddingHorizontal: 25, paddingTop: 30 },
    socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.contentBackground, borderWidth: 1, borderColor: theme.socialButtonBorder, borderRadius: 8, paddingVertical: 12, paddingHorizontal: 15, marginBottom: 15, minHeight: 48 },
    buttonIcon: { marginRight: 12, width: 24, textAlign: 'center'},
    googleLogo: { width: 22, height: 22, marginRight: 12 },
    socialButtonText: { fontSize: 16, fontWeight: '500', color: theme.socialButtonText },
    orText: { textAlign: 'center', marginVertical: 20, color: theme.placeholderText, fontSize: 14 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.inputBorder, marginBottom: 20, paddingBottom: 8 },
    inputIcon: { marginRight: 12 },
    input: { flex: 1, height: 40, fontSize: 16, color: theme.text, textAlign: I18nManager.isRTL ? 'left' : 'right' },
    eyeIcon: { paddingLeft: 10 },
    forgotPasswordContainer: { alignItems: I18nManager.isRTL ? 'flex-start' : 'flex-end', marginBottom: 30 },
    forgotPasswordText: { color: theme.subtleText, fontSize: 14, fontWeight: '500' },
    mainButton: { backgroundColor: theme.primary, paddingVertical: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 50 },
    mainButtonDisabled: { backgroundColor: theme.primaryDisabled },
    mainButtonText: { color: theme.primaryText, fontSize: 18, fontWeight: 'bold' },
});

export default LoginScreen;