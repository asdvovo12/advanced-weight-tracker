import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  SafeAreaView, View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal, I18nManager, AppState, Pressable, Animated, ActivityIndicator, useColorScheme, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Svg, Circle, Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Picker from 'react-native-wheel-picker-expo';
import { Pedometer } from 'expo-sensors';
import { supabase } from './supabaseClient';

// --- استيراد مكونات الأسبوع والشهر ---
import WeeklyDistance from './WeeklyDistance'; 
import MonthlyDistance from './monthlydistance';

// --- الثوابت والأبعاد (تم التحديث لتطابق صفحة الخطوات) ---
const { width, height } = Dimensions.get('window');

// *** تعديلات لتطابق الكود الثاني ***
const CIRCLE_SIZE = width * 0.60; // نفس حجم دائرة الخطوات
const CIRCLE_BORDER_WIDTH = 15;   // نفس سمك خط دائرة الخطوات
const SVG_VIEWBOX_SIZE = CIRCLE_SIZE;
const PATH_RADIUS = (CIRCLE_SIZE / 2) - (CIRCLE_BORDER_WIDTH / 2);
const CENTER_X = SVG_VIEWBOX_SIZE / 2;
const CENTER_Y = SVG_VIEWBOX_SIZE / 2;
const ICON_SIZE = 22; // حجم النقطة

const MENU_VERTICAL_OFFSET = 5;
const MENU_ARROW_WIDTH = 14;
const MENU_ARROW_HEIGHT = 8;
const CHALLENGE_DURATIONS = [7, 14, 30];
const INITIAL_CHALLENGE_DURATION = CHALLENGE_DURATIONS[0];
const BADGE_CONTAINER_SIZE = 60; const BADGE_SVG_SIZE = BADGE_CONTAINER_SIZE; const BADGE_CIRCLE_BORDER_WIDTH = 5; const BADGE_PATH_RADIUS = (BADGE_SVG_SIZE / 2) - (BADGE_CIRCLE_BORDER_WIDTH / 2); const BADGE_CENTER_X = BADGE_SVG_SIZE / 2; const BADGE_CENTER_Y = BADGE_SVG_SIZE / 2;
const CHART_HEIGHT = 200; const CALORIES_PER_STEP = 0.04; const STEP_LENGTH_METERS = 0.762; const STEPS_PER_MINUTE = 100;

// --- مفاتيح AsyncStorage ---
const LAST_PARTICIPATION_DATE_KEY = '@StepsChallenge:lastParticipationDate';
const REMAINING_CHALLENGE_DAYS_KEY = '@StepsChallenge:remainingDays';
const CURRENT_CHALLENGE_DURATION_KEY = '@StepsChallenge:currentDuration';
const DAILY_STEPS_HISTORY_KEY = '@Steps:DailyHistory';
const GOAL_KEY = '@Distance:goal';

// --- كائن الترجمة ---
const translations = {
    ar: {
        headerTitle: 'المسافة', today: 'اليوم', week: 'أسبوع', month: 'شهر', yesterday: 'أمس', goalPrefix: 'الهدف', kmUnit: 'كم', miUnit: 'ميل',
        caloriesLabel: 'كيلوكالوري', timeLabel: 'ساعات', stepsLabel: 'خطوة',
        challengePrefix: 'أيام تحدي', challengeCompleted: 'اكتمل التحدي!', challengeRemainingSingular: 'يوم متبقي', challengeRemainingPlural: 'أيام متبقية', challengeDaySuffix: 'ي',
        goalModalTitle: 'هدف المسافه', save: 'حفظ', cancel: 'إلغاء',
        weeklyChartTitle: 'إحصائيات الأسبوع (كم)', testButton: 'اختبار (+0.5 كم)', resetButton: 'إعادة',
        menuSteps: 'الخطوات', menuDistance: 'المسافة', menuCalories: 'السعرات', menuActiveTime: 'الوقت النشط',
        dayNamesShort: ['س', 'أ', 'ن', 'ث', 'ر', 'خ', 'ج'],
        errorTitle: "خطأ", pedometerNotAvailable: "عداد الخطى غير متوفر", cannotSaveGoalError: "لم نتمكن من حفظ الهدف."
    },
    en: {
        headerTitle: 'Distance', today: 'Today', week: 'Week', month: 'Month', yesterday: 'Yesterday', goalPrefix: 'Goal', kmUnit: 'km', miUnit: 'mi',
        caloriesLabel: 'Kcal', timeLabel: 'Hours', stepsLabel: 'Steps',
        challengePrefix: 'Day Challenge', challengeCompleted: 'Challenge Completed!', challengeRemainingSingular: 'day remaining', challengeRemainingPlural: 'days remaining', challengeDaySuffix: 'd',
        goalModalTitle: 'Distance Goal', save: 'Save', cancel: 'Cancel',
        weeklyChartTitle: 'Weekly Stats (km)', testButton: 'Test (+0.5 km)', resetButton: 'Reset',
        menuSteps: 'Steps', menuDistance: 'Distance', menuCalories: 'Calories', menuActiveTime: 'Active Time',
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        errorTitle: "Error", pedometerNotAvailable: "Pedometer not available", cannotSaveGoalError: "Could not save goal."
    }
};

// --- الدوال المساعدة (تم تحديث دوال الرسم لتطابق الكود الثاني) ---

// رسم القوس (نفس الكود الثاني)
const describeArc = (x, y, radius, startAngleDeg, endAngleDeg) => { 
    const clampedEndAngle = Math.min(endAngleDeg, 359.999); 
    const startAngleRad = ((startAngleDeg - 90) * Math.PI) / 180.0; 
    const endAngleRad = ((clampedEndAngle - 90) * Math.PI) / 180.0; 
    const startX = x + radius * Math.cos(startAngleRad); 
    const startY = y + radius * Math.sin(startAngleRad); 
    const endX = x + radius * Math.cos(endAngleRad); 
    const endY = y + radius * Math.sin(endAngleRad); 
    const largeArcFlag = clampedEndAngle - startAngleDeg <= 180 ? '0' : '1'; 
    const sweepFlag = '1'; 
    const d = [ 'M', startX, startY, 'A', radius, radius, 0, largeArcFlag, sweepFlag, endX, endY ].join(' '); 
    return d; 
};

// حساب موقع النقطة (نفس الكود الثاني لضمان التطابق)
const calculateIconPositionOnPath = (angleDegrees) => { 
    const angleRad = (angleDegrees * Math.PI) / 180; 
    const iconRadius = PATH_RADIUS; 
    
    // نفس المنطق المستخدم في صفحة الخطوات
    const xOffset = -iconRadius * Math.sin(angleRad); 
    const yOffset = -iconRadius * Math.cos(angleRad); 

    const iconCenterX = CENTER_X + xOffset; 
    const iconCenterY = CENTER_Y + yOffset; 

    const top = iconCenterY - (ICON_SIZE / 2); 
    const left = iconCenterX - (ICON_SIZE / 2); 

    return { 
        position: 'absolute', 
        width: ICON_SIZE, 
        height: ICON_SIZE, 
        top, 
        left, 
        zIndex: 10, 
        justifyContent: 'center', 
        alignItems: 'center' 
    }; 
};

