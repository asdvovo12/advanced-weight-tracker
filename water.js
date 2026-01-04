import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, SafeAreaView,
  Platform, I18nManager, Alert, Image, ActivityIndicator, AppState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from './supabaseClient'; // 1. استيراد Supabase

// --- الثوابت ومسارات الأصول ---
const WATER_DATA_PREFIX = 'waterData_';
const CUP_OUTLINE_IMAGE = require('./assets/cup.gif');
const waterFillGifSources = [
  require('./assets/cup.gif'), require('./assets/cup1.gif'), require('./assets/cup2.gif'),
  require('./assets/cup3.gif'), require('./assets/cup4.gif'), require('./assets/cup5.gif'),
  require('./assets/cup6.gif'), require('./assets/cup7.gif'), require('./assets/cup8.gif'),
  require('./assets/cup9.gif'), require('./assets/cup10.gif'), require('./assets/cup11.gif'),
  require('./assets/cup12.gif'), require('./assets/cup13.gif'), require('./assets/cup14.gif'),
  require('./assets/cup15.gif'), require('./assets/cup16.gif'), require('./assets/cup17.gif'),
];
const NUM_WATER_FILL_GIFS = waterFillGifSources.length;
const CUP_DISPLAY_WIDTH = 300; const CUP_DISPLAY_HEIGHT = 300; const CUP_TEXT_BOTTOM_OFFSET = CUP_DISPLAY_HEIGHT * 0.1;

const getLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const WaterTrackingScreen = ({ language: propLanguage, isDarkMode: propIsDarkMode }) => {
  const [language, setLanguage] = useState(propLanguage || (I18nManager.isRTL ? 'ar' : 'en'));
  const [isDarkMode, setIsDarkMode] = useState(propIsDarkMode ?? false);
  const [todayDateString, setTodayDateString] = useState(getLocalDateString(new Date()));
  
  const [currentAmount, setCurrentAmount] = useState(0);
  const [targetAmount, setTargetAmount] = useState(2000);
  const [waterHistory, setWaterHistory] = useState([]);
  const [dailyAverage, setDailyAverage] = useState(0);
  const [streak, setStreak] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => { if (propLanguage && propLanguage !== language) setLanguage(propLanguage); }, [propLanguage, language]);
  useEffect(() => { if (propIsDarkMode !== undefined && propIsDarkMode !== isDarkMode) setIsDarkMode(propIsDarkMode); }, [propIsDarkMode, isDarkMode]);
  
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
        if (nextAppState === 'active') {
            const newTodayString = getLocalDateString(new Date());
            if (newTodayString !== todayDateString) {
                setTodayDateString(newTodayString);
            }
        }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => { subscription.remove(); };
  }, [todayDateString]);
  
  const translations = useMemo(() => ({
    ar: { code: 'ar', title: 'تتبع شرب الماء', progressText: 'مل', addWater100: '+ ١٠٠ مل', addWater200: '+ ٢٠٠ مل', addWater300: '+ ٣٠٠ مل', customAmountPlaceholder: 'كمية مخصصة (مل)', addCustomBtn: 'إضافة', dailyAverage: 'المعدل اليومي', streak: 'أيام متتالية', todayTotal: 'إجمالي اليوم', recordLabel: 'سجل اليوم', resetBtn: 'إعادة تعيين', emptyHistory: 'لا يوجد سجل بعد.', errorTitle: "خطأ", invalidAmountError: "الرجاء إدخال كمية صالحة.", goalReachedTitle: "الهدف تحقق", goalReachedMessage: "لقد وصلت إلى هدفك اليومي بالفعل!", loadingText: "جاري التحميل..." },
    en: { code: 'en', title: 'Water Tracking', progressText: 'ml', addWater100: '+ 100 ml', addWater200: '+ 200 ml', addWater300: '+ 300 ml', customAmountPlaceholder: 'Custom Amount (ml)', addCustomBtn: 'Add', dailyAverage: 'Daily Average', streak: 'Streak', todayTotal: 'Today\'s Total', recordLabel: 'Today\'s Record', resetBtn: 'Reset', emptyHistory: 'No record yet.', errorTitle: "Error", invalidAmountError: "Please enter a valid amount.", goalReachedTitle: "Goal Reached", goalReachedMessage: "You've already reached your daily goal!", loadingText: "Loading..." },
  }), []);

  const activeTranslation = useMemo(() => translations[language] || translations.en, [language, translations]);
  const currentStyles = useMemo(() => (isDarkMode ? darkStyles : lightStyles), [isDarkMode]);

  useFocusEffect(
    useCallback(() => {
        // حساب الإحصائيات (يمكن تطويره لاحقاً ليأخذ من Supabase مباشرة، 
        // حالياً سنعتمد على المحلي للسرعة طالما البيانات تم تحميلها عند الفتح)
        const calculateStats = async () => {
            try {
                const allKeys = await AsyncStorage.getAllKeys();
                const waterKeys = allKeys.filter(key => key.startsWith(WATER_DATA_PREFIX));
                if (waterKeys.length === 0) {
                    setDailyAverage(0);
                    setStreak(0);
                    return;
                }

                const allWaterData = await AsyncStorage.multiGet(waterKeys);
                const dailyTotals = allWaterData.map(([key, value]) => {
                    if (!value) return null;
                    const date = key.replace(WATER_DATA_PREFIX, '');
                    const data = JSON.parse(value);
                    const total = (data.waterHistory || []).reduce((sum, entry) => sum + (entry.amount || 0), 0);
                    return { date, total, target: data.targetAmount || 2000 };
                }).filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date));

                const totalIntake = dailyTotals.reduce((sum, day) => sum + day.total, 0);
                const avg = dailyTotals.length > 0 ? totalIntake / dailyTotals.length : 0;
                setDailyAverage(Math.round(avg));
                
                let currentStreak = 0;
                let currentDateCheck = new Date();

                const todayData = dailyTotals.find(d => d.date === todayDateString);
                if (!todayData || todayData.total < todayData.target) {
                    currentDateCheck.setDate(currentDateCheck.getDate() - 1);
                }

                for (let i = 0; i < dailyTotals.length; i++) {
                    const expectedDateString = getLocalDateString(currentDateCheck);
                    const dayData = dailyTotals.find(d => d.date === expectedDateString);

                    if (dayData && dayData.total >= dayData.target) {
                        currentStreak++;
                        currentDateCheck.setDate(currentDateCheck.getDate() - 1);
                    } else {
                        break;
                    }
                }
                setStreak(currentStreak);

            } catch (e) {
                console.error("Failed to calculate stats:", e);
                setDailyAverage(0);
                setStreak(0);
            }
        };
        calculateStats();
    }, [todayDateString])
  );
  
  // ---------------------------------------------------------
  // 2. تحميل البيانات (Download from Supabase)
  // ---------------------------------------------------------
  useEffect(() => {
    const initializeScreenData = async () => {
      setIsInitialized(false);
      try {
        const todayKey = `${WATER_DATA_PREFIX}${todayDateString}`;
        
        // أ. جلب الهدف (Target) من المحلي مبدئياً
        let localTarget = 2000;
        const localDataString = await AsyncStorage.getItem(todayKey);
        if (localDataString) {
             const parsed = JSON.parse(localDataString);
             if (parsed.targetAmount) localTarget = parsed.targetAmount;
        }

        // ب. محاولة الجلب من Supabase
        const { data: { user } } = await supabase.auth.getUser();
        let fetchedHistory = [];
        let fetchedTotal = 0;

        if (user) {
            // جلب سجلات اليوم من جدول water_intake
            const { data: cloudWater, error } = await supabase
                .from('water_intake')
                .select('*')
                .eq('user_id', user.id)
                .eq('date', todayDateString)
                .order('created_at', { ascending: true });

            if (!error && cloudWater && cloudWater.length > 0) {
                // تحويل البيانات لشكل التطبيق
                fetchedHistory = cloudWater.map(item => {
                    // تحويل وقت السيرفر لوقت محلي للعرض
                    const dateObj = new Date(item.created_at);
                    const timeString = dateObj.toLocaleTimeString(
                        activeTranslation.code === 'ar' ? 'ar-EG' : 'en-US', 
                        { hour: '2-digit', minute: '2-digit' }
                    );
                    return {
                        id: item.id,
                        time: timeString,
                        amount: item.amount_ml
                    };
                });
                fetchedTotal = fetchedHistory.reduce((sum, item) => sum + item.amount, 0);

                // تحديث النسخة المحلية (Sync Local Cache)
                const dataToSave = { targetAmount: localTarget, waterHistory: fetchedHistory };
                await AsyncStorage.setItem(todayKey, JSON.stringify(dataToSave));
            } else {
                // لو مفيش بيانات في السحابة لليوم ده، نعتمد على المحلي
                if (localDataString) {
                    const data = JSON.parse(localDataString);
                    fetchedHistory = Array.isArray(data.waterHistory) ? data.waterHistory : [];
                    fetchedTotal = fetchedHistory.reduce((sum, entry) => sum + (entry.amount || 0), 0);
                }
            }
        } else {
             // مستخدم زائر - استخدام المحلي فقط
             if (localDataString) {
                const data = JSON.parse(localDataString);
                fetchedHistory = Array.isArray(data.waterHistory) ? data.waterHistory : [];
                fetchedTotal = fetchedHistory.reduce((sum, entry) => sum + (entry.amount || 0), 0);
            }
        }

        setTargetAmount(localTarget);
        setWaterHistory(fetchedHistory);
        setCurrentAmount(fetchedTotal);

      } catch (error) {
        console.error('WaterTrackingScreen: Error loading data:', error);
        setTargetAmount(2000); setCurrentAmount(0); setWaterHistory([]);
      } finally {
        setIsInitialized(true);
      }
    };
    initializeScreenData();
  }, [todayDateString]); // Removed activeTranslation dependency to avoid loops

  const saveData = useCallback(async (dataToSave) => {
    if (!isInitialized) return;
    try {
      const todayKey = `${WATER_DATA_PREFIX}${todayDateString}`;
      const validatedData = {
        targetAmount: dataToSave.targetAmount ?? 2000,
        waterHistory: Array.isArray(dataToSave.waterHistory) ? dataToSave.waterHistory : [],
      };
      await AsyncStorage.setItem(todayKey, JSON.stringify(validatedData));
    } catch (error) { console.error('WaterTrackingScreen: Error saving data:', error); }
  }, [isInitialized, todayDateString]);
  
  // ---------------------------------------------------------
  // 3. إضافة ماء (Upload to Supabase)
  // ---------------------------------------------------------
  const addWater = useCallback(async (amount) => {
    if (currentAmount >= targetAmount) { Alert.alert(activeTranslation.goalReachedTitle, activeTranslation.goalReachedMessage); return; }
    const amountToAdd = Math.max(0, Number(amount));
    if (amountToAdd === 0 || isNaN(amountToAdd)) return;
    
    // أ. التحديث المحلي (UI + AsyncStorage)
    const newEntry = { 
        id: `${Date.now()}-${Math.random()}`, 
        time: new Date().toLocaleTimeString(activeTranslation.code === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }), 
        amount: amountToAdd 
    };
    const updatedHistory = [...waterHistory, newEntry];
    const newCurrentAmount = currentAmount + amountToAdd;
    
    setWaterHistory(updatedHistory); 
    setCurrentAmount(newCurrentAmount); 
    saveData({ targetAmount, waterHistory: updatedHistory });

    // ب. التحديث في Supabase
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.from('water_intake').insert({
                user_id: user.id,
                amount_ml: amountToAdd,
                date: todayDateString
            });
        }
    } catch (error) {
        console.log("Error syncing water intake:", error);
    }

  }, [waterHistory, currentAmount, targetAmount, activeTranslation, saveData, todayDateString]);

  const addCustomWater = useCallback(() => {
    const amount = parseInt(customAmount, 10);
    if (!isNaN(amount) && amount > 0) { addWater(amount); setCustomAmount(''); }
    else { Alert.alert(activeTranslation.errorTitle, activeTranslation.invalidAmountError); setCustomAmount(''); }
  }, [customAmount, addWater, activeTranslation]);
  
  // ---------------------------------------------------------
  // 4. إعادة التعيين (Delete from Supabase)
  // ---------------------------------------------------------
  const resetData = useCallback(async () => {
    // أ. المسح المحلي
    setCurrentAmount(0);
    setWaterHistory([]);
    saveData({ targetAmount, waterHistory: [] });

    // ب. المسح من Supabase لليوم الحالي
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase
                .from('water_intake')
                .delete()
                .eq('user_id', user.id)
                .eq('date', todayDateString);
        }
    } catch (error) {
        console.log("Error resetting water data:", error);
    }
  }, [targetAmount, saveData, todayDateString]);

  const displayCurrentAmount = useMemo(() => (Math.min(currentAmount, targetAmount)), [currentAmount, targetAmount]);
  const selectedWaterFillGifIndex = useMemo(() => { if (targetAmount <= 0 || currentAmount <= 0) return 0; if (currentAmount >= targetAmount) return NUM_WATER_FILL_GIFS - 1; const numberOfActualWaterLevels = NUM_WATER_FILL_GIFS - 1; const percentage = (currentAmount / targetAmount) * 100; const segmentSize = 100 / numberOfActualWaterLevels; let waterLevelIndex = Math.floor(percentage / segmentSize); waterLevelIndex = Math.min(waterLevelIndex, numberOfActualWaterLevels - 1); let gifIndex = waterLevelIndex + 1; gifIndex = Math.min(gifIndex, NUM_WATER_FILL_GIFS - 1); if (currentAmount > 0 && gifIndex === 0) gifIndex = 1; return gifIndex; }, [currentAmount, targetAmount]);
  const currentWaterFillGif = waterFillGifSources[selectedWaterFillGifIndex];
  
  const renderHistoryItem = useCallback(({ item }) => (<View style={currentStyles.historyItem}><Text style={currentStyles.historyTextAmount}>{item.amount.toLocaleString(activeTranslation.code === 'ar' ? 'ar-EG' : 'en-US')} {activeTranslation.progressText}</Text><Text style={currentStyles.historyTextTime}>{item.time}</Text></View>), [currentStyles, activeTranslation.code, activeTranslation.progressText]);
  const ListEmptyComponent = useMemo(() => (<Text style={currentStyles.emptyHistoryText}>{activeTranslation.emptyHistory}</Text>), [currentStyles.emptyHistoryText, activeTranslation.emptyHistory]);
  
  if (!isInitialized) {
    return (
      <View style={[currentStyles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={isDarkMode ? '#a5d6a7' : '#2e7d32'} />
        <Text style={{ color: isDarkMode ? '#fff' : '#000', marginTop: 15 }}>{activeTranslation.loadingText}</Text>
      </View>
    );
  }

  const goalReached = currentAmount >= targetAmount;

  return (
    <SafeAreaView style={currentStyles.wrapper}>
      <ScrollView style={currentStyles.scrollView} contentContainerStyle={currentStyles.scrollContentContainer} keyboardShouldPersistTaps="handled" key={language}>
        <View style={currentStyles.innerContainer}>
          <View style={currentStyles.header}><Text style={currentStyles.title}>{activeTranslation.title}</Text></View>
          <View style={currentStyles.cupDisplayContainer}><Image source={CUP_OUTLINE_IMAGE} style={currentStyles.cupOutlineImageStyle} resizeMode="contain"/><Image source={currentWaterFillGif} style={currentStyles.waterFillGifStyle} resizeMode="contain" /><View style={currentStyles.cupTextOverlay}><Text style={currentStyles.cupAmountText}>{displayCurrentAmount.toLocaleString(activeTranslation.code === 'ar' ? 'ar-EG' : 'en-US')} / {targetAmount.toLocaleString(activeTranslation.code === 'ar' ? 'ar-EG' : 'en-US')} {activeTranslation.progressText}</Text></View></View>
          <View style={currentStyles.addWater}><TouchableOpacity style={[currentStyles.addButton, goalReached && currentStyles.disabledButton]} onPress={() => addWater(100)} disabled={goalReached}><Text style={currentStyles.addButtonText}>{activeTranslation.addWater100}</Text></TouchableOpacity><TouchableOpacity style={[currentStyles.addButton, goalReached && currentStyles.disabledButton]} onPress={() => addWater(200)} disabled={goalReached}><Text style={currentStyles.addButtonText}>{activeTranslation.addWater200}</Text></TouchableOpacity><TouchableOpacity style={[currentStyles.addButton, goalReached && currentStyles.disabledButton]} onPress={() => addWater(300)} disabled={goalReached}><Text style={currentStyles.addButtonText}>{activeTranslation.addWater300}</Text></TouchableOpacity></View>
          <View style={currentStyles.customInput}><TextInput style={currentStyles.input} keyboardType="numeric" value={customAmount} onChangeText={setCustomAmount} placeholder={activeTranslation.customAmountPlaceholder} placeholderTextColor={currentStyles.placeholderColor?.color} editable={!goalReached}/><TouchableOpacity style={[currentStyles.addCustomButton, goalReached && currentStyles.disabledButton]} onPress={addCustomWater} disabled={goalReached}><Text style={currentStyles.addCustomButtonText}>{activeTranslation.addCustomBtn}</Text></TouchableOpacity></View>
          <View style={currentStyles.stats}>
            <View style={currentStyles.stat}><Text style={currentStyles.statValue}>{dailyAverage.toLocaleString(activeTranslation.code === 'ar' ? 'ar-EG' : 'en-US')}</Text><Text style={currentStyles.statLabel}>{activeTranslation.dailyAverage}</Text></View>
            <View style={currentStyles.stat}><Text style={currentStyles.statValue}>{streak.toLocaleString(activeTranslation.code === 'ar' ? 'ar-EG' : 'en-US')}</Text><Text style={currentStyles.statLabel}>{activeTranslation.streak}</Text></View>
            <View style={currentStyles.stat}><Text style={currentStyles.statValue}>{currentAmount.toLocaleString(activeTranslation.code === 'ar' ? 'ar-EG' : 'en-US')}</Text><Text style={currentStyles.statLabel}>{activeTranslation.todayTotal}</Text></View>
          </View>
          <Text style={currentStyles.recordLabel}>{activeTranslation.recordLabel}</Text>
          
          <ScrollView 
            style={currentStyles.historyList} 
            contentContainerStyle={currentStyles.historyListContent}
            nestedScrollEnabled={true}
          >
            {waterHistory.length === 0 ? (
                ListEmptyComponent
            ) : (
                waterHistory.slice().reverse().map((item) => (
                    <View key={item.id}>
                        {renderHistoryItem({ item })}
                    </View>
                ))
            )}
          </ScrollView>

          <TouchableOpacity onPress={resetData} style={currentStyles.resetButton}><Text style={currentStyles.resetButtonText}>{activeTranslation.resetBtn}</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const baseStyles = {
  cupDisplayContainer: { width: CUP_DISPLAY_WIDTH, height: CUP_DISPLAY_HEIGHT, alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 25, alignSelf: 'center', },
  cupOutlineImageStyle: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, },
  waterFillGifStyle: { width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1, },
  cupTextOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 2, paddingBottom: CUP_TEXT_BOTTOM_OFFSET, },
  disabledButton: { opacity: 0.6, }
};

const lightStyles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#e8f5e9' },
  scrollView: { flex: 1 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 50, paddingTop: Platform.OS === 'ios' ? 20 : 15, paddingHorizontal: 0 },
  innerContainer: { flex: 1, backgroundColor: '#ffffff', borderRadius: 20, padding: 20, marginHorizontal: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5, minHeight: Platform.OS === 'ios' ? 700 : 650 },
  header: { alignItems: 'center', marginBottom: 25 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#2e7d32', textAlign: 'center' },
  ...baseStyles,
  cupAmountText: { textAlign: 'center', fontSize: 16, fontWeight: '600', color: '#388e3c', },
  addWater: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 25, marginTop: 15 },
  addButton: { backgroundColor: '#4caf50', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 20, minWidth: 90, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3 },
  addButtonText: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  customInput: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  input: { flex: 1, maxWidth: 150, paddingVertical: Platform.OS === 'ios' ? 12 : 10, paddingHorizontal: 15, borderColor: '#a5d6a7', borderWidth: 1, borderRadius: 25, fontSize: 16, marginRight: 10, color: '#000000', backgroundColor: '#f1f8e9', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  placeholderColor: { color: '#666' },
  addCustomButton: { backgroundColor: '#388e3c', paddingVertical: Platform.OS === 'ios' ? 12 : 10, paddingHorizontal: 20, borderRadius: 20, marginLeft: 5, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  addCustomButtonText: { color: '#ffffff', fontSize: 15, fontWeight: 'bold' },
  stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30, paddingVertical: 15, backgroundColor: '#f9f9f9', borderRadius: 10 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#388e3c', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#757575', textAlign: 'center' },
  recordLabel: { fontSize: 18, fontWeight: 'bold', color: '#4caf50', marginBottom: 10, marginLeft: 5, textAlign: I18nManager.isRTL ? 'right' : 'left' },
  
  historyList: { maxHeight: 180, marginBottom: 20, borderRadius: 5 },
  historyListContent: { paddingBottom: 10 },
  
  historyItem: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 10, borderBottomColor: '#e0e0e0', borderBottomWidth: 1, backgroundColor: '#ffffff' },
  historyTextAmount: { color: '#333', fontSize: 15, fontWeight: '500' },
  historyTextTime: { color: '#666', fontSize: 14 },
  emptyHistoryText: { textAlign: 'center', marginTop: 20, color: '#999', fontSize: 14 },
  resetButton: { backgroundColor: '#ff6f60', borderRadius: 25, paddingVertical: 12, paddingHorizontal: 30, alignItems: 'center', marginTop: 10, alignSelf: 'center', minWidth: 150, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  resetButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});

const darkStyles = StyleSheet.create({
    ...lightStyles, 
    wrapper: { ...lightStyles.wrapper, backgroundColor: '#121212' }, 
    innerContainer: { ...lightStyles.innerContainer, backgroundColor: '#1e1e1e', shadowColor: '#000', elevation: 8, },
    title: { ...lightStyles.title, color: '#a5d6a7' }, 
    cupAmountText: { ...lightStyles.cupAmountText, color: '#e0f2f1' }, 
    addButton: { ...lightStyles.addButton, backgroundColor: '#00796b' }, 
    addButtonText: { ...lightStyles.addButtonText, color: '#e0f2f1' }, 
    input: { ...lightStyles.input, borderColor: '#4db6ac', backgroundColor: '#333333', color: '#ffffff' },
    placeholderColor: { color: '#999' },
    addCustomButton: { ...lightStyles.addCustomButton, backgroundColor: '#00695c' },
    addCustomButtonText: { ...lightStyles.addCustomButtonText, color: '#e0f2f1' },
    stats: { ...lightStyles.stats, backgroundColor: '#2c2c2c' }, 
    statValue: { ...lightStyles.statValue, color: '#ffffff' }, 
    statLabel: { ...lightStyles.statLabel, color: '#b0b0b0' }, 
    recordLabel: { ...lightStyles.recordLabel, color: '#80cbc4' }, 
    historyItem: { ...lightStyles.historyItem, backgroundColor: '#1e1e1e', borderBottomColor: '#424242' },
    historyTextAmount: { ...lightStyles.historyTextAmount, color: '#e0e0e0' },
    historyTextTime: { ...lightStyles.historyTextTime, color: '#a0a0a0' },
    emptyHistoryText: { ...lightStyles.emptyHistoryText, color: '#777' },
    resetButton: { ...lightStyles.resetButton, backgroundColor: '#c62828' }, 
});

export default WaterTrackingScreen;