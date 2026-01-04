import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    ActivityIndicator, Keyboard, Platform, Alert, I18nManager,
} from 'react-native';
import emailjs from '@emailjs/browser';

// --- Theme and Translation ---
const lightTheme = {
    background: '#fff',
    text: '#000',
    subtleText: '#999',
    primary: '#3CB043',
    primaryText: '#fff',
    inputBorder: '#ccc',
    error: '#FF0000',
};

const darkTheme = {
    background: '#121212',
    text: '#E0E0E0',
    subtleText: '#A0A0A0',
    primary: '#4CAF50',
    primaryText: '#fff',
    inputBorder: '#555',
    error: '#FF6B6B',
};

const translations = {
  ar: {
    title: 'أدخل رمز التحقق',
    subtitle: 'لقد أرسلنا رمزًا مكونًا من {codeLength} أرقام إلى\n{email}',
    yourEmail: 'بريدك الإلكتروني',
    verifyButton: 'تحقق الآن',
    resendQuestion: 'لم تستلم الرمز؟',
    resendLink: 'إعادة إرسال الرمز',
    resendCooldown: 'إعادة الإرسال بعد {seconds} ث',
    errorIncompleteCode: 'الرجاء إدخال رمز مكون من {codeLength} أرقام.',
    errorIncorrectCode: 'رمز التحقق غير صحيح. حاول مرة أخرى.',
    errorMissingEmail: 'البريد الإلكتروني مفقود. لا يمكن إعادة إرسال الرمز.',
    errorResendFailed: 'فشل إرسال رمز التحقق. يرجى التحقق من اتصالك والمحاولة مرة أخرى.',
    alertResentTitle: 'تمت إعادة الإرسال',
    alertResentMessage: 'تم إرسال رمز تحقق جديد إلى {email}',
  },
  en: {
    title: 'Enter Verification Code',
    subtitle: 'We have sent a {codeLength}-digit code to\n{email}',
    yourEmail: 'your email address',
    verifyButton: 'Verify Now',
    resendQuestion: "Didn't receive the code?",
    resendLink: 'Resend Code',
    resendCooldown: 'Resend in {seconds}s',
    errorIncompleteCode: 'Please enter a {codeLength}-digit code.',
    errorIncorrectCode: 'Incorrect verification code. Please try again.',
    errorMissingEmail: 'Email address is missing. Cannot resend code.',
    errorResendFailed: 'Failed to resend verification code. Please check your connection or try again later.',
    alertResentTitle: 'Code Resent',
    alertResentMessage: 'A new verification code has been sent to {email}',
  },
};

// --- Constants & Security Warning ---
const CODE_LENGTH = 4;
const RESEND_COOLDOWN_SECONDS = 60;
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
const EMAILJS_USER_ID = 'YOUR_USER_ID';

