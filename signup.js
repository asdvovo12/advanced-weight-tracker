import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ScrollView,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, I18nManager,
} from 'react-native';
import { MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useNavigation, useIsFocused, CommonActions } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking'; 
import { supabase } from './supabaseClient';

WebBrowser.maybeCompleteAuthSession();

const lightTheme = {
  background: '#f5f5f5',
  contentBackground: '#fff',
  text: '#000',
  subtleText: '#666',
  placeholderText: '#999',
  iconColor: '#888',
  primary: '#3CB043',
  primaryText: '#fff',
  primaryDisabled: '#a8d8aa',
  separator: '#eee',
  inputBorder: '#ccc',
  socialButtonBorder: '#ddd',
  socialButtonText: '#333',
  link: '#3CB043',
  valid: '#3CB043',
  invalid: '#666',
  checkboxBorder: '#999',
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
  link: '#80CBC4',
  valid: '#80CBC4',
  invalid: '#A0A0A0',
  checkboxBorder: '#888',
};

const translations = {
  ar: {
    loginTab: 'تسجيل الدخول',
    signUpTab: 'إنشاء حساب',
    signUpWithFacebook: 'التسجيل عبر فيسبوك',
    signUpWithGoogle: 'التسجيل عبر جوجل',
    continueWithEmail: 'أو المتابعة عبر البريد الإلكتروني',
    namePlaceholder: 'اسمك الكامل',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    passwordPlaceholder: 'أدخل كلمة المرور',
    confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
    reqLength: '8 أحرف على الأقل',
    reqNumber: 'رقم واحد على الأقل',
    reqCase: 'أحرف كبيرة وصغيرة',
    agreeTo: 'أوافق على',
    terms: 'الشروط',
    and: 'و',
    conditions: 'الأحكام',
    signUpButton: 'إنشاء حساب',
    errorTitle: 'خطأ',
    signUpErrorTitle: 'خطأ في التسجيل',
    successTitle: 'نجاح!',
    errorEnterName: 'الرجاء إدخال اسمك.',
    errorEnterEmail: 'الرجاء إدخال بريدك الإلكتروني.',
    errorInvalidEmail: 'الرجاء إدخال بريد إلكتروني صالح.',
    errorEnterPassword: 'الرجاء إدخال كلمة المرور.',
    errorPasswordMismatch: 'كلمتا المرور غير متطابقتين!',
    errorPasswordRequirements: 'كلمة المرور لا تفي بالمتطلبات!',
    errorAgreeTerms: 'الرجاء الموافقة على الشروط والأحكام.',
    errorUserExists: 'هذا البريد الإلكتروني مسجل بالفعل. حاول تسجيل الدخول.',
    successConfirmationSent: 'تم إنشاء حسابك بنجاح. لقد أرسلنا رسالة تأكيد إلى {email}. يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.',
    successAndLoggedIn: 'تم إنشاء حسابك وتسجيل دخولك بنجاح.',
    errorOpeningLink: 'لم نتمكن من فتح رابط الشروط والأحكام.',
    socialSignUpError: 'خطأ في التسجيل عبر {provider}',
    socialSignUpUnexpectedError: 'حدث خطأ غير متوقع أثناء التسجيل عبر {provider}.',
  },
  en: {
    loginTab: 'Login',
    signUpTab: 'Sign Up',
    signUpWithFacebook: 'Sign up with Facebook',
    signUpWithGoogle: 'Sign up with Google',
    continueWithEmail: 'or continue with email',
    namePlaceholder: 'Your name',
    emailPlaceholder: 'Enter your email',
    passwordPlaceholder: 'Enter your password',
    confirmPasswordPlaceholder: 'Confirm your password',
    reqLength: 'At least 8 characters',
    reqNumber: 'At least 1 number',
    reqCase: 'Both upper & lower case',
    agreeTo: 'I agree to the',
    terms: 'Terms',
    and: 'and',
    conditions: 'Conditions',
    signUpButton: 'Sign Up',
    errorTitle: 'Error',
    signUpErrorTitle: 'Sign-Up Error',
    successTitle: 'Success!',
    errorEnterName: 'Please enter your name.',
    errorEnterEmail: 'Please enter your email.',
    errorInvalidEmail: 'Please enter a valid email address.',
    errorEnterPassword: 'Please enter a password.',
    errorPasswordMismatch: 'The passwords do not match!',
    errorPasswordRequirements: 'Password does not meet the requirements!',
    errorAgreeTerms: 'Please agree to the Terms and Conditions.',
    errorUserExists: 'This email is already registered. Try to log in.',
    successConfirmationSent: 'Account created! We have sent a confirmation message to {email}. Please check your email to activate your account.',
    successAndLoggedIn: 'Your account has been created and you are logged in.',
    errorOpeningLink: 'Could not open the link for Terms and Conditions.',
    socialSignUpError: 'Error signing up with {provider}',
    socialSignUpUnexpectedError: 'An unexpected error occurred while signing up with {provider}.',
  },
};

