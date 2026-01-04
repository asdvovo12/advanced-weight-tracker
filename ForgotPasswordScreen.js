import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard,
  Alert, ScrollView, I18nManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// --- Theme and Translation ---
const lightTheme = {
  background: '#FFFFFF',
  text: '#000000',
  subtleText: '#999999',
  primary: '#3CB043',
  primaryText: '#FFFFFF',
  inputBorder: '#CCCCCC',
  error: '#FF0000',
};

const darkTheme = {
  background: '#121212',
  text: '#E0E0E0',
  subtleText: '#A0A0A0',
  primary: '#4CAF50',
  primaryText: '#FFFFFF',
  inputBorder: '#555555',
  error: '#FF6B6B',
};

const translations = {
  ar: {
    title: 'هل نسيت كلمة المرور؟',
    subtitle: 'أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور',
    emailPlaceholder: 'أدخل بريدك الإلكتروني',
    continueButton: 'متابعة',
    cancelButton: 'إلغاء',
    errorNoEmail: 'الرجاء إدخال عنوان بريدك الإلكتروني.',
    errorInvalidEmail: 'الرجاء إدخال عنوان بريد إلكتروني صالح.',
    errorFailedToSend: 'فشل إرسال بريد إعادة التعيين. حاول مرة أخرى.',
    successTitle: 'نجاح',
    successMessage: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى {email}',
  },
  en: {
    title: 'Forgot Password',
    subtitle: 'Enter your email account to reset password',
    emailPlaceholder: 'Enter your email',
    continueButton: 'Continue',
    cancelButton: 'Cancel',
    errorNoEmail: 'Please enter your email address.',
    errorInvalidEmail: 'Please enter a valid email address.',
    errorFailedToSend: 'Failed to send reset email. Please try again.',
    successTitle: 'Success',
    successMessage: 'Password reset link sent to {email}',
  },
};

const passwordImage = require('./assets/password.png');

const ForgotPasswordScreen = ({ navigation, language = 'ar', isDarkMode = false }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const translation = useMemo(() => translations[language] || translations.ar, [language]);
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    I18nManager.forceRTL(language === 'ar');
  }, [language]);

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleContinue = async () => {
    Keyboard.dismiss();
    setError(null);

    if (!email) {
      setError(translation.errorNoEmail);
      return;
    }
    if (!validateEmail(email)) {
      setError(translation.errorInvalidEmail);
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement actual Supabase/backend logic for password reset
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network request
      
      Alert.alert(
        translation.successTitle,
        translation.successMessage.replace('{email}', email)
      );
      // Example navigation: navigation.navigate('ResetPassword');
    } catch (apiError) {
      console.error("Forgot Password Error:", apiError);
      setError(translation.errorFailedToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (error) setError(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.keyboardAvoidingContainer}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.innerContent}>
          <View style={styles.topSection}>
             <Text style={styles.title}>{translation.title}</Text>
             <Text style={styles.subtitle}>{translation.subtitle}</Text>
          </View>

          <Image source={passwordImage} style={styles.image} resizeMode="contain" />

          <View style={styles.spacer} />

          <View style={styles.bottomSection}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="email" size={24} color={theme.subtleText} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={translation.emailPlaceholder}
                placeholderTextColor={theme.subtleText}
                value={email}
                onChangeText={handleEmailChange}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                editable={!isLoading}
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, styles.continueButton, isLoading && styles.buttonDisabled]}
              onPress={handleContinue}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.primaryText} />
              ) : (
                <Text style={styles.buttonText}>{translation.continueButton}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.cancelButton, isLoading && styles.buttonDisabled]}
              onPress={() => navigation.goBack()}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>{translation.cancelButton}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme) => StyleSheet.create({
  keyboardAvoidingContainer: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  innerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  topSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.subtleText,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  image: {
    width: 365,
    height: 365,
  },
  spacer: {
      flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.inputBorder,
    borderRadius: 8,
    marginBottom: 15,
    width: '100%',
    paddingHorizontal: 10,
    backgroundColor: theme.background,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: theme.text,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  errorText: {
      color: theme.error,
      marginBottom: 15,
      fontSize: 14,
      textAlign: 'center',
      width: '100%',
  },
  button: {
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  continueButton: {
    backgroundColor: theme.primary,
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: theme.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {},
  cancelButtonText: {
    color: theme.subtleText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ForgotPasswordScreen;