const getDateString = (date) => { if (!date || !(date instanceof Date)) return null; return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10); };
const isToday = (someDate) => { const today = new Date(); return someDate.getUTCFullYear() === today.getUTCFullYear() && someDate.getUTCMonth() === today.getUTCMonth() && someDate.getUTCDate() === today.getUTCDate(); };
const isYesterday = (someDate) => { const today = new Date(); const yesterday = new Date(today); yesterday.setUTCDate(yesterday.getUTCDate() - 1); return someDate.getUTCFullYear() === yesterday.getUTCFullYear() && someDate.getUTCMonth() === yesterday.getUTCMonth() && someDate.getUTCDate() === yesterday.getUTCDate(); };
const getStartOfWeek = (date, startOfWeekDay) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); const currentUTCDate = d.getUTCDate(); const currentUTCDay = d.getUTCDay(); let diff = currentUTCDay - startOfWeekDay; if (diff < 0) diff += 7; d.setUTCDate(currentUTCDate - diff); return d; };
const getEndOfWeek = (date, startOfWeekDay) => { const start = getStartOfWeek(date, startOfWeekDay); const end = new Date(start); end.setUTCDate(start.getUTCDate() + 6); end.setUTCHours(23, 59, 59, 999); return end; };
const addDays = (date, days) => { const result = new Date(date); result.setUTCDate(result.getUTCDate() + days); return result; };
const isSameWeek = (date1, date2, startOfWeekDay) => { if (!date1 || !date2) return false; const start1 = getStartOfWeek(date1, startOfWeekDay); const start2 = getStartOfWeek(date2, startOfWeekDay); return start1.getTime() === start2.getTime(); };
const getStartOfMonth = (date) => { const d = new Date(date); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(1); return d; };
const addMonths = (date, months) => { const d = new Date(date); d.setUTCMonth(d.getUTCMonth() + months); return d; };
const formatDateRange = (startDate, endDate, lang) => { const locale = lang === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory'; const optionsDayMonth = { day: 'numeric', month: 'long', timeZone: 'UTC' }; const optionsDay = { day: 'numeric', timeZone: 'UTC' }; if (startDate.getUTCMonth() === endDate.getUTCMonth()) { const monthName = endDate.toLocaleDateString(locale, { month: 'long', timeZone: 'UTC' }); return `${startDate.toLocaleDateString(locale, optionsDay)} - ${endDate.toLocaleDateString(locale, optionsDay)} ${monthName}`; } else { return `${startDate.toLocaleDateString(locale, optionsDayMonth)} - ${endDate.toLocaleDateString(locale, optionsDayMonth)}`; } };
const getDaysInMonth = (date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();

// --- المكونات الفرعية ---
const GoalModal = ({ visible, onClose, onSave, currentValue, currentUnit, translation, styles }) => { const [tempValue, setTempValue] = useState(currentValue); const [tempUnit, setTempUnit] = useState(currentUnit); const distanceValues = Array.from({ length: 120 }, (_, i) => ((i + 1) * 0.5).toFixed(1)); const unitValues = [translation.kmUnit, translation.miUnit]; useEffect(() => { if (visible) { setTempValue(currentValue); setTempUnit(currentUnit); } }, [visible, currentValue, currentUnit]); const handleSave = () => { onSave(tempValue, tempUnit); }; return ( <Modal animationType="fade" transparent={true} visible={visible} onRequestClose={onClose}><View style={styles.modalOverlay}><View style={styles.modalCard}><Text style={styles.modalTitle}>{translation.goalModalTitle}</Text><View style={styles.pickersContainer}><Picker height={180} initialSelectedIndex={distanceValues.indexOf(tempValue.toFixed(1))} items={distanceValues.map(val => ({ label: val, value: val }))} onChange={({ item }) => setTempValue(parseFloat(item.value))} renderItem={(item, i, isSelected) => ( <Text style={isSelected ? styles.selectedPickerItemText : styles.pickerItemText}>{item.label}</Text> )} haptics /><Picker height={180} width={120} initialSelectedIndex={unitValues.indexOf(tempUnit)} items={unitValues.map(val => ({ label: val, value: val }))} onChange={({ item }) => setTempUnit(item.value)} renderItem={(item, i, isSelected) => ( <Text style={isSelected ? styles.selectedPickerItemText : styles.pickerItemText}>{item.label}</Text> )} haptics /></View><View style={styles.buttonRow}><TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}><Text style={styles.cancelButtonText}>{translation.cancel}</Text></TouchableOpacity><TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}><Text style={styles.saveButtonText}>{translation.save}</Text></TouchableOpacity></View></View></View></Modal> ); };
const AnimatedStatCard = ({ iconName, value, label, formatter, styles }) => { const animatedValue = useRef(new Animated.Value(value || 0)).current; const [displayValue, setDisplayValue] = useState(() => formatter(value || 0)); useEffect(() => { Animated.timing(animatedValue, { toValue: value || 0, duration: 750, useNativeDriver: false }).start(); }, [value]); useEffect(() => { const listenerId = animatedValue.addListener((v) => { setDisplayValue(formatter(v.value)); }); return () => { animatedValue.removeListener(listenerId); }; }, [formatter, animatedValue]); return ( <View style={styles.statCard}><View style={styles.iconContainer}><Icon name={iconName} size={24} color={styles.animatedStatIcon.color} /></View><Text style={styles.statValue}>{displayValue}</Text><Text style={styles.statLabel}>{label}</Text></View> ); };
const ChallengeCard = ({ onPress, currentChallengeDuration, remainingDays, translation, styles }) => { const daysCompleted = currentChallengeDuration - remainingDays; const badgeProgressAngle = remainingDays <= 0 || currentChallengeDuration <= 0 ? 359.999 : remainingDays >= currentChallengeDuration ? 0 : (daysCompleted / currentChallengeDuration) * 360; const badgeProgressPathD = describeArc(BADGE_CENTER_X, BADGE_CENTER_Y, BADGE_PATH_RADIUS, 0.01, badgeProgressAngle); const subText = remainingDays > 0 ? `${remainingDays.toLocaleString(I18nManager.isRTL ? 'ar-EG' : 'en-US')} ${remainingDays === 1 ? translation.challengeRemainingSingular : translation.challengeRemainingPlural}` : translation.challengeCompleted; const mainText = `${currentChallengeDuration.toLocaleString(I18nManager.isRTL ? 'ar-EG' : 'en-US')} ${translation.challengePrefix}`; return ( <TouchableOpacity style={styles.challengeCardWrapper} onPress={onPress} activeOpacity={0.8}><View style={styles.summaryCard}><View style={styles.badgeContainer}><Svg height={BADGE_SVG_SIZE} width={BADGE_SVG_SIZE} viewBox={`0 0 ${BADGE_SVG_SIZE} ${BADGE_SVG_SIZE}`}><Circle cx={BADGE_CENTER_X} cy={BADGE_CENTER_Y} r={BADGE_PATH_RADIUS} stroke={styles.badgeBackgroundCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" /><Path d={badgeProgressPathD} stroke={styles.badgeProgressCircle.stroke} strokeWidth={BADGE_CIRCLE_BORDER_WIDTH} fill="none" strokeLinecap="round" /></Svg><View style={styles.badgeTextContainer}><Text style={styles.badgeText}>{remainingDays > 0 ? `${remainingDays.toLocaleString(I18nManager.isRTL ? 'ar-EG' : 'en-US')}${translation.challengeDaySuffix}` : '✓'}</Text></View></View><View style={styles.summaryTextContainer}><Text style={styles.summaryMainText}>{mainText}</Text><Text style={styles.summarySubText}>{subText}</Text></View><Ionicons name={I18nManager.isRTL ? "chevron-forward" : "chevron-back"} size={24} color={styles.summaryChevron.color} /></View></TouchableOpacity> ); };

// *** هذا المكون الجديد المستبدل ***
const DistanceWeeklyChart = ({ weeklyDistanceData, goalDistance, onTestIncrement, onResetData, translation, styles, language }) => { 
    const [tooltipVisible, setTooltipVisible] = useState(false); 
    const [selectedBarIndex, setSelectedBarIndex] = useState(null); 
    const [selectedBarValue, setSelectedBarValue] = useState(null); 
    const days = translation.dayNamesShort; 
    const today = new Date(); 
    const startOfWeekDay = language === 'ar' ? 6 : 0; 
    const jsDayIndex = today.getDay(); 
    const displayDayIndex = (jsDayIndex - startOfWeekDay + 7) % 7; 
    
    // تحديد الاتجاه بناءً على اللغة (نفس منطق صفحة السعرات)
    // العربي: row (عشان يبدأ من اليمين في وضع RTL)
    // الإنجليزي: row-reverse (عشان نعكس الترتيب ويبدأ من اليسار)
    const chartDirection = language === 'ar' ? 'row' : 'row-reverse';
    
    // تحديد محاذاة العنوان
    const headerAlign = language === 'ar' ? 'flex-start' : 'flex-end';

    const { yAxisMax, yAxisLabels } = useMemo(() => { 
        const dataMax = Math.max(...weeklyDistanceData, goalDistance, 1); 
        const roundedMax = Math.ceil(dataMax); 
        const labels = [0, roundedMax * 0.25, roundedMax * 0.5, roundedMax * 0.75, roundedMax].map(v => parseFloat(v.toFixed(1))); 
        return { yAxisMax: roundedMax, yAxisLabels: [...new Set(labels)].sort((a,b) => b-a) }; 
    }, [weeklyDistanceData, goalDistance]); 
    
    const handleBarPress = useCallback((index, value) => { 
        const numericValue = value || 0; 
        if (tooltipVisible && selectedBarIndex === index) { 
            setTooltipVisible(false); 
        } else if (numericValue > 0) { 
            setTooltipVisible(true); 
            setSelectedBarIndex(index); 
            setSelectedBarValue(numericValue); 
        } else { 
            setTooltipVisible(false); 
        } 
    }, [tooltipVisible, selectedBarIndex]); 
    
    const handleOutsidePress = useCallback(() => { 
        if (tooltipVisible) { setTooltipVisible(false); } 
    }, [tooltipVisible]); 
    
    return ( 
        <Pressable style={styles.card} onPress={handleOutsidePress}>
            {/* تعديل محاذاة العنوان */}
            <View style={[styles.chartHeader, { alignItems: headerAlign }]}>
                <Text style={styles.chartTitle}>{translation.weeklyChartTitle}</Text>
            </View>
            
            <View style={styles.testButtonsContainer}>
                <TouchableOpacity onPress={onTestIncrement} style={styles.testButton}>
                    <Text style={styles.testButtonText}>{translation.testButton}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onResetData} style={styles.testButton}>
                    <Text style={styles.testButtonText}>{translation.resetButton}</Text>
                </TouchableOpacity>
            </View>
            
            {/* تطبيق الاتجاه الديناميكي على الحاوية الرئيسية */}
            <View style={[styles.chartAreaContainer, { flexDirection: chartDirection }]}>
                <View style={styles.yAxisLabels}>
                    {yAxisLabels.map(label => <Text key={label} style={styles.axisLabelY}>{label}</Text>)}
                </View>
                
                <View style={[styles.chartContent, { [language === 'ar' ? 'marginLeft' : 'marginRight']: 10 }]}>
                    {/* تطبيق الاتجاه الديناميكي على حاوية الأعمدة لترتيب الأيام */}
                    <View style={[styles.barsAndLabelsContainer, { flexDirection: chartDirection }]}>
                        {days.map((dayName, index) => { 
                            const value = weeklyDistanceData[index] || 0; 
                            const barHeight = yAxisMax > 0 ? Math.min(CHART_HEIGHT, (value / yAxisMax) * CHART_HEIGHT) : 0; 
                            const isCurrentDay = index === displayDayIndex; 
                            const isSelected = selectedBarIndex === index; 
                            return ( 
                                <View key={index} style={styles.barColumn}>
                                    {tooltipVisible && isSelected && selectedBarValue !== null && ( 
                                        <View style={[styles.tooltipPositioner, { bottom: barHeight + 30 }]}>
                                            <View style={styles.tooltipBox}>
                                                <Text style={styles.tooltipText}>{selectedBarValue.toFixed(1)} {translation.kmUnit}</Text>
                                            </View>
                                            <View style={styles.tooltipArrow} />
                                        </View> 
                                    )}
                                    <Pressable onPress={(e) => { e.stopPropagation(); handleBarPress(index, value); }} hitSlop={10}>
                                        <View style={[styles.bar, { height: barHeight }, isCurrentDay && styles.barToday, isSelected && value > 0 && styles.selectedBar, value >= goalDistance && styles.barGoalAchieved ]} />
                                    </Pressable>
                                    <Text style={[styles.axisLabelX, isCurrentDay && styles.activeDayLabel]}>{dayName}</Text>
                                </View> 
                            );
                        })}
                    </View>
                </View>
            </View>
        </Pressable> 
    ); 
};

// --- الشاشة الرئيسية ---
const DistanceScreen = (props) => {
  const { onNavigate, currentScreenName, onNavigateToAchievements, language: initialLanguage, isDarkMode: initialIsDarkMode } = props;
  
  const systemColorScheme = useColorScheme();
  const [language, setLanguage] = useState(initialLanguage || (I18nManager.isRTL ? 'ar' : 'en'));
  const [isDarkMode, setIsDarkMode] = useState(initialIsDarkMode === undefined ? systemColorScheme === 'dark' : initialIsDarkMode);
  
  const translation = useMemo(() => translations[language] || translations.ar, [language]);
  const currentStyles = useMemo(() => isDarkMode ? darkStyles : lightStyles, [isDarkMode]);
  const startOfWeekDay = useMemo(() => language === 'ar' ? 6 : 0, [language]);

  const [selectedPeriod, setSelectedPeriod] = useState('day');
  
  const [pedometerSteps, setPedometerSteps] = useState(0); 
  const [stepsHistory, setStepsHistory] = useState({});
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [goalDistance, setGoalDistance] = useState(3.0);
  const [goalUnit, setGoalUnit] = useState(translation.kmUnit);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const animatedAngle = useRef(new Animated.Value(0)).current;
  const [dynamicIconStyle, setDynamicIconStyle] = useState(() => calculateIconPositionOnPath(0));
  const [progressPathD, setProgressPathD] = useState('');
  const pedometerSubscription = useRef(null);
  const animatedDistance = useRef(new Animated.Value(0)).current;
  const [displayDistanceText, setDisplayDistanceText] = useState(language === 'ar' ? '٠٫٠٠' : '0.00');
  const [dailyChartData, setDailyChartData] = useState(Array(7).fill(0));
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => getStartOfWeek(new Date(), startOfWeekDay));
  const [weeklyData, setWeeklyData] = useState(Array(7).fill(0));
  const [isWeeklyLoading, setIsWeeklyLoading] = useState(false);
  const [isCurrentWeek, setIsCurrentWeek] = useState(true);
  const [selectedMonthStart, setSelectedMonthStart] = useState(() => getStartOfMonth(new Date()));
  const [monthlyData, setMonthlyData] = useState([]);
  const [isMonthlyLoading, setIsMonthlyLoading] = useState(false);
  const [isCurrentMonth, setIsCurrentMonth] = useState(true);
  const [isTitleMenuVisible, setIsTitleMenuVisible] = useState(false);
  const [titleMenuPosition, setTitleMenuPosition] = useState({ top: 0, left: undefined, right: undefined });
  const titleMenuTriggerRef = useRef(null);
  const [currentChallengeDuration, setCurrentChallengeDuration] = useState(INITIAL_CHALLENGE_DURATION);
  const [remainingDays, setRemainingDays] = useState(INITIAL_CHALLENGE_DURATION);
  const [appState, setAppState] = useState(AppState.currentState);

  const isViewingToday = useMemo(() => isToday(currentDate), [currentDate]);
  const dayLabel = useMemo(() => formatDisplayDate(currentDate, language, translation), [currentDate, language, translation]);

  const getStoredStepsHistory = useCallback(async () => {
        try { const storedHistory = await AsyncStorage.getItem(DAILY_STEPS_HISTORY_KEY); return storedHistory ? JSON.parse(storedHistory) : {}; } 
        catch (error) { console.error("Failed to get step history:", error); return {}; }
  }, []);

  const saveDailySteps = useCallback(async (date, steps) => {
      const dateString = getDateString(date);
      if (!dateString) return;
      try { 
          const history = await getStoredStepsHistory(); 
          if (history[dateString] !== Math.round(steps)) {
              history[dateString] = Math.round(steps);
              await AsyncStorage.setItem(DAILY_STEPS_HISTORY_KEY, JSON.stringify(history)); 
              setStepsHistory(prev => ({...prev, [dateString]: Math.round(steps)}));
          }
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              await supabase.from('steps').upsert({
                  user_id: user.id,
                  date: dateString,
                  step_count: Math.round(steps)
              }, { onConflict: 'user_id, date' });
          }
      }
      catch (error) { console.error("Failed to save daily steps:", error); }
  }, [getStoredStepsHistory]);

  const updateChallengeStatus = useCallback(async () => { const todayString = getDateString(new Date()); if (!todayString) return; try { const [storedRemainingDaysStr, storedLastParticipationDate, storedChallengeDurationStr] = await Promise.all([AsyncStorage.getItem(REMAINING_CHALLENGE_DAYS_KEY), AsyncStorage.getItem(LAST_PARTICIPATION_DATE_KEY), AsyncStorage.getItem(CURRENT_CHALLENGE_DURATION_KEY)]); let loadedDuration = INITIAL_CHALLENGE_DURATION; if (storedChallengeDurationStr !== null) { const parsedDuration = parseInt(storedChallengeDurationStr, 10); if (!isNaN(parsedDuration) && CHALLENGE_DURATIONS.includes(parsedDuration)) loadedDuration = parsedDuration; } setCurrentChallengeDuration(loadedDuration); let currentRemainingDays = loadedDuration; if (storedRemainingDaysStr !== null) { const parsedDays = parseInt(storedRemainingDaysStr, 10); if (!isNaN(parsedDays) && parsedDays >= 0 && parsedDays <= loadedDuration) currentRemainingDays = parsedDays; } setRemainingDays(currentRemainingDays); if (todayString !== storedLastParticipationDate && currentRemainingDays > 0) { const newRemainingDays = currentRemainingDays - 1; if (newRemainingDays <= 0) { const currentDurationIndex = CHALLENGE_DURATIONS.indexOf(loadedDuration); const nextDurationIndex = currentDurationIndex + 1; if (nextDurationIndex < CHALLENGE_DURATIONS.length) { const nextChallengeDuration = CHALLENGE_DURATIONS[nextDurationIndex]; setRemainingDays(nextChallengeDuration); setCurrentChallengeDuration(nextChallengeDuration); await AsyncStorage.multiSet([[REMAINING_CHALLENGE_DAYS_KEY, String(nextChallengeDuration)], [LAST_PARTICIPATION_DATE_KEY, todayString], [CURRENT_CHALLENGE_DURATION_KEY, String(nextChallengeDuration)]]); } else { setRemainingDays(0); await AsyncStorage.multiSet([[REMAINING_CHALLENGE_DAYS_KEY, '0'], [LAST_PARTICIPATION_DATE_KEY, todayString]]); } } else { setRemainingDays(newRemainingDays); await AsyncStorage.multiSet([[REMAINING_CHALLENGE_DAYS_KEY, String(newRemainingDays)], [LAST_PARTICIPATION_DATE_KEY, todayString]]); } } else if (currentRemainingDays <= 0 && remainingDays !== 0) { setRemainingDays(0); } } catch (error) { console.error("Challenge update fail:", error); } }, []);

  useEffect(() => {
        const loadInitialData = async () => {
            const history = await getStoredStepsHistory();
            setStepsHistory(history);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                let loadedGoal = 3.0; 
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('daily_distance_goal').eq('id', user.id).single();
                    if (profile && profile.daily_distance_goal) loadedGoal = profile.daily_distance_goal;
                } else {
                    const storedGoal = await AsyncStorage.getItem(GOAL_KEY);
                    if (storedGoal) loadedGoal = parseFloat(storedGoal);
                }
                setGoalDistance(loadedGoal);
            } catch (e) {
                console.error("Failed to load goal:", e);
            }
        };
        loadInitialData();
  }, [getStoredStepsHistory]);

  useEffect(() => {
        let isMounted = true;
        const subscribe = async () => {
            const isAvailable = await Pedometer.isAvailableAsync();
            if (!isAvailable || !isMounted) return;
            const { status } = await Pedometer.requestPermissionsAsync();
            if (status === 'granted') {
                const fetchAndUpdateTodaySteps = async () => {
                    if (!isMounted) return;
                    const start = new Date(); start.setHours(0, 0, 0, 0);
                    const end = new Date();
                    try {
                        const result = await Pedometer.getStepCountAsync(start, end);
                        if (isMounted && result) {
                            const newSteps = result.steps || 0;
                            setPedometerSteps(newSteps);
                            saveDailySteps(new Date(), newSteps);
                        }
                    } catch (error) { console.error("Could not fetch step count:", error); }
                };
                await fetchAndUpdateTodaySteps();
                pedometerSubscription.current = Pedometer.watchStepCount(fetchAndUpdateTodaySteps);
            }
        };
        subscribe();
        return () => { isMounted = false; if (pedometerSubscription.current) pedometerSubscription.current.remove(); };
  }, [saveDailySteps]);

  const currentStepsCount = useMemo(() => {
      if (isToday(currentDate)) { return pedometerSteps; }
      const dateStr = getDateString(currentDate);
      return stepsHistory[dateStr] || 0;
  }, [currentDate, pedometerSteps, stepsHistory]);

  const actualDistance = useMemo(() => (currentStepsCount * STEP_LENGTH_METERS) / 1000, [currentStepsCount]);
  const distanceForDisplay = useMemo(() => Math.min(actualDistance, goalDistance), [actualDistance, goalDistance]);
  const { rawSteps, rawCalories, rawMinutes } = useMemo(() => { 
        return { 
            rawSteps: currentStepsCount, 
            rawCalories: currentStepsCount * CALORIES_PER_STEP, 
            rawMinutes: currentStepsCount / STEPS_PER_MINUTE 
        }; 
  }, [currentStepsCount]);
  
  const locale = useMemo(() => language === 'ar' ? 'ar-EG' : 'en-US', [language]);
  
  function formatDisplayDate(date, lang, translation) {
        if (isToday(date)) return translation.today;
        if (isYesterday(date)) return translation.yesterday;
        const localeFormat = lang === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory';
        return new Intl.DateTimeFormat(localeFormat, { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(date);
  }
  
  const handlePreviousDay = () => setCurrentDate(prev => addDays(prev, -1));
  const handleNextDay = () => { if (!isToday(currentDate)) setCurrentDate(prev => addDays(prev, 1)); };
  const handlePreviousWeek = () => setSelectedWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => { if (!isCurrentWeek) setSelectedWeekStart(prev => addDays(prev, 7)); };
  const handlePreviousMonth = () => setSelectedMonthStart(prev => addMonths(prev, -1));
  const handleNextMonth = () => { if (!isCurrentMonth) setSelectedMonthStart(prev => addMonths(prev, 1)); };
  
  const handleTestIncrement = useCallback(() => { if (!isToday(currentDate)) return; const newSteps = pedometerSteps + 656; setPedometerSteps(newSteps); saveDailySteps(new Date(), newSteps); }, [pedometerSteps, currentDate, saveDailySteps]);
  const handleResetData = useCallback(() => { if (!isToday(currentDate)) return; setPedometerSteps(0); saveDailySteps(new Date(), 0); }, [currentDate, saveDailySteps]);
  
  const handleSaveGoal = async (newDistance, newUnit) => { 
      try {
          const distVal = parseFloat(newDistance);
          setGoalDistance(distVal); 
          setGoalUnit(newUnit); 
          setModalVisible(false);
          await AsyncStorage.setItem(GOAL_KEY, String(distVal));
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              await supabase.from('profiles').update({ daily_distance_goal: distVal }).eq('id', user.id);
          }
      } catch (e) {
          Alert.alert(translation.errorTitle, translation.cannotSaveGoalError);
      }
  };

  const handleNavigateToAchievements = () => { if (onNavigateToAchievements) onNavigateToAchievements(Math.round(rawSteps)); };
  const openTitleMenu = useCallback(() => { titleMenuTriggerRef.current.measure((fx, fy, w, h, px, py) => { const top = py + h - 25; const positionStyle = I18nManager.isRTL ? { top, right: width - (px + w) } : { top, left: px }; setTitleMenuPosition(positionStyle); setIsTitleMenuVisible(true); }); }, [width]);
  const closeTitleMenu = useCallback(() => setIsTitleMenuVisible(false), []);
  const navigateTo = (screenName) => { closeTitleMenu(); if (onNavigate) onNavigate(screenName); };

  const progressPercentage = goalDistance > 0 ? (distanceForDisplay / goalDistance) * 100 : 0;
  const clampedProgressPercentage = Math.min(100, progressPercentage);
  
  // --- الأنيميشن (تم تحديثه) ---
  useEffect(() => { 
      const targetAngle = Math.min(359.999, (clampedProgressPercentage || 0) * 3.6); 
      Animated.timing(animatedAngle, { 
          toValue: targetAngle, 
          duration: 800, 
          useNativeDriver: false 
      }).start(); 
  }, [clampedProgressPercentage]);

  // تحديث النقطة والمسار (تم التحديث ليطابق الكود الثاني)
  useEffect(() => { 
      const listenerId = animatedAngle.addListener(({ value }) => { 
          // 1. تحديث موقع النقطة
          setDynamicIconStyle(calculateIconPositionOnPath(value)); 
          // 2. تحديث رسم الخط
          setProgressPathD(value > 0.01 ? describeArc(CENTER_X, CENTER_Y, PATH_RADIUS, 0.01, value) : ''); 
      }); 
      return () => { animatedAngle.removeListener(listenerId); }; 
  }, [animatedAngle]);

  useEffect(() => { Animated.timing(animatedDistance, { toValue: distanceForDisplay, duration: 750, useNativeDriver: false }).start(); }, [distanceForDisplay]);
  useEffect(() => { const listenerId = animatedDistance.addListener((v) => { setDisplayDistanceText(v.value.toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2})); }); return () => { animatedDistance.removeListener(listenerId); }; }, [locale]);
  useEffect(() => { const runInitialChecks = async () => { await updateChallengeStatus(); }; runInitialChecks(); const sub = AppState.addEventListener('change', s => {if (s === 'active') runInitialChecks()}); return () => sub.remove() }, [updateChallengeStatus]);
  
  useEffect(() => { 
      if(selectedPeriod === 'day') { 
          const weekStart = getStartOfWeek(currentDate, startOfWeekDay); 
          const data = Array(7).fill(0); 
          for(let i=0; i<7; i++) { 
              const day = addDays(weekStart, i); 
              const dayStr = getDateString(day);
              let steps = stepsHistory[dayStr] || 0;
              if (isToday(day)) steps = pedometerSteps;
              const dist = (steps * STEP_LENGTH_METERS) / 1000;
              data[i] = Math.min(dist, goalDistance); 
          } 
          setDailyChartData(data); 
      } 
  }, [currentDate, pedometerSteps, stepsHistory, selectedPeriod, goalDistance, startOfWeekDay]);

  useEffect(() => { 
      if (selectedPeriod === 'week') { 
          setIsWeeklyLoading(true); 
          const currentIsSameWeek = isSameWeek(selectedWeekStart, new Date(), startOfWeekDay); 
          setIsCurrentWeek(currentIsSameWeek); 
          const data = Array(7).fill(0); 
          for (let i = 0; i < 7; i++) { 
              const dayDate = addDays(selectedWeekStart, i); 
              let steps = stepsHistory[getDateString(dayDate)] || 0;
              if (currentIsSameWeek && isToday(dayDate)) steps = pedometerSteps;
              data[i] = (steps * STEP_LENGTH_METERS) / 1000;
          } 
          setWeeklyData(data); 
          setIsWeeklyLoading(false); 
      } 
  }, [selectedPeriod, selectedWeekStart, pedometerSteps, stepsHistory, startOfWeekDay]);

  useEffect(() => { 
      if (selectedPeriod === 'month') { 
          setIsMonthlyLoading(true); 
          const currentIsSameMonth = selectedMonthStart.getUTCFullYear() === new Date().getFullYear() && selectedMonthStart.getUTCMonth() === new Date().getMonth(); 
          setIsCurrentMonth(currentIsSameMonth); 
          const daysInMonth = getDaysInMonth(selectedMonthStart); 
          const data = Array(daysInMonth).fill(0); 
          for (let i = 0; i < daysInMonth; i++) { 
              const dayDate = new Date(Date.UTC(selectedMonthStart.getUTCFullYear(), selectedMonthStart.getUTCMonth(), i + 1)); 
              let steps = stepsHistory[getDateString(dayDate)] || 0;
              if (currentIsSameMonth && isToday(dayDate)) steps = pedometerSteps;
              data[i] = (steps * STEP_LENGTH_METERS) / 1000;
          } 
          setMonthlyData(data); 
          setIsMonthlyLoading(false); 
      } 
  }, [selectedPeriod, selectedMonthStart, pedometerSteps, stepsHistory]);

  return ( 
    <SafeAreaView style={currentStyles.safeArea}>
      <View style={currentStyles.topBar}>
          <TouchableOpacity ref={titleMenuTriggerRef} style={currentStyles.titleGroup} onPress={openTitleMenu} activeOpacity={0.7}><Text style={currentStyles.headerTitle}>{translation.headerTitle}</Text><Icon name="chevron-down" size={24} color={currentStyles.headerTitle.color} style={{ [I18nManager.isRTL ? 'marginRight' : 'marginLeft']: 5 }} /></TouchableOpacity>
      </View>
      
      {/* --- محدد الفترة --- */}
      <View style={currentStyles.periodSelectorContainer}>
         {language === 'ar' ? (
             <>
                 <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'month' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('month')}>
                     <Text style={[ currentStyles.periodText, selectedPeriod === 'month' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.month}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'week' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('week')}>
                     <Text style={[ currentStyles.periodText, selectedPeriod === 'week' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.week}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'day' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('day')}>
                     <Text style={[ currentStyles.periodText, selectedPeriod === 'day' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.today}</Text>
                 </TouchableOpacity>
             </>
         ) : (
             <>
                 <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'day' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('day')}>
                     <Text style={[ currentStyles.periodText, selectedPeriod === 'day' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.today}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'week' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('week')}>
                     <Text style={[ currentStyles.periodText, selectedPeriod === 'week' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.week}</Text>
                 </TouchableOpacity>
                 <TouchableOpacity style={[ currentStyles.periodButton, selectedPeriod === 'month' ? currentStyles.periodButtonSelected : currentStyles.periodButtonInactive ]} onPress={() => setSelectedPeriod('month')}>
                     <Text style={[ currentStyles.periodText, selectedPeriod === 'month' ? currentStyles.periodTextSelected : currentStyles.periodTextInactive ]}>{translation.month}</Text>
                 </TouchableOpacity>
             </>
         )}
      </View>

      <ScrollView contentContainerStyle={currentStyles.scrollContainer} key={`${selectedPeriod}-${language}-${isDarkMode}`}>
        
        {selectedPeriod === 'day' && (
          <View style={currentStyles.dayViewContainer}>
            {/* --- متصفح الأيام --- */}
            <View style={currentStyles.dayHeader}>
                <TouchableOpacity onPress={handleNextDay} disabled={isViewingToday}>
                    <Ionicons name={I18nManager.isRTL ? "chevron-forward-outline" : "chevron-back-outline"} size={28} color={isViewingToday ? currentStyles.dayHeaderArrowDisabled.color : currentStyles.dayHeaderArrow.color} />
                </TouchableOpacity>
                <Text style={currentStyles.dayHeaderText}>{dayLabel}</Text>
                <TouchableOpacity onPress={handlePreviousDay}>
                    <Ionicons name={I18nManager.isRTL ? "chevron-back-outline" : "chevron-forward-outline"} size={28} color={currentStyles.dayHeaderArrow.color} />
                </TouchableOpacity>
            </View>

            {/* --- دائرة التقدم (تم تحديثها لتطابق صفحة الخطوات) --- */}
            <View style={currentStyles.progressCircleContainer}> 
                <View style={currentStyles.circle}>
                    <Svg width={SVG_VIEWBOX_SIZE} height={SVG_VIEWBOX_SIZE} viewBox={`0 0 ${SVG_VIEWBOX_SIZE} ${SVG_VIEWBOX_SIZE}`}>
                        <Circle stroke={currentStyles.progressCircleBackground.stroke} fill="none" cx={CENTER_X} cy={CENTER_Y} r={PATH_RADIUS} strokeWidth={CIRCLE_BORDER_WIDTH}/> 
                        <Path d={progressPathD} stroke={currentStyles.progressCircleForeground.stroke} fill="none" strokeWidth={CIRCLE_BORDER_WIDTH} strokeLinecap="round" />
                    </Svg> 
                    
                    {/* محتوى الدائرة */}
                    <View style={currentStyles.circleContentOverlay}> 
                        <Icon name="map-marker" size={30} color={currentStyles.progressText.color} /> 
                        <Text style={currentStyles.progressText}>{displayDistanceText}</Text> 
                        <TouchableOpacity style={currentStyles.goalContainer} onPress={() => setModalVisible(true)}> 
                        <Text style={currentStyles.goalText}>{translation.goalPrefix}: {goalDistance.toLocaleString(locale, {minimumFractionDigits: 1, maximumFractionDigits: 1})} {goalUnit}</Text> 
                        <Icon name="pencil" size={16} color={currentStyles.goalText.color} style={{ marginHorizontal: 5 }}/> 
                        </TouchableOpacity> 
                    </View> 

                    {/* تم إزالة الشرط هنا لتظهر النقطة دائماً */}
                    <Animated.View style={dynamicIconStyle}>
                        <View style={[currentStyles.movingDot, { borderColor: currentStyles.safeArea.backgroundColor }]} />
                    </Animated.View>
                </View>
            </View> 

            <View style={currentStyles.statsContainer}>
              <AnimatedStatCard iconName="fire" value={rawCalories} label={translation.caloriesLabel} formatter={v => v.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} styles={currentStyles}/>
              <AnimatedStatCard iconName="clock-outline" value={rawMinutes} label={translation.timeLabel} formatter={v => { const h = Math.floor(v / 60); const m = Math.floor(v % 60); return `${h.toLocaleString(locale, {minimumIntegerDigits: 2})}:${m.toLocaleString(locale, {minimumIntegerDigits: 2})}`}} styles={currentStyles}/> 
              <AnimatedStatCard iconName="walk" value={rawSteps} label={translation.stepsLabel} formatter={v => Math.round(v).toLocaleString(locale)} styles={currentStyles}/> 
            </View> 
            <ChallengeCard onPress={handleNavigateToAchievements} currentChallengeDuration={currentChallengeDuration} remainingDays={remainingDays} translation={translation} styles={currentStyles}/> 
            <DistanceWeeklyChart weeklyDistanceData={dailyChartData} goalDistance={goalDistance} onTestIncrement={handleTestIncrement} onResetData={handleResetData} translation={translation} styles={currentStyles} language={language}/>
          </View>
        )}
        
        {selectedPeriod === 'week' && (isWeeklyLoading ? <ActivityIndicator size="large" color={currentStyles.activityIndicator.color} style={{marginTop: 50}} /> : <WeeklyDistance weeklyData={weeklyData} goalDistance={goalDistance} isCurrentWeek={isCurrentWeek} formattedDateRange={formatDateRange(selectedWeekStart, getEndOfWeek(selectedWeekStart, startOfWeekDay), language)} onPreviousWeek={handlePreviousWeek} onNextWeek={handleNextWeek} language={language} isDarkMode={isDarkMode} translation={translation} />)}
        {selectedPeriod === 'month' && (isMonthlyLoading ? <ActivityIndicator size="large" color={currentStyles.activityIndicator.color} style={{marginTop: 50}} /> : <MonthlyDistance monthlyData={monthlyData} goalDistance={goalDistance} isCurrentMonth={isCurrentMonth} formattedMonthRange={new Date(selectedMonthStart).toLocaleDateString(language === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory', { month: 'long', year: 'numeric', timeZone: 'UTC' })} onPreviousMonth={handlePreviousMonth} onNextMonth={handleNextMonth} language={language} isDarkMode={isDarkMode} translation={translation} />)}

      </ScrollView> 
      <GoalModal visible={isModalVisible} onClose={() => setModalVisible(false)} onSave={handleSaveGoal} currentValue={goalDistance} currentUnit={goalUnit} translation={translation} styles={currentStyles}/>
      
      {/* --- القائمة العلوية --- */}
      <Modal visible={isTitleMenuVisible} transparent={true} animationType="fade" onRequestClose={closeTitleMenu}>
          <Pressable style={currentStyles.menuModalOverlay} onPress={closeTitleMenu}>
              <View style={[ currentStyles.titleMenuModalContent, { top: titleMenuPosition.top, right: I18nManager.isRTL ? 20 : undefined, left: I18nManager.isRTL ? undefined : 20, } ]}>
                  <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('steps')}>
                      <Text style={currentStyles.titleMenuItemText}>{translation.menuSteps}</Text>
                      {currentScreenName === 'steps' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}
                  </TouchableOpacity>
                  <View style={currentStyles.titleMenuSeparator} />
                  <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('distance')}>
                      <Text style={currentStyles.titleMenuItemText}>{translation.menuDistance}</Text>
                      {(currentScreenName === 'distance' || language === 'ar') && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}
                  </TouchableOpacity>
                  <View style={currentStyles.titleMenuSeparator} />
                  <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('calories')}>
                      <Text style={currentStyles.titleMenuItemText}>{translation.menuCalories}</Text>
                      {currentScreenName === 'calories' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}
                  </TouchableOpacity>
                  <View style={currentStyles.titleMenuSeparator} />
                  <TouchableOpacity style={currentStyles.menuItemButton} onPress={() => navigateTo('activeTime')}>
                      <Text style={currentStyles.titleMenuItemText}>{translation.menuActiveTime}</Text>
                      {currentScreenName === 'activeTime' && <Icon name="check" size={22} color={currentStyles.titleMenuItemText.color} />}
                  </TouchableOpacity>
              </View>
          </Pressable>
      </Modal>
    </SafeAreaView> 
  );
};