const SignUpScreen = ({ language = 'ar', isDarkMode = false }) => {
    const theme = isDarkMode ? darkTheme : lightTheme;
    const translation = useMemo(() => translations[language] || translations.ar, [language]);
    const styles = useMemo(() => getStyles(theme), [theme]);
    
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [activeTab, setActiveTab] = useState('SignUp');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isFacebookLoading, setIsFacebookLoading] = useState(false);
    const [passwordValid, setPasswordValid] = useState({ length: false, number: false, case: false });

    const emailInputRef = useRef(null);
    const passwordInputRef = useRef(null);
    const confirmPasswordInputRef = useRef(null);

    useEffect(() => {
        I18nManager.forceRTL(language === 'ar');
        if (isFocused) { setActiveTab('SignUp'); }
    }, [isFocused, language]);

    useEffect(() => {
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
                console.log('✅ SignUp/Login detected! Navigating...');
                setIsGoogleLoading(false);
                setIsFacebookLoading(false);
                setIsLoading(false);
                navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Weight' }] }));
            }
        });

        const handleDeepLink = async (event) => {
            let url = event.url;
            if (url && url.includes('access_token') && url.includes('refresh_token')) {
                try {
                    const accessToken = url.match(/access_token=([^&]+)/)?.[1];
                    const refreshToken = url.match(/refresh_token=([^&]+)/)?.[1];
                    if (accessToken && refreshToken) {
                        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
                    }
                } catch (err) { console.error("Error parsing URL:", err); }
            }
        };

        const linkingSubscription = Linking.addEventListener('url', handleDeepLink);
        Linking.getInitialURL().then((url) => { if (url) handleDeepLink({ url }); });

        return () => {
            authListener.subscription.unsubscribe();
            linkingSubscription.remove();
        };
    }, []);

    const anyLoading = isLoading || isGoogleLoading || isFacebookLoading;

    const handleSocialSignUp = async (provider) => {
        try {
            await supabase.auth.signOut();
            if (anyLoading) return;
            if (provider === 'google') setIsGoogleLoading(true);
            if (provider === 'facebook') setIsFacebookLoading(true);

            const redirectUrl = Linking.createURL('/');
            
            const { data, error } = await supabase.auth.signInWithOAuth({ 
              provider,
              options: {
                redirectTo: redirectUrl,
                skipBrowserRedirect: true,
                queryParams: { prompt: 'select_account' }
              }
            });

            if (error) throw error;

            if (data?.url) {
                const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
                if (result.type !== 'success') {
                    if (provider === 'google') setIsGoogleLoading(false);
                    if (provider === 'facebook') setIsFacebookLoading(false);
                }
            }

        } catch (error) {
            console.error(`Unexpected ${provider} Sign-Up Error:`, error);
            Alert.alert(translation.errorTitle, error.message || translation.socialSignUpUnexpectedError.replace('{provider}', provider));
            setIsGoogleLoading(false);
            setIsFacebookLoading(false);
        }
    };

    const handlePasswordChange = (text) => {
        setPassword(text);
        setPasswordValid({
             length: text.length >= 8,
             number: /\d/.test(text),
             case: /[a-z]/.test(text) && /[A-Z]/.test(text),
        });
    };

    const handleSignUp = async () => {
        await supabase.auth.signOut();
        if (!name) return Alert.alert(translation.errorTitle, translation.errorEnterName);
        if (!email) return Alert.alert(translation.errorTitle, translation.errorEnterEmail);
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return Alert.alert(translation.errorTitle, translation.errorInvalidEmail);
        if (!password) return Alert.alert(translation.errorTitle, translation.errorEnterPassword);
        if (password !== confirmPassword) return Alert.alert(translation.errorTitle, translation.errorPasswordMismatch);
        if (!passwordValid.length || !passwordValid.number || !passwordValid.case) return Alert.alert(translation.errorTitle, translation.errorPasswordRequirements);
        if (!agreeTerms) return Alert.alert(translation.errorTitle, translation.errorAgreeTerms);
        
        setIsLoading(true);
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email, password: password, options: { data: { full_name: name } }
            });

            if (error) {
                if (error.message.includes("User already registered")) {
                    Alert.alert(translation.signUpErrorTitle, translation.errorUserExists);
                } else {
                    Alert.alert(translation.signUpErrorTitle, error.message || 'Unexpected error.');
                }
            } else if (data.user && !data.session) {
                Alert.alert(translation.successTitle, translation.successConfirmationSent.replace('{email}', email));
                navigation.navigate('Login');
            } else if (data.user && data.session) {
                Alert.alert(translation.successTitle, translation.successAndLoggedIn);
                navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Weight' }] }));
            }
        } catch (error) {
            Alert.alert(translation.errorTitle, 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTabPress = (tabName) => {
        setActiveTab(tabName);
        if (tabName === 'Login') { navigation.navigate('Login'); }
    };

    const handleOpenTermsLink = async () => {
        const termsUrl = 'https://asdvovo.github.io/app-terms/terms.html';
        try { await WebBrowser.openBrowserAsync(termsUrl); } 
        catch (error) { Alert.alert(translation.errorTitle, translation.errorOpeningLink); }
    };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}>
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
          <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialSignUp('facebook')} disabled={anyLoading}>
            {isFacebookLoading ? <ActivityIndicator size="small" color="#1877F2" style={styles.buttonIcon} /> : <FontAwesome name="facebook-square" size={24} color="#1877F2" style={styles.buttonIcon} />}
            <Text style={styles.socialButtonText}>{translation.signUpWithFacebook}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton} onPress={() => handleSocialSignUp('google')} disabled={anyLoading}>
            {isGoogleLoading ? <ActivityIndicator size="small" color={theme.iconColor} style={styles.buttonIcon} /> : <Image source={require('./assets/google.png')} style={styles.googleLogo} />}
            <Text style={styles.socialButtonText}>{translation.signUpWithGoogle}</Text>
          </TouchableOpacity>
          <Text style={styles.orText}>{translation.continueWithEmail}</Text>

          <View style={styles.inputContainer}>
            <FontAwesome name="user-o" size={20} color={theme.iconColor} style={styles.inputIcon}/>
            <TextInput style={styles.input} placeholder={translation.namePlaceholder} placeholderTextColor={theme.placeholderText} value={name} onChangeText={setName} returnKeyType="next" onSubmitEditing={() => emailInputRef.current?.focus()} editable={!anyLoading} blurOnSubmit={false} autoCapitalize="words" />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={theme.iconColor} style={styles.inputIcon}/>
            <TextInput ref={emailInputRef} style={styles.input} placeholder={translation.emailPlaceholder} placeholderTextColor={theme.placeholderText} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" returnKeyType="next" onSubmitEditing={() => passwordInputRef.current?.focus()} editable={!anyLoading} blurOnSubmit={false} />
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color={theme.iconColor} style={styles.inputIcon} />
            <TextInput ref={passwordInputRef} style={styles.input} placeholder={translation.passwordPlaceholder} placeholderTextColor={theme.placeholderText} value={password} onChangeText={handlePasswordChange} secureTextEntry={!showNewPassword} returnKeyType="next" onSubmitEditing={() => confirmPasswordInputRef.current?.focus()} editable={!anyLoading} blurOnSubmit={false} textContentType="newPassword" />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)} disabled={anyLoading} style={styles.eyeIcon}>
              <MaterialIcons name={showNewPassword ? 'visibility' : 'visibility-off'} size={24} color={theme.placeholderText} />
            </TouchableOpacity>
          </View>
          <View style={styles.inputContainer}>
            <MaterialIcons name="lock-outline" size={20} color={theme.iconColor} style={styles.inputIcon} />
            <TextInput ref={confirmPasswordInputRef} style={styles.input} placeholder={translation.confirmPasswordPlaceholder} placeholderTextColor={theme.placeholderText} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirmPassword} returnKeyType="done" onSubmitEditing={handleSignUp} editable={!anyLoading} textContentType="newPassword" />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} disabled={anyLoading} style={styles.eyeIcon}>
              <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={24} color={theme.placeholderText} />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordRequirements}>
             <Text style={[styles.requirementText, passwordValid.length && styles.validRequirement]}><MaterialIcons name={passwordValid.length ? "check-circle" : "radio-button-unchecked"} size={16} color={passwordValid.length ? theme.valid : theme.invalid} style={styles.reqIcon} /> {translation.reqLength}</Text>
             <Text style={[styles.requirementText, passwordValid.number && styles.validRequirement]}><MaterialIcons name={passwordValid.number ? "check-circle" : "radio-button-unchecked"} size={16} color={passwordValid.number ? theme.valid : theme.invalid} style={styles.reqIcon}/> {translation.reqNumber}</Text>
             <Text style={[styles.requirementText, passwordValid.case && styles.validRequirement]}><MaterialIcons name={passwordValid.case ? "check-circle" : "radio-button-unchecked"} size={16} color={passwordValid.case ? theme.valid : theme.invalid} style={styles.reqIcon}/> {translation.reqCase}</Text>
          </View>

          <View style={styles.termsContainer}>
            <TouchableOpacity style={[styles.checkbox, agreeTerms && styles.checkboxChecked]} onPress={() => setAgreeTerms(!agreeTerms)} disabled={anyLoading}>
              {agreeTerms && <MaterialIcons name="check" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.termsText}>{translation.agreeTo}{' '}<Text style={styles.linkText} onPress={handleOpenTermsLink}>{translation.terms}</Text>{' '}{translation.and}{' '}<Text style={styles.linkText} onPress={handleOpenTermsLink}>{translation.conditions}</Text>.</Text>
          </View>

          <TouchableOpacity style={[styles.mainButton, (anyLoading || !agreeTerms || !passwordValid.length || !passwordValid.number || !passwordValid.case) && styles.mainButtonDisabled]} onPress={handleSignUp} disabled={anyLoading || !agreeTerms || !passwordValid.length || !passwordValid.number || !passwordValid.case}>
             {isLoading ? <ActivityIndicator size="small" color={theme.primaryText} /> : <Text style={styles.mainButtonText}>{translation.signUpButton}</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// التعديلات تمت هنا بشكل رئيسي في scrollContentContainer وفي الهوامش لرفع المحتوى
const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContentContainer: { flexGrow: 1, paddingBottom: 150 }, // تم زيادة هذا الرقم لرفع المحتوى عند السكرول
    tabContainerWrapper: { backgroundColor: theme.contentBackground, paddingTop: Platform.OS === 'ios' ? 50 : 30, borderBottomWidth: 1, borderBottomColor: theme.separator, zIndex: 10 },
    tabContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', position: 'relative', borderBottomWidth: 3, borderBottomColor: 'transparent' },
    activeTab: {},
    tabText: { fontSize: 17, fontWeight: '600', color: theme.placeholderText },
    activeTabText: { color: theme.text },
    greenLine: { backgroundColor: theme.primary, height: 3, position: 'absolute', bottom: -5, left: 0, right: 0 },
    content: { paddingHorizontal: 25, paddingTop: 30 }, // تم تقليل المسافة العلوية قليلاً
    socialButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.contentBackground, borderWidth: 1, borderColor: theme.socialButtonBorder, borderRadius: 8, paddingVertical: -5, paddingHorizontal: 15, marginBottom: 10, minHeight: 44 }, // تقليل الهامش السفلي
    buttonIcon: { marginHorizontal: 12, width: 24, textAlign: 'center' },
    googleLogo: { width: 22, height: 22, marginHorizontal: 12 },
    socialButtonText: { fontSize: 16, fontWeight: '500', color: theme.socialButtonText },
    orText: { textAlign: 'center', marginVertical: 10, color: theme.placeholderText, fontSize: 14 }, // تقليل الهامش
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.inputBorder, marginBottom: 10, paddingBottom: 5 }, // تقليل الهامش
    inputIcon: { marginHorizontal: 12, width: 20, textAlign: 'center' },
    input: { flex: 1, height: 40, fontSize: 16, color: theme.text, textAlign: I18nManager.isRTL ? 'left' : 'right' },
    eyeIcon: { paddingHorizontal: 10 },
    passwordRequirements: { marginVertical: 8, paddingHorizontal: 5, alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start' },
    requirementText: { fontSize: 13, color: theme.invalid, marginBottom: 4, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
    reqIcon: { marginHorizontal: 6 },
    validRequirement: { color: theme.valid },
    termsContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 }, // تقليل الهامش
    checkbox: { width: 20, height: 20, borderWidth: 1.5, borderColor: theme.checkboxBorder, borderRadius: 3, marginHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
    checkboxChecked: { backgroundColor: theme.primary, borderColor: theme.primary },
    termsText: { flex: 1, fontSize: 13, color: theme.subtleText, lineHeight: 18, textAlign: I18nManager.isRTL ? 'left' : 'left' },
    linkText: { color: theme.link, fontWeight: '600', textDecorationLine: 'underline' },
    mainButton: { backgroundColor: theme.primary, paddingVertical: 13, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
    mainButtonDisabled: { backgroundColor: theme.primaryDisabled },
    mainButtonText: { color: theme.primaryText, fontSize: 18, fontWeight: 'bold' },
});

export default SignUpScreen;