// --- Component ---
const VerificationCodeScreen = ({ route, navigation, language = 'ar', isDarkMode = false }) => {
    const { email } = route.params || {};
    const theme = isDarkMode ? darkTheme : lightTheme;
    const translation = useMemo(() => translations[language] || translations.ar, [language]);
    const styles = useMemo(() => getStyles(theme), [theme]);

    const [code, setCode] = useState(Array(CODE_LENGTH).fill(''));
    const [isLoadingVerify, setIsLoadingVerify] = useState(false);
    const [isLoadingResend, setIsLoadingResend] = useState(false);
    const [error, setError] = useState(null);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [verificationCodes, setVerificationCodes] = useState({}); // !! INSECURE: For simulation only

    const inputRefs = useRef(Array(CODE_LENGTH).fill().map(() => React.createRef()));

    useEffect(() => {
        I18nManager.forceRTL(language === 'ar');
        const focusTimer = setTimeout(() => inputRefs.current[0]?.current?.focus(), 100);
        return () => clearTimeout(focusTimer);
    }, [language]);

    useEffect(() => {
        let timer;
        if (resendCooldown > 0) {
            timer = setInterval(() => setResendCooldown(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const generateAndStoreCode = (userEmail) => {
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        setVerificationCodes(prev => ({ ...prev, [userEmail]: newCode })); // !! INSECURE
        console.log(`(Insecure Simulation) Generated code for ${userEmail}: ${newCode}`);
        return newCode;
    };

    const handleCodeChange = (text, index) => {
        const newCode = [...code];
        newCode[index] = text.replace(/[^0-9]/g, '');
        setCode(newCode);
        if (newCode[index].length === 1 && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.current?.focus();
        }
        if (error) setError(null);
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
            inputRefs.current[index - 1]?.current?.focus();
        }
    };

    const handleVerifyNow = () => {
        Keyboard.dismiss();
        setError(null);
        const enteredCode = code.join('');

        if (enteredCode.length !== CODE_LENGTH) {
            setError(translation.errorIncompleteCode.replace('{codeLength}', CODE_LENGTH));
            return;
        }
        setIsLoadingVerify(true);
        // --- !! SIMULATION: Replace with backend verification !! ---
        setTimeout(() => {
            if (verificationCodes[email] === enteredCode) {
                navigation.navigate('ResetPassword', { email });
            } else {
                setError(translation.errorIncorrectCode);
            }
            setIsLoadingVerify(false);
        }, 1000);
    };

    const handleResendCode = async () => {
        if (!email) {
            setError(translation.errorMissingEmail);
            return;
        }
        if (isLoadingResend || resendCooldown > 0) return;

        Keyboard.dismiss();
        setError(null);
        setIsLoadingResend(true);

        const newVerificationCode = generateAndStoreCode(email);
        try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: email, verification_code: newVerificationCode }, EMAILJS_USER_ID);
            Alert.alert(translation.alertResentTitle, translation.alertResentMessage.replace('{email}', email));
            setResendCooldown(RESEND_COOLDOWN_SECONDS);
        } catch (err) {
            console.error('EmailJS Error:', err);
            setError(translation.errorResendFailed);
        } finally {
            setIsLoadingResend(false);
        }
    };

    const anyLoading = isLoadingVerify || isLoadingResend;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{translation.title}</Text>
            <Text style={styles.subtitle}>
                {translation.subtitle
                    .replace('{codeLength}', CODE_LENGTH)
                    .replace('{email}', email || translation.yourEmail)}
            </Text>

            <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                    <TextInput
                        key={index}
                        ref={inputRefs.current[index]}
                        style={styles.codeInput}
                        value={digit}
                        onChangeText={(text) => handleCodeChange(text, index)}
                        onKeyPress={(e) => handleKeyPress(e, index)}
                        keyboardType="number-pad"
                        maxLength={1}
                        editable={!anyLoading}
                        selectTextOnFocus
                    />
                ))}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity style={[styles.verifyButton, anyLoading && styles.buttonDisabled]} onPress={handleVerifyNow} disabled={anyLoading}>
                {isLoadingVerify ? <ActivityIndicator size="small" color={theme.primaryText} /> : <Text style={styles.verifyButtonText}>{translation.verifyButton}</Text>}
            </TouchableOpacity>

            <View style={styles.resendContainer}>
                <Text style={styles.resendText}>{translation.resendQuestion}</Text>
                <TouchableOpacity onPress={handleResendCode} disabled={isLoadingResend || resendCooldown > 0}>
                    <Text style={[styles.resendLink, (isLoadingResend || resendCooldown > 0) && styles.linkDisabled]}>
                        {isLoadingResend ? <ActivityIndicator size="small" color={theme.primary} />
                         : resendCooldown > 0 ? ` ${translation.resendCooldown.replace('{seconds}', resendCooldown)}`
                         : ` ${translation.resendLink}`}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// --- Styles ---
const getStyles = (theme) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background,
        padding: 20,
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text,
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: theme.subtleText,
        marginBottom: 40,
        textAlign: 'center',
        lineHeight: 24,
    },
    codeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '85%',
        marginBottom: 20,
    },
    codeInput: {
        width: 50,
        height: 50,
        borderWidth: 1.5,
        borderColor: theme.inputBorder,
        borderRadius: 25,
        fontSize: 24,
        textAlign: 'center',
        color: theme.text,
    },
    errorText: {
        color: theme.error,
        marginBottom: 20,
        fontSize: 14,
        textAlign: 'center',
        minHeight: 20,
    },
    verifyButton: {
        backgroundColor: theme.primary,
        paddingVertical: 15,
        borderRadius: 8,
        width: '90%',
        alignItems: 'center',
        minHeight: 50,
        justifyContent: 'center',
    },
    verifyButtonText: {
        color: theme.primaryText,
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    resendContainer: {
        flexDirection: 'row',
        marginTop: 30,
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    resendText: {
        fontSize: 15,
        color: theme.subtleText,
    },
    resendLink: {
        fontSize: 15,
        color: theme.primary,
        fontWeight: 'bold',
        marginLeft: 5,
        minHeight: 20,
        textAlignVertical: 'center',
    },
    linkDisabled: {
        color: theme.subtleText,
        opacity: 0.7,
    },
});

export default VerificationCodeScreen;