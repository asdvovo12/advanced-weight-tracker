import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback, useRef } from "react";
import { NavigationContainer, CommonActions } from "@react-navigation/native";
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager, useColorScheme, Alert, View, ActivityIndicator } from 'react-native';
import RNRestart from 'react-native-restart';
import { supabase } from './supabaseClient'; 

// --- Screen Imports ---
import IndexScreen from "./Index";
import WeightTracker from "./weighttracker";
import FoodScreen from "./food"; 
import WaterTrackingScreen from "./water";
import StepsScreen from "./steps";
import WeeklyStepsScreen from "./weeklysteps";
import MonthlyStepsScreen from "./Monthlysteps";
import SettingsScreen from "./setting";
import ReportsScreen from "./reports";
import AboutScreen from "./about";
import SignUp from "./signup";
import LoginScreen from "./LoginScreen";
import VerificationCodeScreen from "./VerificationCodeScreen";
import ForgotPasswordScreen from "./ForgotPasswordScreen";
import ResetPasswordScreen from "./ResetPasswordScreen";
import SplashScreen from "./SplashScreen"; 
import TipsScreen from "./tips";
import ProfileScreen from "./profile";
import EditProfileScreen from "./editprofile";
import AchievementsScreen from "./Achievements";
import DistanceDetailsScreen from './Distance'; 
import CaloriesDetailsScreen from './Calories';
import ActiveTimeDetailsScreen from './ActiveTime';
import PremiumScreen from './PremiumScreen'; 

import { enableDailyNotifications, disableDailyNotifications } from './notificationService';
import { APP_LANGUAGE_KEY, APP_DARK_MODE_KEY, INTENDED_ROUTE_AFTER_RESTART_KEY, appTranslations as globalAppTranslations } from './constants'; 

const Stack = createStackNavigator();

const defaultGlobalAppTranslations = {
    en: { restartTitle: "Restart Required", restartMessage: "The app needs to restart to apply changes.", okButton: "OK" },
    ar: { restartTitle: "إعادة تشغيل مطلوبة", restartMessage: "يحتاج التطبيق إلى إعادة التشغيل لتطبيق التغييرات.", okButton: "موافق" }
};
const effectiveGlobalAppTranslations = globalAppTranslations || defaultGlobalAppTranslations;

