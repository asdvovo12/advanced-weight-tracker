import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image,
  KeyboardAvoidingView, Platform, ScrollView, Keyboard, I18nManager,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

// --- Theme and Translation ---
const lightTheme = {
  background: '#FFFFFF',
  text: '#333333',
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
    title: 'ÅÚÇÏÉ ÊÚííä ßáãÉ ÇáãÑæÑ',
    subtitle: 'íÌÈ Ãä Êßæä ßáãÉ ÇáãÑæÑ ÇáÌÏíÏÉ ãÎÊáÝÉ Úä ÇáÓÇÈÞÉ æáÇ ÊÞá Úä 6 ÃÍÑÝ.',
    newPasswordPlaceholder: 'ßáãÉ ÇáãÑæÑ ÇáÌÏíÏÉ',
    confirmPasswordPlaceholder: 'ÊÃßíÏ ßáãÉ ÇáãÑæÑ',
    continueButton: 'ãÊÇÈÚÉ',
    cancelButton: 'ÅáÛÇÁ',
    errorBothFields: 'ÇáÑÌÇÁ ãáÁ ßáÇ ÍÞáí ßáãÉ ÇáãÑæÑ.',
    errorMinLength: 'íÌÈ Ãä ÊÊßæä ßáãÉ ÇáãÑæÑ ãä 6 ÃÍÑÝ Úáì ÇáÃÞá.',
    errorMismatch: 'ßáãÊÇ ÇáãÑæÑ ÛíÑ ãÊØÇÈÞÊíä!',
    successTitle: 'äÌÇÍ',
    successMessage: 'ÊãÊ ÅÚÇÏÉ ÊÚííä ßáãÉ ÇáãÑæÑ ÈäÌÇÍ!',
  },
  en: {
    title: 'Reset Your Password',
    subtitle: 'The password must be different than before and at least 6 characters long.',
    newPasswordPlaceholder: 'New password',
    confirmPasswordPlaceholder: 'Confirm password',
    continueButton: 'Continue',
    cancelButton: 'Cancel',
    errorBothFields: 'Please fill in both password fields.',
    errorMinLength: 'Password must be at least 6 characters long.',
    errorMismatch: "Passwords don't match!",
    successTitle: 'Success',
    successMessage: 'Password has been reset successfully!',
  },
};

const resetImage = require('./assets/resetpassword.png'); // Ensure this path is correct

// --- Component ---
const ResetPasswordScreen = ({ navigation, language = 'ar', isDarkMode = false }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const translation = useMemo(() => translations[language] || translations.ar, [language]);
  const styles = useMemo(() => getStyles(theme), [theme]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);

  const confirmPasswordInputRef = useRef(null);

  useEffect(() => {
    I18nManager.forceRTL(language === 'ar');
  }, [language]);

  const handleContinue = () => {
    Keyboard.dismiss();
    setError(null);

    if (!newPassword || !confirmPassword) {
      setError(translation.errorBothFields);
      return;
    }
    if (newPassword.length < 6) {
      setError(translation.errorMinLength);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(translation.errorMismatch);
      return;
    }

    console.log('Attempting to reset password with:', newPassword);
    // TODO: Implement actual Supabase/backend password reset logic here
    Alert.alert(translation.successTitle, translation.successMessage, [
      { text: "OK", onPress: () => navigation.navigate('Login') }
    ]);
  };

  const handlePasswordChange = (setter) => (text) => {
    setter(text);
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

          <Image source={resetImage} style={styles.image} resizeMode="contain" />

          <View style={styles.spacer} />

          <View style={styles.bottomSection}>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={24} color={theme.subtleText} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={translation.newPasswordPlaceholder}
                placeholderTextColor={theme.subtleText}
                value={newPassword}
                onChangeText={handlePasswordChange(setNewPassword)}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <MaterialIcons name={showNewPassword ? 'visibility' : 'visibility-off'} size={24} color={theme.subtleText} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <MaterialIcons name="lock-outline" size={24} color={theme.subtleText} style={styles.inputIcon} />
              <TextInput
                ref={confirmPasswordInputRef}
                style={styles.input}
                placeholder={translation.confirmPasswordPlaceholder}
                placeholderTextColor={theme.subtleText}
                value={confirmPassword}
                onChangeText={handlePasswordChange(setConfirmPassword)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <MaterialIcons name={showConfirmPassword ? 'visibility' : 'visibility-off'} size={24} color={theme.subtleText} />
              </TouchableOpacity>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
              <Text style={styles.buttonText}>{translation.continueButton}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelButtonText}>{translation.cancelButton}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Styles ---
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
    width: 290,
    height: 290,
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
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 10,
    backgroundColor: theme.background, // Match background or use specific input color
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
  continueButton: {
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    backgroundColor: theme.primary,
    marginBottom: 15,
  },
  buttonText: {
    color: theme.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    // No background
  },
  cancelButtonText: {
    color: theme.subtleText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ResetPasswordScreen;