// --- الأنماط ---
const lightStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FDF9' },
  scrollContainer: { paddingTop: 10, paddingBottom: 50, flexGrow: 1 },
  dayViewContainer: { alignItems: 'center', width: '100%' },
  topBar: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'flex-start', alignItems: 'center', width: '100%', paddingVertical: 15, paddingHorizontal: 20 },
  titleGroup: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
  periodSelectorContainer: { flexDirection: 'row-reverse', marginVertical: 10, backgroundColor: '#E8F5E9', borderRadius: 20, overflow: 'hidden', width: '85%', height: 40, alignSelf: 'center' },
  periodButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 8 },
  periodButtonInactive: { backgroundColor: 'transparent' },
  periodButtonSelected: { backgroundColor: '#388e3c', borderRadius: 20 },
  periodText: { fontSize: 16, fontWeight: 'bold' },
  periodTextInactive: { color: '#388e3c' },
  periodTextSelected: { color: '#ffffff' },
  
  dayHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', width: '65%', marginVertical: 15, alignSelf: 'center' },
  dayHeaderText: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32' },
  dayHeaderArrow: { color: '#2e7d32' },
  dayHeaderArrowDisabled: { color: '#a5d6a7' },

  // --- أنماط الدائرة الجديدة ---
  progressCircleContainer: { width: '100%', alignItems: 'center', marginVertical: 5, paddingBottom: 10, paddingHorizontal: 15 },
  circle: { width: CIRCLE_SIZE, height: CIRCLE_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  progressCircleBackground: { stroke: '#e0f2f1' },
  progressCircleForeground: { stroke: '#4caf50' },
  circleContentOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 1, padding: CIRCLE_BORDER_WIDTH + 5 },
  
  progressText: { fontSize: 56, fontWeight: 'bold', color: '#388e3c', lineHeight: 64, marginVertical: 5, fontVariant: ['tabular-nums'] },
  goalContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', padding: 5 },
  goalText: { fontSize: 14, color: '#757575' },
  movingDot: { width: ICON_SIZE, height: ICON_SIZE, borderRadius: ICON_SIZE / 2, backgroundColor: '#4caf50', borderWidth: 2 },
  
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '90%', marginTop: 25 },
  statCard: { alignItems: 'center', flex: 1 },
  iconContainer: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: '#e0f2f1' },
  animatedStatIcon: { color: '#4caf50'},
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#388e3c', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 14, color: '#757575', marginTop: 4 },
  
  challengeCardWrapper: { width: '100%', paddingVertical: 15, marginTop: 15 },
  summaryCard: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 15, paddingHorizontal: 15, paddingVertical: 15, width: '90%', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, alignSelf: 'center' },
  summaryTextContainer: { alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start', flex: 1, marginHorizontal: 12 },
  summaryMainText: { fontSize: 18, fontWeight: 'bold', color: '#424242', textAlign: I18nManager.isRTL ? 'right' : 'left' },
  summarySubText: { fontSize: 14, color: '#757575', textAlign: I18nManager.isRTL ? 'right' : 'left', marginTop: 2 },
  summaryChevron: { color: "#bdbdbd" },
  badgeContainer: { width: BADGE_CONTAINER_SIZE, height: BADGE_CONTAINER_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  badgeBackgroundCircle: { stroke: "#e0f2f1" },
  badgeProgressCircle: { stroke: "#4caf50" },
  badgeTextContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  badgeText: { fontSize: 16, fontWeight: 'bold', color: '#4caf50', fontVariant: ['tabular-nums'] },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: 'white', borderRadius: 24, padding: 24, width: width * 0.9, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 25 },
  pickersContainer: { flexDirection: 'row', width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 20, backgroundColor: '#F7FDF9', borderRadius: 20 },
  pickerItemText: { fontSize: 24, color: '#4caf50' },
  selectedPickerItemText: { fontSize: 32, fontWeight: 'bold', color: '#2e7d32' },
  buttonRow: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', width: '100%', marginTop: 20 },
  modalButton: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  saveButton: { backgroundColor: '#4caf50', marginLeft: 10 },
  saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#e8f5e9' },
  cancelButtonText: { color: '#388e3c', fontSize: 18, fontWeight: 'bold' },
  
  activityIndicator: { color: '#388e3c' },
  menuModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  titleMenuModalContent: { position: 'absolute', backgroundColor: '#FFFFFF', borderRadius: 8, paddingVertical: 5, width: 155, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
  menuItemButton: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 12, width: '100%' },
  titleMenuItemText: { fontSize: 16, color: '#2e7d32', fontWeight: 'bold' },
  titleMenuSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: '#e0e0e0', marginVertical: 2 },
  card: { backgroundColor: '#FFF', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 10, width: '90%', shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  chartHeader: { width: '100%', alignItems: 'flex-end', marginBottom: 10, paddingRight: 10 },
  chartTitle: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32' },
  testButtonsContainer: { flexDirection: 'row-reverse', justifyContent: 'center', marginBottom: 20, width: '100%', flexWrap: 'wrap' },
  testButton: { backgroundColor: '#E8F5E9', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginHorizontal: 5, marginVertical: 5, elevation: 1 },
  testButtonText: { color: '#2e7d32', fontWeight: 'bold', fontSize: 13 },
  chartAreaContainer: { flexDirection: 'row-reverse', width: '100%', paddingRight: 5 },
  yAxisLabels: { height: CHART_HEIGHT, justifyContent: 'space-between', alignItems: 'flex-start', paddingRight: 5 },
  axisLabelY: { color: '#757575', fontSize: 12 },
  chartContent: { flex: 1, height: CHART_HEIGHT, position: 'relative', marginLeft: 10, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  barsAndLabelsContainer: { flexDirection: 'row-reverse', justifyContent: 'space-around', alignItems: 'flex-end', height: '100%' },
  barColumn: { alignItems: 'center', justifyContent: 'flex-end', flex: 1, position: 'relative' },
  bar: { width: 12, backgroundColor: '#c8e6c9', borderRadius: 6 },
  barToday: { backgroundColor: '#66bb6a' },
  selectedBar: { backgroundColor: '#2E7D32' },
  barGoalAchieved: { backgroundColor: '#4caf50' },
  axisLabelX: { color: '#757575', marginTop: 8, fontSize: 12 },
  activeDayLabel: { color: '#000000', fontWeight: 'bold' },
  tooltipPositioner: { position: 'absolute', alignSelf: 'center', alignItems: 'center', zIndex: 10, minWidth: 40 },
  tooltipBox: { backgroundColor: '#333333', borderRadius: 5, paddingVertical: 4, paddingHorizontal: 8, elevation: 3 },
  tooltipText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  tooltipArrow: { position: 'absolute', bottom: -6, width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#333333', alignSelf: 'center' },
});

const darkStyles = StyleSheet.create({
  ...lightStyles,
  safeArea: { ...lightStyles.safeArea, backgroundColor: '#121212' },
  headerTitle: { ...lightStyles.headerTitle, color: '#E0E0E0' },
  periodSelectorContainer: { ...lightStyles.periodSelectorContainer, backgroundColor: '#2C2C2C' },
  periodTextInactive: { ...lightStyles.periodTextInactive, color: '#80CBC4' },
  periodButtonSelected: { ...lightStyles.periodButtonSelected, backgroundColor: '#00796B' },
  periodTextSelected: { ...lightStyles.periodTextSelected, color: '#FFFFFF' },
  dayHeaderText: { ...lightStyles.dayHeaderText, color: '#80CBC4' },
  dayHeaderArrow: { color: '#80CBC4' },
  dayHeaderArrowDisabled: { color: '#004D40' },
  progressCircleBackground: { stroke: "#333333" },
  progressCircleForeground: { stroke: "#80CBC4" },
  progressText: { ...lightStyles.progressText, color: '#80CBC4' },
  goalText: { ...lightStyles.goalText, color: '#B0B0B0' },
  iconContainer: { ...lightStyles.iconContainer, backgroundColor: '#2C2C2C' },
  animatedStatIcon: { color: '#80CBC4'},
  statValue: { ...lightStyles.statValue, color: '#E0E0E0' },
  statLabel: { ...lightStyles.statLabel, color: '#B0B0B0' },
  summaryCard: { ...lightStyles.summaryCard, backgroundColor: '#1E1E1E' },
  summaryMainText: { ...lightStyles.summaryMainText, color: '#E0E0E0' },
  summarySubText: { ...lightStyles.summarySubText, color: '#B0B0B0' },
  summaryChevron: { color: "#A0A0A0" },
  badgeBackgroundCircle: { stroke: "#333333" },
  badgeProgressCircle: { stroke: "#80CBC4" },
  badgeText: { ...lightStyles.badgeText, color: '#80CBC4' },
  movingDot: { ...lightStyles.movingDot, backgroundColor: '#80CBC4'},
  activityIndicator: { color: '#80CBC4' },
  modalOverlay: { ...lightStyles.modalOverlay, backgroundColor: 'rgba(0, 0, 0, 0.7)'},
  modalCard: { ...lightStyles.modalCard, backgroundColor: '#2C2C2C' },
  modalTitle: { ...lightStyles.modalTitle, color: '#E0E0E0' },
  pickersContainer: { ...lightStyles.pickersContainer, backgroundColor: '#1E1E1E' },
  pickerItemText: { ...lightStyles.pickerItemText, color: '#80CBC4' },
  selectedPickerItemText: { ...lightStyles.selectedPickerItemText, color: '#A7FFEB' },
  saveButton: { ...lightStyles.saveButton, backgroundColor: '#00796B' },
  saveButtonText: { ...lightStyles.saveButtonText, color: '#E0E0E0' },
  cancelButton: { ...lightStyles.cancelButton, backgroundColor: '#424242' },
  cancelButtonText: { ...lightStyles.cancelButtonText, color: '#B0B0B0' },
  titleMenuModalContent: { ...lightStyles.titleMenuModalContent, backgroundColor: '#2C2C2C' },
  titleMenuItemText: { ...lightStyles.titleMenuItemText, color: '#A7FFEB' },
  titleMenuSeparator: { ...lightStyles.titleMenuSeparator, backgroundColor: '#424242' },
  card: { ...lightStyles.card, backgroundColor: '#1E1E1E' },
  chartHeader: { ...lightStyles.chartHeader },
  chartTitle: { ...lightStyles.chartTitle, color: '#80CBC4' },
  testButton: { ...lightStyles.testButton, backgroundColor: '#2C2C2C'},
  testButtonText: { ...lightStyles.testButtonText, color: '#80CBC4'},
  axisLabelY: { ...lightStyles.axisLabelY, color: '#B0B0B0'},
  chartContent: { ...lightStyles.chartContent, borderBottomColor: '#333333'},
  bar: { ...lightStyles.bar, backgroundColor: '#004D40'},
  barToday: { ...lightStyles.barToday, backgroundColor: '#00796B'},
  selectedBar: { ...lightStyles.selectedBar, backgroundColor: '#A7FFEB'},
  barGoalAchieved: { ...lightStyles.barGoalAchieved, backgroundColor: '#80CBC4'},
  axisLabelX: { ...lightStyles.axisLabelX, color: '#B0B0B0'},
  activeDayLabel: { ...lightStyles.activeDayLabel, color: '#FFFFFF'},
  tooltipBox: { ...lightStyles.tooltipBox, backgroundColor: '#E0E0E0'},
  tooltipText: { ...lightStyles.tooltipText, color: '#121212'},
  tooltipArrow: { ...lightStyles.tooltipArrow, borderTopColor: '#E0E0E0'},
});

export default DistanceScreen;