// ✅ دمجنا كل الشاشات هنا في RootStack
const RootStack = ({ language, darkMode, handlers, initialRoute }) => (
  <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
    {/* --- شاشات البداية والتوثيق --- */}
    <Stack.Screen name="Index">
        {(props) => <IndexScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="SignUp">
        {(props) => <SignUp {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Login">
        {(props) => <LoginScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="ForgotPassword">
        {(props) => <ForgotPasswordScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="VerificationCode">
        {(props) => <VerificationCodeScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="ResetPassword">
        {(props) => <ResetPasswordScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>

    {/* --- شاشات التطبيق الأساسية --- */}
    <Stack.Screen name="Weight">
      {(props) => <WeightTracker {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Food">
      {(props) => <FoodScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Water">
      {(props) => <WaterTrackingScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Steps">
      {(props) => <StepsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="WeeklySteps">
      {(props) => <WeeklyStepsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="MonthlySteps">
      {(props) => <MonthlyStepsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Reports">
      {(props) => <ReportsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Tips">
      {(props) => <TipsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Achievements">
      {(props) => <AchievementsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Distance">
      {(props) => <DistanceDetailsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="Calories">
      {(props) => <CaloriesDetailsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="ActiveTime">
      {(props) => <ActiveTimeDetailsScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="PremiumScreen">
      {(props) => <PremiumScreen {...props} language={language} darkMode={darkMode} />}
    </Stack.Screen>
    <Stack.Screen name="profile">
      {(props) => <ProfileScreen {...props} language={language} darkMode={darkMode} navigateToPremium={() => props.navigation.navigate('PremiumScreen')} navigateToSettings={() => props.navigation.navigate('Setting')} navigateToAbout={() => props.navigation.navigate('About')} navigateToEditProfile={() => props.navigation.navigate('editprofile')} goBack={() => props.navigation.canGoBack() && props.navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="editprofile">
      {(props) => <EditProfileScreen {...props} language={language} darkMode={darkMode} goBack={() => props.navigation.canGoBack() && props.navigation.goBack()} onSaveSuccess={() => { if(props.navigation.canGoBack()) props.navigation.goBack(); }} />}
    </Stack.Screen>
    <Stack.Screen name="About">
      {(props) => <AboutScreen {...props} language={language} darkMode={darkMode} goBack={() => props.navigation.canGoBack() && props.navigation.goBack()} />}
    </Stack.Screen>
    <Stack.Screen name="Setting">
      {(props) => (
        <SettingsScreen
          {...props}
          languageProp={language}
          changeLanguageProp={handlers.handleChangeLanguage}
          darkModeProp={darkMode}
          toggleDarkModeProp={handlers.handleToggleDarkMode}
          enableNotifications={async () => await enableDailyNotifications(language, effectiveGlobalAppTranslations)}
          disableNotifications={async () => await disableDailyNotifications(language, effectiveGlobalAppTranslations)}
          goBack={() => props.navigation.canGoBack() && props.navigation.goBack()}
        />
      )}
    </Stack.Screen>
  </Stack.Navigator>
);

const App = () => {
  const [session, setSession] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [appLanguage, setAppLanguage] = useState(I18nManager.isRTL ? 'ar' : 'en');
  const systemColorScheme = useColorScheme();
  const [isAppDarkMode, setIsAppDarkMode] = useState(systemColorScheme === 'dark');
  const navigationRef = useRef(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        let currentLang = I18nManager.isRTL ? 'ar' : 'en';
        const storedLang = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
        if (storedLang && ['ar', 'en'].includes(storedLang)) {
          currentLang = storedLang;
        }
        if (I18nManager.isRTL !== (currentLang === 'ar')) {
          I18nManager.forceRTL(currentLang === 'ar');
        }
        setAppLanguage(currentLang);

        let currentIsDark = systemColorScheme === 'dark';
        const storedDarkMode = await AsyncStorage.getItem(APP_DARK_MODE_KEY);
        if (storedDarkMode !== null) {
          currentIsDark = storedDarkMode === 'true';
        }
        setIsAppDarkMode(currentIsDark);

        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);

      } catch (e) {
        console.error("App Initialization Error:", e);
      } finally {
        setTimeout(() => {
          setIsAppReady(true);
        }, 2500);
      }
    };

    initializeApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleChangeLanguage = useCallback(async (newLang) => {
    if (newLang === appLanguage) return;
    try {
      await AsyncStorage.setItem(APP_LANGUAGE_KEY, newLang);
      const currentRoute = navigationRef.current?.getCurrentRoute()?.name;
      if (currentRoute) {
        await AsyncStorage.setItem(INTENDED_ROUTE_AFTER_RESTART_KEY, currentRoute);
      }
      const translations = effectiveGlobalAppTranslations[newLang] || effectiveGlobalAppTranslations['en'];
      Alert.alert(
        translations.restartTitle,
        translations.restartMessage,
        [{ text: translations.okButton, onPress: () => RNRestart.Restart() }],
        { cancelable: false }
      );
    } catch (error) {
      console.error("Failed to change language", error);
    }
  }, [appLanguage]);

  const handleToggleDarkMode = useCallback(async (newDarkModeState) => {
    if (newDarkModeState === isAppDarkMode) return;
    try {
      await AsyncStorage.setItem(APP_DARK_MODE_KEY, String(newDarkModeState));
      setIsAppDarkMode(newDarkModeState);
    } catch (error) {
      console.error("Failed to toggle dark mode", error);
    }
  }, [isAppDarkMode]);
  
  const onNavigationReady = useCallback(async () => {
    if (!isAppReady) return;
    try {
      const intendedRoute = await AsyncStorage.getItem(INTENDED_ROUTE_AFTER_RESTART_KEY);
      if (intendedRoute && navigationRef.current) {
        await AsyncStorage.removeItem(INTENDED_ROUTE_AFTER_RESTART_KEY);
        navigationRef.current.dispatch(CommonActions.navigate({ name: intendedRoute }));
      }
    } catch (error) {
      console.error("Failed post-restart navigation", error);
    }
  }, [isAppReady]);

  if (!isAppReady) {
    return <SplashScreen />;
  }

  // ✅ تحديد شاشة البداية
  // لو فيه سيشن -> ابدأ بـ Weight
  // لو مفيش سيشن -> ابدأ بـ Index
  const initialRouteName = session && session.user ? "Weight" : "Index";

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
          <RootStack 
            language={appLanguage} 
            darkMode={isAppDarkMode} 
            handlers={{ handleChangeLanguage, handleToggleDarkMode }} 
            initialRoute={initialRouteName}
          />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;