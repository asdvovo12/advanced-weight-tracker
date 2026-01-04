import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    StyleSheet, View, Text, TextInput, ScrollView, TouchableOpacity, Modal,
    I18nManager, Alert, Platform, Image, FlatList, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path, Circle } from 'react-native-svg';
import { Picker } from '@react-native-picker/picker';
import { supabase } from './supabaseClient'; // 1. استيراد Supabase

import {
    MEAL_CATEGORIES, MEAL_CATEGORIES_ORDER, DEFAULT_MEAL_TARGETS, MEAL_IMAGES, PREDEFINED_FOODS
} from './FoodData';

const MEALS_DATA_KEY_PREFIX = 'mealsData_';
const MAX_DAILY_TARGET_CALORIES = 10000;
const SPOONACULAR_API_KEY = '8752a2c73388456888fef7aac64bcba6';
const SPOONACULAR_IMAGE_BASE_URL = 'https://spoonacular.com/cdn/ingredients_250x250/';
const SUGGESTION_ARROW_WIDTH = 30;
const MAX_SUGGESTIONS_BEFORE_ARROW_LOGIC = 3;
const SUGGESTION_CHIP_ITEM_WIDTH = 100;
const SUGGESTION_CHIP_MARGIN_RIGHT = 10;
const SUGGESTION_CHIP_EFFECTIVE_WIDTH = SUGGESTION_CHIP_ITEM_WIDTH + SUGGESTION_CHIP_MARGIN_RIGHT;
const DEFAULT_MACRO_PERCENTAGES = { protein: 0.20, fat: 0.30, carbs: 0.50 };

const calculateMacroTargetsFromCalories = (calories, percentages) => {
    if (typeof calories !== 'number' || calories <= 0) { return { proteinG: 0, fatG: 0, carbsG: 0 }; }
    const proteinG = Math.round((calories * percentages.protein) / 4);
    const fatG = Math.round((calories * percentages.fat) / 9);      
    const carbsG = Math.round((calories * percentages.carbs) / 4);    
    return { proteinG, fatG, carbsG };
};

const formatDatePartsForNavigator = (date, lang) => {
    const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const arMonths = ["ينا", "فبر", "مار", "أبر", "ماي", "يون", "يول", "أغس", "سبت", "أكت", "نوف", "ديس"];
    const enDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const arDaysShort = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];
    let month, dayName;
    if (lang === 'en') { month = enMonths[date.getMonth()]; dayName = enDays[date.getDay()]; }
    else { month = arMonths[date.getMonth()]; dayName = arDaysShort[date.getDay()]; }
    const dayNum = date.getDate().toString().padStart(2, '0');
    return { month, dayNum, dayName };
};

const DateNavigator = ({ currentDate, onDateSelect, language, darkMode, realToday }) => {
    const [centerDate, setCenterDate] = useState(new Date(currentDate));
    useEffect(() => { setCenterDate(new Date(currentDate)); }, [currentDate]);
    const datesToDisplay = useMemo(() => { const dates = []; for (let i = -2; i <= 2; i++) { const d = new Date(centerDate); d.setDate(centerDate.getDate() + i); dates.push(d); } return dates; }, [centerDate]);
    const handleDateItemPress = (date) => { if (date <= realToday) { onDateSelect(new Date(date)); } };
    const shiftWindow = (days) => { setCenterDate(prev => { const newProposedCenter = new Date(prev); newProposedCenter.setDate(prev.getDate() + days); if (days > 0 && newProposedCenter > realToday) { if (prev <= realToday) { return new Date(realToday); } return prev; } return newProposedCenter; }); };
    const navStyles = darkMode ? dateNavigatorDarkStyles : dateNavigatorLightStyles;
    const disableRightArrow = centerDate >= realToday && datesToDisplay.every(d => d >= realToday || (d.toDateString() === realToday.toDateString() && datesToDisplay[datesToDisplay.length -1].toDateString() === realToday.toDateString()));
    return ( <View style={navStyles.container}><TouchableOpacity onPress={() => shiftWindow(-1)} style={navStyles.arrow}><Text style={navStyles.arrowText}>{"<"}</Text></TouchableOpacity><View style={navStyles.datesRow}>{datesToDisplay.map((date) => { const { month, dayNum, dayName } = formatDatePartsForNavigator(date, language); const isStrictlyFuture = date > realToday; const isSelected = !isStrictlyFuture && date.toDateString() === currentDate.toDateString(); const monthDayNameStyle = [navStyles.dateText, navStyles.dateMonthDayNameBase, isSelected ? navStyles.selectedMonthDayNameText : isStrictlyFuture ? navStyles.disabledDateText : navStyles.normalMonthDayNameText]; const dayNumStyle = [navStyles.dateText, navStyles.dateDayNumBase, isSelected ? navStyles.selectedDayNumText : isStrictlyFuture ? navStyles.disabledDateText : navStyles.normalDayNumText]; return (<TouchableOpacity key={date.toISOString()} style={[navStyles.dateItem, isSelected && navStyles.selectedDateItem, isStrictlyFuture && navStyles.disabledDateItem]} onPress={() => handleDateItemPress(date)} disabled={isStrictlyFuture}><Text style={monthDayNameStyle}>{month}</Text><Text style={dayNumStyle}>{dayNum}</Text><Text style={monthDayNameStyle}>{dayName}</Text>{isSelected && <View style={navStyles.selectedDot} />}</TouchableOpacity>); })}</View><TouchableOpacity onPress={() => shiftWindow(1)} style={navStyles.arrow} disabled={disableRightArrow}><Text style={[navStyles.arrowText, disableRightArrow && navStyles.disabledArrowText]}>{">"}</Text></TouchableOpacity></View> );
};
const dateNavigatorBaseStyles = { container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 5, marginBottom: 10, borderBottomWidth: 1, }, datesRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', flex: 1, marginHorizontal: 5, }, dateItem: { alignItems: 'center', paddingHorizontal: Platform.OS === 'ios' ? 6 : 4, paddingVertical: 5, minWidth: Platform.OS === 'ios' ? 50 : 48, borderRadius: 6, marginHorizontal: 2, }, dateText: { fontSize: 12, textAlign: 'center' }, dateMonthDayNameBase: { fontSize: 11, textTransform: 'capitalize', marginBottom: 2, }, dateDayNumBase: { fontSize: 16, marginBottom: 2, }, selectedDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 3, }, arrow: { paddingHorizontal: 12, paddingVertical: 10, }, arrowText: { fontSize: 18, fontWeight: 'bold' } };
const dateNavigatorLightStyles = StyleSheet.create({ ...dateNavigatorBaseStyles, container: { ...dateNavigatorBaseStyles.container, backgroundColor: '#FFFFFF', borderBottomColor: '#e0e0e0' }, normalMonthDayNameText: { color: '#888888', fontWeight: 'normal' }, normalDayNumText: { color: '#555555', fontWeight: '500' }, selectedMonthDayNameText: { color: '#388e3c', fontWeight: '500' }, selectedDayNumText: { color: '#388e3c', fontWeight: 'bold' }, selectedDateItem: { backgroundColor: '#e8f5e9' }, selectedDot: { ...dateNavigatorBaseStyles.selectedDot, backgroundColor: '#388e3c' }, disabledDateText: { color: '#cccccc', fontWeight: 'normal' }, disabledDateItem: { opacity: 0.6 }, arrowText: { ...dateNavigatorBaseStyles.arrowText, color: '#333333' }, disabledArrowText: { color: '#cccccc' } });
const dateNavigatorDarkStyles = StyleSheet.create({ ...dateNavigatorBaseStyles, container: { ...dateNavigatorBaseStyles.container, backgroundColor: '#1e1e1e', borderBottomColor: '#303030' }, normalMonthDayNameText: { color: '#9e9e9e', fontWeight: 'normal' }, normalDayNumText: { color: '#d0d0d0', fontWeight: '500' }, selectedMonthDayNameText: { color: '#81C784', fontWeight: '500' }, selectedDayNumText: { color: '#81C784', fontWeight: 'bold' }, selectedDateItem: { backgroundColor: '#2a3a2a' }, selectedDot: { ...dateNavigatorBaseStyles.selectedDot, backgroundColor: '#81C784' }, disabledDateText: { color: '#555555', fontWeight: 'normal' }, disabledDateItem: { opacity: 0.6 }, arrowText: { ...dateNavigatorBaseStyles.arrowText, color: '#e0e0e0' }, disabledArrowText: { color: '#555555' } });

const MacroBar = ({ label, currentValue, targetValue, barColor, style, textStyle, barBackgroundStyle }) => { const percentage = targetValue > 0 ? (currentValue / targetValue) * 100 : 0; const displayPercentage = Math.min(100, Math.max(0, percentage)); return (<View style={[calorieProgressStyles.macroBarContainer, style]}><View style={calorieProgressStyles.macroTextContainer}><Text style={[calorieProgressStyles.macroLabel, textStyle]}>{label}</Text><Text style={[calorieProgressStyles.macroValue, textStyle]}>{`${Math.round(currentValue)}/${Math.round(targetValue)}g`}</Text></View><View style={[calorieProgressStyles.macroBarBackgroundBase, barBackgroundStyle]}><View style={[calorieProgressStyles.macroBarFill, { width: `${displayPercentage}%`, backgroundColor: barColor }]} /></View></View>); }; const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => { const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0; return { x: centerX + (radius * Math.cos(angleInRadians)), y: centerY + (radius * Math.sin(angleInRadians)) }; }; const describeArc = (x, y, radius, startAngle, endAngle) => { const start = polarToCartesian(x, y, radius, startAngle); const end = polarToCartesian(x, y, radius, endAngle); const largeArcFlag = (endAngle - startAngle) <= 180 ? "0" : "1"; if (Math.abs(startAngle - endAngle) < 0.01 && startAngle !== endAngle) { } if (startAngle === endAngle) return ""; const d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(" "); return d; };
const CalorieProgressDisplay = ({ currentCalories, targetCalories, proteinCurrent, proteinTarget, proteinLabel, fatCurrent, fatTarget, fatLabel, carbsCurrent, carbsTarget, carbohydratesLabel, darkMode }) => { const themeStyles = darkMode ? calorieProgressDarkStyles : calorieProgressLightStyles; const percentage = targetCalories > 0 ? (currentCalories / targetCalories) : 0; const cappedPercentage = Math.min(1, Math.max(0, percentage)); const arcRadius = 80; const strokeWidth = 18; const svgSize = (arcRadius + strokeWidth) * 2; const center = svgSize / 2; const startAngleDeg = -135; const endAngleDeg = 135; const totalAngleSpan = endAngleDeg - startAngleDeg; const currentAngleDeg = startAngleDeg + (cappedPercentage * totalAngleSpan); const backgroundArcPath = describeArc(center, center, arcRadius, startAngleDeg, endAngleDeg); let foregroundArcPath = ""; if (currentCalories > 0 && currentAngleDeg > startAngleDeg) { foregroundArcPath = describeArc(center, center, arcRadius, startAngleDeg, currentAngleDeg); } const dotPosition = polarToCartesian(center, center, arcRadius, currentAngleDeg); return (<View style={themeStyles.container}><View style={calorieProgressStyles.arcContainer}><Svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}><Path d={backgroundArcPath} stroke={themeStyles.arcBackground.color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />{foregroundArcPath !== "" && (<Path d={foregroundArcPath} stroke={themeStyles.arcForeground.color} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />)}{currentCalories > 0 && cappedPercentage > 0 && cappedPercentage <= 1 && (<Circle cx={dotPosition.x} cy={dotPosition.y} r={strokeWidth / 2.2} fill={themeStyles.arcDot.color} stroke={themeStyles.arcDotBorder.color} strokeWidth="1.5" />)}</Svg><View style={calorieProgressStyles.centralContent}><Image source={require('./assets/Flame.png')} style={{ width: 60, height: 60, resizeMode: 'contain' }} /><Text style={themeStyles.currentCaloriesText}>{Math.round(currentCalories)} kcal</Text><Text style={themeStyles.targetCaloriesText}>of {Math.round(targetCalories)} kcal</Text></View></View><View style={calorieProgressStyles.macrosContainer}><MacroBar label={proteinLabel} currentValue={proteinCurrent} targetValue={proteinTarget} barColor={themeStyles.proteinBar.color} textStyle={themeStyles.macroText} barBackgroundStyle={themeStyles.macroBarBackground} /><MacroBar label={fatLabel} currentValue={fatCurrent} targetValue={fatTarget} barColor={themeStyles.fatBar.color} textStyle={themeStyles.macroText} barBackgroundStyle={themeStyles.macroBarBackground} /><MacroBar label={carbohydratesLabel} currentValue={carbsCurrent} targetValue={carbsTarget} barColor={themeStyles.carbsBar.color} textStyle={themeStyles.macroText} barBackgroundStyle={themeStyles.macroBarBackground} /></View></View>); };
const calorieProgressStyles = StyleSheet.create({ arcContainer: { alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 25, }, centralContent: { position: 'absolute', alignItems: 'center', justifyContent: 'center', top: 0, left: 0, right: 0, bottom: 0, }, macrosContainer: { width: '100%', paddingHorizontal: 5, }, macroBarContainer: { marginBottom: 12, }, macroTextContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 4, paddingHorizontal: 5, }, macroLabel: { fontSize: 13, fontWeight: '500', }, macroValue: { fontSize: 13, fontWeight: '500', }, macroBarBackgroundBase: { height: 10, borderRadius: 5, overflow: 'hidden', }, macroBarFill: { height: '100%', borderRadius: 5, }, }); const calorieProgressLightStyles = StyleSheet.create({ container: { alignItems: 'center', paddingVertical: 15, }, arcBackground: { color: '#F0F0F0' }, arcForeground: { color: '#4CAF50' }, arcDot: { color: '#FFFFFF' }, arcDotBorder: { color: '#4CAF50' }, currentCaloriesText: { fontSize: 30, fontWeight: 'bold', color: '#000000', marginTop: 5, }, targetCaloriesText: { fontSize: 13, color: '#606060', }, proteinBar: { color: '#5DADE2' }, fatBar: { color: '#F5B041' }, carbsBar: { color: '#EC7063' }, macroBarBackground: { ...calorieProgressStyles.macroBarBackgroundBase, backgroundColor: '#EAEAEA', }, macroText: { color: '#333333' } }); const calorieProgressDarkStyles = StyleSheet.create({ ...calorieProgressLightStyles, container: { ...calorieProgressLightStyles.container, }, arcBackground: { color: '#3a3a3a' }, arcForeground: { color: '#81C784' }, arcDot: { color: '#2c2c2c' }, arcDotBorder: { color: '#81C784' }, currentCaloriesText: { ...calorieProgressLightStyles.currentCaloriesText, color: '#FFFFFF', }, targetCaloriesText: { ...calorieProgressLightStyles.targetCaloriesText, color: '#B0B0B0', }, proteinBar: { color: '#64B5F6' }, fatBar: { color: '#FFD54F' }, carbsBar: { color: '#F06292' }, macroBarBackground: { ...calorieProgressStyles.macroBarBackgroundBase, backgroundColor: '#282828', }, macroText: { color: '#E0E0E0' } });

const initializeEmptyMealsData = () => { return MEAL_CATEGORIES_ORDER.reduce((acc, categoryKey) => { acc[categoryKey] = { items: [], targetCalories: DEFAULT_MEAL_TARGETS[categoryKey] || 0, image: MEAL_IMAGES[categoryKey] }; return acc; }, {}); };
const calculateTotalsFromMealsData = (currentMealsData) => { let totals = { currentTotalCals: 0, currentP: 0, currentF: 0, currentC: 0, itemCount: 0 }; if (currentMealsData && typeof currentMealsData === 'object') { MEAL_CATEGORIES_ORDER.forEach(categoryKey => { const category = currentMealsData[categoryKey]; if (category && Array.isArray(category.items)) { category.items.forEach(item => { totals.currentTotalCals += (item.calories || 0); totals.currentP += (item.protein || 0); totals.currentF += (item.fat || 0); totals.currentC += (item.carbs || 0); totals.itemCount++; }); } }); } return totals; };

const FoodLogScreen = ({ language, darkMode }) => {
    const styles = darkMode ? darkStyles : lightStyles;

    const translations = useMemo(() => ({
        ar: {
            foodLogTitle: 'سجل الطعام', remainingCaloriesLabel: 'السعرات المتبقية', mealCountLabel: 'عدد الوجبات', totalCaloriesLabel: 'السعرات الكلية', addMealTitle: 'أضف وجبة جديدة', addMealButton: 'إضافة', addMealBtn: '+ أضف وجبة', resetBtn: 'إعادة تعيين', errorMessage: 'يرجى إدخال اسم الوجبة وسعرات حرارية صحيحة. الماكروز اختيارية.', mealNamePlaceholder: 'اسم الوجبة', caloriesPlaceholder: 'السعرات الحرارية', closeModal: 'إغلاق', dailyMealsTitle: 'وجبات اليوم', noItemsInCategory: 'لا يوجد عناصر', addMealPromptInCategory: 'أضف إلى هذه الوجبة', languageChangeAlertTitle: "تغيير اللغة", languageChangeAlertMessage: "يرجى إعادة تشغيل التطبيق لتطبيق تغييرات اللغة بشكل كامل.", targetCaloriesLabel: "الهدف اليومي:", editTargetButton: "تعديل الهدف", saveTargetButton: "حفظ الهدف", cancelButton: "إلغاء", proteinLabel: "بروتين", fatLabel: "دهون", carbohydratesLabel: "كربوهيدرات", breakfast: 'فطور', lunch: 'غداء', dinner: 'عشاء', snacks: 'وجبات خفيفة', selectCategory: "اختر الفئة:", editTargetModalTitle: "تعديل الهدف اليومي", enterNewTarget: "أدخل الهدف الجديد للسعرات:", invalidTargetError: "الرجاء إدخال رقم صحيح أكبر من صفر.", calorieLimitTitle: "تم الوصول للحد الأقصى", calorieLimitReached: "لقد استهلكت جميع السعرات الحرارية المسموح بها لهذا اليوم.", targetUpdated: "تم تحديث الهدف اليومي بنجاح!", invalidTargetErrorMaxPrefix: "الرجاء إدخال رقم صحيح أكبر من صفر.", invalidTargetErrorMaxSuffix: "الحد الأقصى هو ", suggestedFoods: "أطعمة مقترحة:", proteinPlaceholder: "بروتين (جم)", fatPlaceholder: "دهون (جم)", carbsPlaceholder: "كربوهيدرات (جم)",
            searchFoodPlaceholder: "ابحث عن طعام (Spoonacular)...", searchingOnline: "جاري البحث...", apiSearchError: "خطأ في جلب البيانات. حاول مرة أخرى.", noOnlineResultsFound: "لم يتم العثور على نتائج.",
            editPastDayTitle: "لا يمكن تعديل يوم سابق",
            editPastDayMessage: "يمكنك فقط إضافة وجبات لليوم الحالي.",
            editPastDayMessageTarget: "يمكنك فقط تعديل الهدف لليوم الحالي.",
            editPastDayMessageReset: "يمكنك فقط إعادة تعيين بيانات اليوم الحالي.",
            loadingData: "جاري تحميل البيانات..." 
        },
        en: { 
            foodLogTitle: 'Food Log', remainingCaloriesLabel: 'Remaining Calories', mealCountLabel: 'Meal Count', totalCaloriesLabel: 'Total Calories', addMealTitle: 'Add New Meal', addMealButton: 'Add', addMealBtn: '+ Add Meal', resetBtn: 'Reset', errorMessage: 'Please enter a valid meal name and calories. Macros are optional.', mealNamePlaceholder: 'Meal Name', caloriesPlaceholder: 'Calories', closeModal: 'Close', dailyMealsTitle: 'Daily meals', noItemsInCategory: 'No items', addMealPromptInCategory: 'Add to this meal', languageChangeAlertTitle: "Language Change", languageChangeAlertMessage: "Please restart the app for language changes to take full effect.", targetCaloriesLabel: "Daily Target:", editTargetButton: "Edit Target", saveTargetButton: "Save Target", cancelButton: "Cancel", proteinLabel: "Protein", fatLabel: "Fat", carbohydratesLabel: "Carbohydrates", breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snacks: 'Snacks', selectCategory: "Select Category:", editTargetModalTitle: "Edit Daily Target", enterNewTarget: "Enter new target calories:", invalidTargetError: "Please enter a valid positive number.", calorieLimitTitle: "Calorie Limit Reached", calorieLimitReached: "You have reached or exceeded your daily calorie limit.", targetUpdated: "Daily target updated successfully!", invalidTargetErrorMaxPrefix: "Please enter a valid positive number.", invalidTargetErrorMaxSuffix: "Maximum is ", suggestedFoods: "Suggested Foods:", proteinPlaceholder: "Protein (g)", fatPlaceholder: "Fat (g)", carbsPlaceholder: "Carbs (g)",
            searchFoodPlaceholder: "Search food (Spoonacular)...", searchingOnline: "Searching...", apiSearchError: "Error fetching data. Please try again.", noOnlineResultsFound: "No results found.",
            editPastDayTitle: "Cannot Edit Past Day",
            editPastDayMessage: "You can only add meals for the current day.",
            editPastDayMessageTarget: "You can only edit the target for the current day.",
            editPastDayMessageReset: "You can only reset data for the current day.",
            loadingData: "Loading data..." 
         },
    }), [language]);
    const translation = useMemo(() => translations[language] || translations.en, [translations, language]);

    const [isScreenDataLoaded, setIsScreenDataLoaded] = useState(false);
    const getTodaysDateAtMidnight = () => { const today = new Date(); today.setHours(0, 0, 0, 0); return today; };
    const [realToday, setRealToday] = useState(getTodaysDateAtMidnight());
    const [selectedDate, setSelectedDate] = useState(getTodaysDateAtMidnight());
    
    const isTodaySelected = useMemo(() => {
        if (!selectedDate || !realToday) return false;
        return selectedDate.toDateString() === realToday.toDateString();
    }, [selectedDate, realToday]);

    const [mealsData, setMealsData] = useState(initializeEmptyMealsData());
    const [mealCount, setMealCount] = useState(0);
    const [totalCalories, setTotalCalories] = useState(0);
    const [remainingCalories, setRemainingCalories] = useState(2000);
    
    const initialDailyCalories = 2000;
    const [dailyTargetCalories, setDailyTargetCalories] = useState(initialDailyCalories);
    const initialMacroTargets = calculateMacroTargetsFromCalories(initialDailyCalories, DEFAULT_MACRO_PERCENTAGES);
    const [totalProtein, setTotalProtein] = useState(0); 
    const [targetProtein, setTargetProtein] = useState(initialMacroTargets.proteinG);
    const [totalFat, setTotalFat] = useState(0); 
    const [targetFat, setTargetFat] = useState(initialMacroTargets.fatG);
    const [totalCarbs, setTotalCarbs] = useState(0); 
    const [targetCarbs, setTargetCarbs] = useState(initialMacroTargets.carbsG);

    const [isModalVisible, setModalVisible] = useState(false);
    const [mealName, setMealName] = useState(''); const [mealCalories, setMealCalories] = useState('');
    const [mealProtein, setMealProtein] = useState(''); const [mealFat, setMealFat] = useState(''); const [mealCarbs, setMealCarbs] = useState('');
    const [selectedMealCategory, setSelectedMealCategory] = useState(MEAL_CATEGORIES.BREAKFAST);
    const [errorMessage, setErrorMessage] = useState('');
    const [isTargetEditModalVisible, setTargetEditModalVisible] = useState(false);
    const [editableTargetCalories, setEditableTargetCalories] = useState(''); const [targetEditError, setTargetEditError] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [apiSearchResults, setApiSearchResults] = useState([]);
    const [isLoadingApiSearch, setIsLoadingApiSearch] = useState(false);
    const [apiSearchError, setApiSearchError] = useState(null);

    const suggestionsScrollRef = useRef(null);
    const [currentSuggestionsScrollX, setCurrentSuggestionsScrollX] = useState(0);
    const [suggestionsScrollViewWidth, setSuggestionsScrollViewWidth] = useState(0);
    const [suggestionsContentWidth, setSuggestionsContentWidth] = useState(0);
    
    const currentSuggestions = PREDEFINED_FOODS[selectedMealCategory] || [];
    const [showPrevSuggestionArrow, setShowPrevSuggestionArrow] = useState(false);
    const [showNextSuggestionArrow, setShowNextSuggestionArrow] = useState(
        currentSuggestions.length > MAX_SUGGESTIONS_BEFORE_ARROW_LOGIC
    );

    const getMealsDataKeyForDate = useCallback((date) => `${MEALS_DATA_KEY_PREFIX}${date.toISOString().split('T')[0]}`, []);

    // 1. تحميل البيانات
    const loadDataForDate = useCallback(async (dateToLoad) => {
        setIsScreenDataLoaded(false); 
        let loadedMealsData = initializeEmptyMealsData();
        let currentDailyTarget = initialDailyCalories;
        let currentTargetP, currentTargetF, currentTargetC;

        const currentDataKey = getMealsDataKeyForDate(dateToLoad);
        const dateString = dateToLoad.toISOString().split('T')[0];
    
        try {
            const savedDataJSON = await AsyncStorage.getItem(currentDataKey);
            let parsedLocalData = savedDataJSON ? JSON.parse(savedDataJSON) : null;

            const { data: { user } } = await supabase.auth.getUser();
            let cloudData = null;

            if (user) {
                const { data: logEntry, error } = await supabase
                    .from('food_log')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('date', dateString)
                    .single();

                if (!error && logEntry) {
                    cloudData = logEntry;
                }
            }

            const finalData = cloudData || parsedLocalData;

            if (finalData) {
                const mealsSource = finalData.meals_data || finalData.mealsData;
                
                if (mealsSource) {
                    MEAL_CATEGORIES_ORDER.forEach(catKey => {
                        if (!mealsSource[catKey]) {
                            mealsSource[catKey] = initializeEmptyMealsData()[catKey];
                        } else {
                            mealsSource[catKey].image = MEAL_IMAGES[catKey] || MEAL_IMAGES.breakfast;
                            if (typeof mealsSource[catKey].targetCalories !== 'number') {
                                mealsSource[catKey].targetCalories = initializeEmptyMealsData()[catKey].targetCalories;
                            }
                        }
                    });
                    loadedMealsData = mealsSource;
                }
                
                currentDailyTarget = finalData.daily_target_calories || finalData.dailyTargetCalories || initialDailyCalories;
                
                if (currentDailyTarget > MAX_DAILY_TARGET_CALORIES) currentDailyTarget = MAX_DAILY_TARGET_CALORIES;
                
                const calculatedMacros = calculateMacroTargetsFromCalories(currentDailyTarget, DEFAULT_MACRO_PERCENTAGES);
                currentTargetP = calculatedMacros.proteinG;
                currentTargetF = calculatedMacros.fatG;
                currentTargetC = calculatedMacros.carbsG;

                if (cloudData) {
                    await saveMealsDataInternal(
                        loadedMealsData, currentDailyTarget, currentTargetP, currentTargetF, currentTargetC, false, dateToLoad
                    );
                }

            } else { 
                currentDailyTarget = initialDailyCalories;
                const calculatedInitialMacros = calculateMacroTargetsFromCalories(currentDailyTarget, DEFAULT_MACRO_PERCENTAGES);
                currentTargetP = calculatedInitialMacros.proteinG;
                currentTargetF = calculatedInitialMacros.fatG;
                currentTargetC = calculatedInitialMacros.carbsG;
            }

        } catch (error) {
            console.error(`FoodLogScreen: Failed to load data for ${dateToLoad.toDateString()}:`, error);
            loadedMealsData = initializeEmptyMealsData(); 
            const errorFallbackMacros = calculateMacroTargetsFromCalories(initialDailyCalories, DEFAULT_MACRO_PERCENTAGES);
            currentTargetP = errorFallbackMacros.proteinG; currentTargetF = errorFallbackMacros.fatG; currentTargetC = errorFallbackMacros.carbsG;
        }

        setMealsData(loadedMealsData);
        setDailyTargetCalories(currentDailyTarget);
        setTargetProtein(currentTargetP);
        setTargetFat(currentTargetF);
        setTargetCarbs(currentTargetC);
        setIsScreenDataLoaded(true); 
    }, [initialDailyCalories, getMealsDataKeyForDate]); 


    // 2. دالة الحفظ الداخلية
    const saveMealsDataInternal = useCallback(async (currentData, dailyTarget, dailyTargetP, dailyTargetF, dailyTargetC, macrosInitialized, dateToSaveFor) => { 
        const dataKey = getMealsDataKeyForDate(dateToSaveFor); 
        const dateString = dateToSaveFor.toISOString().split('T')[0];
        
        try { 
            const { currentTotalCals, currentP, currentF, currentC, itemCount } = calculateTotalsFromMealsData(currentData); 
            
            const dataToSave = { 
                mealsData: currentData, 
                dailyTargetCalories: dailyTarget, 
                targetProtein: dailyTargetP, targetFat: dailyTargetF, targetCarbs: dailyTargetC, 
                mealCount: itemCount, 
                totalCalories: currentTotalCals, 
                remainingCalories: dailyTarget - currentTotalCals, 
                totalProtein: currentP, totalFat: currentF, totalCarbs: currentC, 
                macrosInitializedFromImage: macrosInitialized, 
            }; 
            await AsyncStorage.setItem(dataKey, JSON.stringify(dataToSave)); 

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase
                    .from('food_log')
                    .upsert({
                        user_id: user.id,
                        date: dateString,
                        meals_data: currentData,
                        daily_target_calories: dailyTarget,
                        total_calories: currentTotalCals,
                        total_protein: currentP,
                        total_fat: currentF,
                        total_carbs: currentC
                    }, { onConflict: 'user_id, date' }); 
                
                if (error) console.log("Error syncing food log:", error);
            }

        } catch (error) { 
            console.error(`FoodLogScreen: Failed to save meals data for ${dateToSaveFor.toDateString()}:`, error); 
        } 
    }, [getMealsDataKeyForDate]);

    useEffect(() => { loadDataForDate(selectedDate); }, [selectedDate, language, loadDataForDate]); 

    useEffect(() => {
        if (!isScreenDataLoaded || !mealsData) return; 
        const { currentTotalCals, currentP, currentF, currentC, itemCount } = calculateTotalsFromMealsData(mealsData);
        setTotalCalories(currentTotalCals);
        setTotalProtein(currentP); setTotalFat(currentF); setTotalCarbs(currentC); setMealCount(itemCount);
    }, [mealsData, isScreenDataLoaded]);

    useEffect(() => {
        if (!isScreenDataLoaded) return;
        setRemainingCalories(dailyTargetCalories - totalCalories);
    }, [dailyTargetCalories, totalCalories, isScreenDataLoaded]);

    useEffect(() => {
        if (!isScreenDataLoaded || !mealsData || !isTodaySelected) return; 

        const DebouncedSave = setTimeout(async () => {
            saveMealsDataInternal(
                mealsData,
                dailyTargetCalories,
                targetProtein, targetFat, targetCarbs,   
                false,
                selectedDate
            );
        }, 1500);

        return () => clearTimeout(DebouncedSave);
    }, [mealsData, dailyTargetCalories, targetProtein, targetFat, targetCarbs, selectedDate, isScreenDataLoaded, isTodaySelected, saveMealsDataInternal]);

    const searchFoodOnline = async (query) => {
        if (!query.trim() || !SPOONACULAR_API_KEY) { setApiSearchResults([]); setApiSearchError(null); if (!SPOONACULAR_API_KEY) console.warn("Spoonacular API Key not configured."); return; }
        setIsLoadingApiSearch(true); setApiSearchError(null); setApiSearchResults([]);
        const encodedQuery = encodeURIComponent(query);
        const url = `https://api.spoonacular.com/food/ingredients/search?query=${encodedQuery}&apiKey=${SPOONACULAR_API_KEY}&number=15&metaInformation=true`;
        try {
            const response = await fetch(url);
            if (!response.ok) { let errorMsg = `API Error: ${response.status}`; try { const errorData = await response.json(); errorMsg = errorData.message || errorMsg; } catch (e) { /* ignore */ } throw new Error(errorMsg); }
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const detailedResultsPromises = data.results.map(async (item) => {
                    const nutritionUrl = `https://api.spoonacular.com/food/ingredients/${item.id}/information?amount=100&unit=grams&apiKey=${SPOONACULAR_API_KEY}`;
                    try {
                        const nutritionResponse = await fetch(nutritionUrl);
                        if (!nutritionResponse.ok) return null;
                        const nutritionData = await nutritionResponse.json();
                        const nutrients = nutritionData.nutrition?.nutrients || [];
                        const getNutrientValue = (name) => { const nutrient = nutrients.find(n => n.name.toLowerCase() === name.toLowerCase()); return nutrient ? Math.round(nutrient.amount) : 0; };
                        return { id: item.id.toString(), name_en: nutritionData.name || item.name, name_ar: nutritionData.name || item.name, calories: getNutrientValue("Calories"), protein: getNutrientValue("Protein"), fat: getNutrientValue("Fat"), carbs: getNutrientValue("Carbohydrates") || getNutrientValue("Net Carbohydrates"), image: item.image ? `${SPOONACULAR_IMAGE_BASE_URL}${item.image}` : null, isApiResult: true };
                    } catch (err) { console.error(`Error fetching nutrition for ${item.name}:`, err); return null; }
                });
                const detailedResults = (await Promise.all(detailedResultsPromises)).filter(Boolean);
                setApiSearchResults(detailedResults);
            } else { setApiSearchResults([]); }
        } catch (error) { console.error("Spoonacular API Search Error:", error); setApiSearchError(error.message || translation.apiSearchError); } 
        finally { setIsLoadingApiSearch(false); }
    };

    useEffect(() => { if (searchQuery.trim() === '') { setApiSearchResults([]); setApiSearchError(null); setIsLoadingApiSearch(false); return; } const handler = setTimeout(() => { if (searchQuery.length > 1) { searchFoodOnline(searchQuery); } else { setApiSearchResults([]); setApiSearchError(null); } }, 700); return () => clearTimeout(handler); }, [searchQuery, translation.apiSearchError]);
    
    const handleSelectFoodFromSearch = (food) => { setMealName(food.name_en); setMealCalories(String(food.calories || '0')); setMealProtein(String(food.protein || '0')); setMealFat(String(food.fat || '0')); setMealCarbs(String(food.carbs || '0')); setSearchQuery(''); setApiSearchResults([]); setApiSearchError(null); setIsLoadingApiSearch(false); };
    const handleCloseAddMealModal = () => { setModalVisible(false); setErrorMessage(''); setMealName(''); setMealCalories(''); setMealProtein(''); setMealFat(''); setMealCarbs(''); setSearchQuery(''); setApiSearchResults([]); setApiSearchError(null); setIsLoadingApiSearch(false); setCurrentSuggestionsScrollX(0); };
    
    const addMeal = useCallback(() => {
        if (!isTodaySelected) { Alert.alert(translation.editPastDayTitle, translation.editPastDayMessage); handleCloseAddMealModal(); return; }
        const caloriesNum = parseInt(mealCalories);
        const proteinNum = parseFloat(mealProtein) || 0;
        const fatNum = parseFloat(mealFat) || 0;
        const carbsNum = parseFloat(mealCarbs) || 0;

        if (remainingCalories <= 0 && caloriesNum > 0) { setErrorMessage(translation.calorieLimitReached); return; }

        if (mealName.trim() && !isNaN(caloriesNum) && caloriesNum >= 0 && selectedMealCategory) {
            const newFoodItem = { id: Date.now().toString() + Math.random().toString(), name: mealName.trim(), calories: caloriesNum, protein: proteinNum, fat: fatNum, carbs: carbsNum };
            setMealsData(prev => {
                const updated = JSON.parse(JSON.stringify(prev)); 
                if (!updated[selectedMealCategory]) { updated[selectedMealCategory] = initializeEmptyMealsData()[selectedMealCategory]; }
                updated[selectedMealCategory].items.push(newFoodItem);
                return updated;
            });
            handleCloseAddMealModal();
        } else { setErrorMessage(translation.errorMessage); }
    }, [mealName, mealCalories, mealProtein, mealFat, mealCarbs, selectedMealCategory, translation, remainingCalories, handleCloseAddMealModal, isTodaySelected]);

    const handleOpenTargetEditModal = () => { if (!isTodaySelected) { Alert.alert(translation.editPastDayTitle, translation.editPastDayMessageTarget); return; } setEditableTargetCalories(String(dailyTargetCalories)); setTargetEditError(''); setTargetEditModalVisible(true); };
    
    const handleSaveTargetCalories = () => {
        if (!isTodaySelected) { Alert.alert(translation.editPastDayTitle, translation.editPastDayMessageTarget); setTargetEditModalVisible(false); return; }
        const newTargetCalories = parseInt(editableTargetCalories);
        if (isNaN(newTargetCalories) || newTargetCalories <= 0) { setTargetEditError(translation.invalidTargetError); return; }
        if (newTargetCalories > MAX_DAILY_TARGET_CALORIES) { setTargetEditError(`${translation.invalidTargetErrorMaxPrefix}${translation.invalidTargetErrorMaxSuffix}${MAX_DAILY_TARGET_CALORIES.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}`); return; }

        const newMacroTargets = calculateMacroTargetsFromCalories(newTargetCalories, DEFAULT_MACRO_PERCENTAGES);
        setTargetProtein(newMacroTargets.proteinG); setTargetFat(newMacroTargets.fatG); setTargetCarbs(newMacroTargets.carbsG);

        const newMealsData = JSON.parse(JSON.stringify(mealsData));
        setDailyTargetCalories(newTargetCalories);
        setMealsData(newMealsData);
        setTargetEditModalVisible(false); setTargetEditError(''); Alert.alert(translation.targetUpdated);
    };

    const resetMeals = useCallback(() => {
        if (!isTodaySelected) { Alert.alert(translation.editPastDayTitle, translation.editPastDayMessageReset); return; }
        setMealsData(initializeEmptyMealsData());
        const resetMacros = calculateMacroTargetsFromCalories(initialDailyCalories, DEFAULT_MACRO_PERCENTAGES);
        setTargetProtein(resetMacros.proteinG); setTargetFat(resetMacros.fatG); setTargetCarbs(resetMacros.carbsG); setDailyTargetCalories(initialDailyCalories);
    }, [initialDailyCalories, isTodaySelected, translation]);

    const handleDateChange = (newDate) => { if (newDate.toDateString() !== selectedDate.toDateString()) setSelectedDate(new Date(newDate)); };
    
    const canAddMoreCalories = remainingCalories > 0;

    const renderSearchResultItem = ({ item }) => { const imageSource = item.image ? { uri: item.image } : null; return ( <TouchableOpacity style={styles.searchResultItem} onPress={() => handleSelectFoodFromSearch(item)}>{imageSource ? (<Image source={imageSource} style={styles.searchResultImage} onError={(e) => console.log("Spoonacular Image load error:", e.nativeEvent.error, item.image)} />) : (<View style={[styles.searchResultImage, styles.searchResultImagePlaceholder]} />)}<View style={styles.searchResultTextContainer}><Text style={styles.searchResultName} numberOfLines={2}>{item.name_en}</Text><Text style={styles.searchResultMacros}>{`${item.calories} kcal | ${translation.proteinLabel.substring(0,1)}:${item.protein}g | ${translation.fatLabel.substring(0,1)}:${item.fat}g | ${translation.carbohydratesLabel.substring(0,1)}:${item.carbs}g`}</Text></View></TouchableOpacity> ); };

    useEffect(() => { setCurrentSuggestionsScrollX(0); if (suggestionsScrollRef.current) { suggestionsScrollRef.current.scrollTo({ x: 0, animated: false }); } setShowPrevSuggestionArrow(false); setShowNextSuggestionArrow(currentSuggestions.length > MAX_SUGGESTIONS_BEFORE_ARROW_LOGIC); }, [selectedMealCategory, currentSuggestions.length]);

    useEffect(() => {
        if (suggestionsScrollViewWidth === 0 || suggestionsContentWidth === 0) {
            const canContentOverflowInitially = (currentSuggestions.length * SUGGESTION_CHIP_EFFECTIVE_WIDTH - (currentSuggestions.length > 0 ? SUGGESTION_CHIP_MARGIN_RIGHT : 0)) > suggestionsScrollViewWidth;
            setShowNextSuggestionArrow(suggestionsScrollViewWidth > 0 ? canContentOverflowInitially : currentSuggestions.length > MAX_SUGGESTIONS_BEFORE_ARROW_LOGIC);
            setShowPrevSuggestionArrow(false); 
            return;
        }
        const canScrollPrev = currentSuggestionsScrollX > 5;
        const canScrollNext = currentSuggestionsScrollX + suggestionsScrollViewWidth < suggestionsContentWidth - 5;
        setShowPrevSuggestionArrow(canScrollPrev);
        setShowNextSuggestionArrow(canScrollNext);
    }, [currentSuggestionsScrollX, suggestionsScrollViewWidth, suggestionsContentWidth, currentSuggestions.length]);

    const handleSuggestionsScroll = (event) => { setCurrentSuggestionsScrollX(event.nativeEvent.contentOffset.x); };
    const handleSuggestionsLayout = (event) => { setSuggestionsScrollViewWidth(event.nativeEvent.layout.width); };
    const handleSuggestionsContentSizeChange = (width) => { setSuggestionsContentWidth(width); };
    const scrollToNextSuggestion = () => { if (suggestionsScrollRef.current) { const targetX = Math.min( currentSuggestionsScrollX + SUGGESTION_CHIP_EFFECTIVE_WIDTH, suggestionsContentWidth - suggestionsScrollViewWidth ); suggestionsScrollRef.current.scrollTo({ x: targetX, animated: true }); } };
    const scrollToPrevSuggestion = () => { if (suggestionsScrollRef.current) { const targetX = Math.max( 0, currentSuggestionsScrollX - SUGGESTION_CHIP_EFFECTIVE_WIDTH ); suggestionsScrollRef.current.scrollTo({ x: targetX, animated: true }); } };

    if (!isScreenDataLoaded) { 
        return ( 
            <View style={[styles.wrapper, { justifyContent: 'center', alignItems: 'center' }]}> 
                <ActivityIndicator size="large" color={darkMode ? '#80cbc4' : '#388e3c'} />
                <Text style={{ color: darkMode ? styles.title.color : styles.title.color, marginTop:10 }}>{translation.loadingData}</Text> 
            </View> 
        ); 
    }

    const suggestionScrollViewPadding = { paddingLeft: showPrevSuggestionArrow ? SUGGESTION_ARROW_WIDTH : 0, paddingRight: showNextSuggestionArrow ? SUGGESTION_ARROW_WIDTH : 0 };

    return (
        <View style={styles.wrapper}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContentContainer} keyboardShouldPersistTaps="handled" key={`${language}-${darkMode}-${selectedDate.toDateString()}`}>
                <View style={styles.innerContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{translation.foodLogTitle}</Text>
                    </View>
                    
                    <DateNavigator currentDate={selectedDate} onDateSelect={handleDateChange} language={language} darkMode={darkMode} realToday={realToday} />
                    
                    <CalorieProgressDisplay currentCalories={totalCalories} targetCalories={dailyTargetCalories} proteinCurrent={totalProtein} proteinTarget={targetProtein} proteinLabel={translation.proteinLabel} fatCurrent={totalFat} fatTarget={targetFat} fatLabel={translation.fatLabel} carbsCurrent={totalCarbs} carbsTarget={targetCarbs} carbohydratesLabel={translation.carbohydratesLabel} darkMode={darkMode} />
                    
                    <View style={styles.targetDisplayContainer}>
                        <View style={styles.targetDisplay}>
                            <Text style={styles.targetLabel}>{translation.targetCaloriesLabel}</Text>
                            <Text style={styles.targetValue}>{dailyTargetCalories.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text>
                        </View>
                        <TouchableOpacity onPress={handleOpenTargetEditModal} style={[styles.editTargetButton, !isTodaySelected && styles.disabledButton]} disabled={!isTodaySelected}>
                            <Text style={styles.editTargetButtonText}>{translation.editTargetButton}</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.stats}>
                        <View style={styles.statItem}><Text style={styles.statValue}>{Math.round(remainingCalories).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text><Text style={styles.statLabel}>{translation.remainingCaloriesLabel}</Text></View>
                        <View style={styles.statItem}><Text style={styles.statValue}>{mealCount.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text><Text style={styles.statLabel}>{translation.mealCountLabel}</Text></View>
                        <View style={styles.statItem}><Text style={styles.statValue}>{Math.round(totalCalories).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text><Text style={styles.statLabel}>{translation.totalCaloriesLabel}</Text></View>
                    </View>
                    
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity style={[styles.addMealBtn, (!canAddMoreCalories || !isTodaySelected) && styles.disabledButton]} onPress={() => { if (!isTodaySelected) { Alert.alert(translation.editPastDayTitle, translation.editPastDayMessage); return; } if (!canAddMoreCalories) { return; } setModalVisible(true); }} disabled={!canAddMoreCalories || !isTodaySelected}>
                            <Text style={styles.buttonText}>{translation.addMealBtn}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.resetBtn, !isTodaySelected && styles.disabledButton]} onPress={resetMeals} disabled={!isTodaySelected}>
                            <Text style={styles.buttonText}>{translation.resetBtn}</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.dailyMealsTitle}>{translation.dailyMealsTitle}</Text>
                    
                    <View style={styles.mealCategoriesContainer}>
                        {MEAL_CATEGORIES_ORDER.map(categoryKey => {
                            const categoryData = mealsData[categoryKey];
                            if (!categoryData) return null;
                            const categoryTotalCalories = categoryData.items.reduce((sum, item) => sum + (item.calories || 0), 0);
                            const categoryTotalProtein = categoryData.items.reduce((sum, item) => sum + (item.protein || 0), 0);
                            const categoryTotalFat = categoryData.items.reduce((sum, item) => sum + (item.fat || 0), 0);
                            const categoryTotalCarbs = categoryData.items.reduce((sum, item) => sum + (item.carbs || 0), 0);
                            let mainText = categoryData.items.length > 0 ? (categoryData.items[0].name + (categoryData.items.length > 1 ? (language === 'ar' ? " و المزيد" : " & more") : "")) : translation.noItemsInCategory;
                            
                            return (
                                <TouchableOpacity key={categoryKey} style={styles.mealCategoryCard} onPress={() => { if (!isTodaySelected) { Alert.alert(translation.editPastDayTitle, translation.editPastDayMessage); return; } if (!canAddMoreCalories && categoryData.items.length === 0) { return; } setSelectedMealCategory(categoryKey); setModalVisible(true); }} disabled={!isTodaySelected && categoryData.items.length === 0}>
                                    <Image source={categoryData.image} style={styles.mealCategoryImage} onError={(e) => console.log("Failed to load image for", categoryKey, e.nativeEvent.error)} />
                                    <View style={styles.mealCategoryInfo}>
                                        <Text style={styles.mealCategoryTitle}>{translation[categoryKey]}</Text>
                                        <Text style={styles.mealCategoryItemName} numberOfLines={1}>{mainText}</Text>
                                        <Text style={styles.mealCategoryCalories}>{`${Math.round(categoryTotalCalories)} / ${Math.round(categoryData.targetCalories || 0)} KCAL`}</Text>
                                        <Text style={styles.mealCategoryMacros} numberOfLines={1}>{`${translation.proteinLabel.substring(0,1)}: ${Math.round(categoryTotalProtein)}g • ${translation.fatLabel.substring(0,1)}: ${Math.round(categoryTotalFat)}g • ${translation.carbohydratesLabel.substring(0,1)}: ${Math.round(categoryTotalCarbs)}g`}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
            
            <Modal visible={isModalVisible} transparent={true} animationType="slide" onRequestClose={handleCloseAddMealModal}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <ScrollView keyboardShouldPersistTaps="handled">
                            <TouchableOpacity style={styles.closeButton} onPress={handleCloseAddMealModal}><Text style={styles.closeButtonText}>×</Text></TouchableOpacity>
                            <Text style={styles.modalTitle}>{translation.addMealTitle}</Text>
                            <TextInput style={styles.searchInput} placeholder={translation.searchFoodPlaceholder} value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={styles.placeholderColor.color} editable={isTodaySelected}/>
                            {isLoadingApiSearch && (<View style={styles.loadingContainer}><ActivityIndicator size="small" color={darkMode ? styles.darkLoadingIndicator.color : styles.lightLoadingIndicator.color} /><Text style={styles.loadingText}>{translation.searchingOnline}</Text></View>)}
                            {apiSearchError && !isLoadingApiSearch && (<Text style={styles.errorText}>{apiSearchError}</Text>)}
                            {!isLoadingApiSearch && !apiSearchError && searchQuery.length > 0 && apiSearchResults.length === 0 && (<Text style={styles.noResultsText}>{translation.noOnlineResultsFound}</Text>)}
                            {apiSearchResults.length > 0 && !isLoadingApiSearch && (<FlatList data={apiSearchResults} renderItem={renderSearchResultItem} keyExtractor={(item) => item.id.toString()} style={styles.searchResultsList} nestedScrollEnabled />)}
                            <Text style={styles.pickerLabel}>{translation.selectCategory}</Text>
                            <View style={[styles.pickerContainer, !isTodaySelected && styles.disabledPickerContainer]}>
                                <Picker selectedValue={selectedMealCategory} onValueChange={(itemValue) => { if(isTodaySelected) setSelectedMealCategory(itemValue);}} style={styles.picker} itemStyle={styles.pickerItem} dropdownIconColor={darkMode ? '#FFFFFF' : '#555'} enabled={isTodaySelected}>
                                    {MEAL_CATEGORIES_ORDER.map(catKey => (<Picker.Item key={catKey} label={translation[catKey]} value={catKey} />))}
                                </Picker>
                            </View>
                            
                            <Text style={styles.modalSectionTitle}>{translation.suggestedFoods}</Text>
                            <View style={styles.suggestionsContainer}>
                                {showPrevSuggestionArrow && ( <TouchableOpacity style={[styles.suggestionScrollArrowContainer, I18nManager.isRTL ? { right: 0 } : { left: 0 }]} onPress={scrollToPrevSuggestion} > <Text style={styles.suggestionScrollArrowText}> {I18nManager.isRTL ? '›' : '‹'} </Text> </TouchableOpacity> )}
                                <ScrollView ref={suggestionsScrollRef} horizontal showsHorizontalScrollIndicator={false} onScroll={handleSuggestionsScroll} onLayout={handleSuggestionsLayout} onContentSizeChange={handleSuggestionsContentSizeChange} scrollEventThrottle={16}  style={[styles.suggestionsScrollView, suggestionScrollViewPadding]} keyboardShouldPersistTaps="handled" scrollEnabled={isTodaySelected} >
                                    {currentSuggestions.map(food => ( <TouchableOpacity key={food.id} style={styles.suggestionChip} onPress={() => {if(isTodaySelected) handleSelectFoodFromSearch(food);}} disabled={!isTodaySelected} > <Image source={food.image} style={styles.suggestionChipImage} /> <Text style={styles.suggestionChipText} numberOfLines={2}> {language === 'ar' ? food.name_ar : food.name_en} </Text> <Text style={styles.suggestionChipCalories}>{food.calories} kcal</Text> </TouchableOpacity> ))}
                                </ScrollView>
                                {showNextSuggestionArrow && ( <TouchableOpacity style={[styles.suggestionScrollArrowContainer, I18nManager.isRTL ? { left: 0 } : { right: 0 }]} onPress={scrollToNextSuggestion} > <Text style={styles.suggestionScrollArrowText}> {I18nManager.isRTL ? '‹' : '›'} </Text> </TouchableOpacity> )}
                            </View>

                            <View style={styles.inputContainer}>
                                <TextInput style={[styles.input, !isTodaySelected && styles.disabledInput]} placeholder={translation.mealNamePlaceholder} value={mealName} onChangeText={setMealName} placeholderTextColor={styles.placeholderColor.color} editable={isTodaySelected} />
                                <TextInput style={[styles.input, !isTodaySelected && styles.disabledInput]} placeholder={translation.caloriesPlaceholder} keyboardType="numeric" value={mealCalories} onChangeText={setMealCalories} placeholderTextColor={styles.placeholderColor.color} editable={isTodaySelected} />
                                <TextInput style={[styles.input, !isTodaySelected && styles.disabledInput]} placeholder={translation.proteinPlaceholder} keyboardType="numeric" value={mealProtein} onChangeText={setMealProtein} placeholderTextColor={styles.placeholderColor.color} editable={isTodaySelected} />
                                <TextInput style={[styles.input, !isTodaySelected && styles.disabledInput]} placeholder={translation.fatPlaceholder} keyboardType="numeric" value={mealFat} onChangeText={setMealFat} placeholderTextColor={styles.placeholderColor.color} editable={isTodaySelected} />
                                <TextInput style={[styles.input, !isTodaySelected && styles.disabledInput]} placeholder={translation.carbsPlaceholder} keyboardType="numeric" value={mealCarbs} onChangeText={setMealCarbs} placeholderTextColor={styles.placeholderColor.color} editable={isTodaySelected} />
                                {errorMessage ? (<Text style={styles.errorText}>{errorMessage}</Text>) : null}
                            </View>
                            <TouchableOpacity style={[styles.addButton, ((!canAddMoreCalories && mealCalories !== '' && parseInt(mealCalories) > 0) || !isTodaySelected) && styles.disabledButton]} onPress={addMeal} disabled={(!canAddMoreCalories && mealCalories !== '' && (parseInt(mealCalories) || 0) > 0) || !isTodaySelected}>
                                <Text style={styles.addButtonText}>{translation.addMealButton}</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            
            <Modal visible={isTargetEditModalVisible} transparent={true} animationType="slide" onRequestClose={() => { setTargetEditModalVisible(false); setTargetEditError(''); }}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <TouchableOpacity style={styles.closeButton} onPress={() => { setTargetEditModalVisible(false); setTargetEditError(''); }}>
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>
                        <Text style={styles.modalTitle}>{translation.editTargetModalTitle}</Text>
                        <TextInput style={[styles.input, !isTodaySelected && styles.disabledInput]} placeholder={translation.enterNewTarget} keyboardType="numeric" value={editableTargetCalories} onChangeText={setEditableTargetCalories} placeholderTextColor={styles.placeholderColor.color} editable={isTodaySelected}/>
                        {targetEditError ? ( <Text style={styles.errorText}>{targetEditError}</Text> ) : null}
                        <View style={baseStyles.modalButtonsContainer}>
                            <TouchableOpacity style={[ baseStyles.modalButton, darkMode ? darkStyles.cancelButton : lightStyles.cancelButton, { marginRight: Platform.OS === 'ios' ? 5 : (I18nManager.isRTL ? 0 : 5) , marginLeft: Platform.OS === 'ios' ? 0 : (I18nManager.isRTL ? 5 : 0)} ]} onPress={() => { setTargetEditModalVisible(false); setTargetEditError(''); }}>
                                <Text style={[ baseStyles.modalButtonText, darkMode ? darkStyles.modalButtonText : lightStyles.modalButtonText ]}>{translation.cancelButton}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[ baseStyles.modalButton, darkMode ? darkStyles.saveButton : lightStyles.saveButton, !isTodaySelected && styles.disabledButton, { marginLeft: Platform.OS === 'ios' ? 5 : (I18nManager.isRTL ? 0 : 5) , marginRight: Platform.OS === 'ios' ? 0 : (I18nManager.isRTL ? 5 : 0)} ]} onPress={handleSaveTargetCalories} disabled={!isTodaySelected}>
                                <Text style={[ baseStyles.modalButtonText, darkMode ? darkStyles.saveModalButtonText : lightStyles.saveModalButtonText ]}>{translation.saveTargetButton}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// Styles remain the same
const baseStyles = {
    mealCategoriesContainer: { marginTop: 10, marginBottom: 20 }, mealCategoryCard: { borderRadius: 12, marginBottom: 12, elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, height: 135, overflow: 'hidden' }, mealCategoryImage: { width: '100%', height: '100%', resizeMode: 'cover' }, mealCategoryInfo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', padding: 12, backgroundColor: 'rgba(56, 142, 60, 0.65)' }, mealCategoryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 2, color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }, mealCategoryItemName: { fontSize: 13, marginBottom: 3, color: '#F0F0F0', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }, mealCategoryCalories: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3, marginBottom: 2 }, mealCategoryMacros: { fontSize: 11, color: '#E0E0E0', textShadowColor: 'rgba(0, 0, 0, 0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 2 }, dailyMealsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: I18nManager.isRTL ? 'right' : 'left' }, pickerLabel: { fontSize: 16, marginBottom: Platform.OS === 'ios' ? -10 : 5, textAlign: I18nManager.isRTL ? 'right' : 'left' }, pickerContainer: { borderWidth: 1, borderRadius: 8, marginBottom: 15, height: Platform.OS === 'ios' ? 120 : 50, justifyContent: 'center', overflow: Platform.OS === 'ios' ? 'hidden' : 'visible' }, picker: { width: '100%', height: Platform.OS === 'ios' ? 120 : 50 }, 
    pickerItem: Platform.OS === 'android' ? {} : {},
    modalLabel: { fontSize: 16, marginBottom: 8, textAlign: I18nManager.isRTL ? 'right' : 'left' }, modalButtonsContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginTop: 20 }, modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center', elevation: 2 }, modalButtonText: { fontSize: 16, fontWeight: 'bold' }, disabledButton: { opacity: 0.5 }, disabledInput: { }, disabledPickerContainer: { opacity: 0.6 }, modalSectionTitle: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 8, textAlign: I18nManager.isRTL ? 'right' : 'left' }, suggestionsContainer: { position: 'relative', height: 120, marginBottom: 15, flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', }, suggestionsScrollView: { height: '100%', flex: 1, }, suggestionChip: { borderRadius: 10, padding: 8, marginRight: SUGGESTION_CHIP_MARGIN_RIGHT, alignItems: 'center', width: SUGGESTION_CHIP_ITEM_WIDTH, height: 120, justifyContent: 'space-between' }, suggestionChipImage: { width: 60, height: 60, borderRadius: 8, marginBottom: 5 }, suggestionChipText: { fontSize: 12, textAlign: 'center' }, suggestionChipCalories: { fontSize: 11, opacity: 0.8 }, suggestionScrollArrowContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center', width: SUGGESTION_ARROW_WIDTH, height: SUGGESTION_ARROW_WIDTH, borderRadius: SUGGESTION_ARROW_WIDTH / 2, zIndex: 1, top: (120 - SUGGESTION_ARROW_WIDTH) / 2, }, suggestionScrollArrowText: { fontSize: 26, fontWeight: '300', transform: [{ translateY: -4 }], }, searchInput: { height: 45, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, marginBottom: 10, fontSize: 15, textAlign: I18nManager.isRTL ? 'right' : 'left', }, loadingContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, }, loadingText: { marginHorizontal: 10, fontSize: 14, }, noResultsText: { textAlign: 'center', marginVertical: 10, fontSize: 14, opacity: 0.7, }, searchResultsList: { maxHeight: 220, marginBottom: 10, borderWidth: 1, borderRadius: 8, }, searchResultItem: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', borderBottomWidth: 1, }, searchResultImage: { width: 45, height: 45, borderRadius: 6, marginRight: I18nManager.isRTL ? 0 : 10, marginLeft: I18nManager.isRTL ? 10 : 0, }, searchResultImagePlaceholder: { }, searchResultTextContainer: { flex: 1, }, searchResultName: { fontSize: 14, fontWeight: '600', }, searchResultBrand: { fontSize: 11, opacity: 0.6, marginTop: 1, marginBottom: 2, }, searchResultMacros: { fontSize: 11, opacity: 0.8, },
};

const lightStyles = StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: '#e8f5e9' }, scrollView: { flex: 1 }, scrollContentContainer: { flexGrow: 1, paddingBottom: Platform.OS === 'ios' ? 50 : 80, paddingTop: 10 }, innerContainer: { backgroundColor: '#ffffff', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginHorizontal: 15, marginTop: 10, marginBottom: 15, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, minHeight: Platform.OS === 'ios' ? 650 : 600 }, header: { alignItems: 'center', marginTop: 5, marginBottom: 5 }, title: { fontSize: 24, fontWeight: 'bold', color: '#2e7d32' }, targetDisplayContainer: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginTop: 10, paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#f0f4f0', borderRadius: 8 }, targetDisplay: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', alignItems: 'center' }, targetLabel: { fontSize: 16, color: '#388e3c', fontWeight: '600', marginRight: I18nManager.isRTL ? 0 : 8, marginLeft: I18nManager.isRTL ? 8 : 0 }, targetValue: { fontSize: 18, fontWeight: 'bold', color: '#1b5e20' }, editTargetButton: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#388e3c', borderRadius: 6 }, editTargetButtonText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' }, stats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }, statItem: { borderRadius: 10, paddingHorizontal: 5, flex: 1, alignItems: 'center' }, statValue: { fontSize: 20, fontWeight: 'bold', color: '#004d40', backgroundColor: 'rgba(165, 214, 167, 0.4)', borderWidth: 1, borderColor: '#388e3c', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 15, textAlign: 'center', minWidth: 80, marginBottom: 5 }, statLabel: { fontSize: 12, color: '#004d40', textAlign: 'center' }, buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, addMealBtn: { backgroundColor: '#388e3c', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 10, flex: 1, marginRight: I18nManager.isRTL ? 0 : 5, marginLeft: I18nManager.isRTL ? 5 : 0, alignItems: 'center', elevation: 2 }, resetBtn: { backgroundColor: '#4caf50', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 10, flex: 1, marginLeft: I18nManager.isRTL ? 0 : 5, marginRight: I18nManager.isRTL ? 5 : 0, alignItems: 'center', elevation: 2 }, buttonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: '#ffffff', paddingHorizontal: 25, paddingBottom: 25, paddingTop: 45, borderRadius: 15, width: '90%', maxWidth: 400, alignItems: 'stretch', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, position: 'relative', maxHeight: '90%' },
    closeButton: { position: 'absolute', top: -10, right: I18nManager.isRTL ? undefined : 12, left: I18nManager.isRTL ? 12 : undefined, padding: 8, zIndex: 10 },
    closeButtonText: { fontSize: 24, fontWeight: 'bold', color: '#777' },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#388e3c', textAlign: 'center' }, inputContainer: { width: '100%', marginBottom: 10 }, input: { width: '100%', paddingVertical: 10, paddingHorizontal: 15, marginVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', backgroundColor: '#f8f8f8', fontSize: 15, color: '#333', textAlign: I18nManager.isRTL ? 'right' : 'left' }, placeholderColor: { color: '#999' }, errorText: { color: '#d32f2f', fontSize: 13, marginTop: 5, textAlign: 'center' }, addButton: { backgroundColor: '#388e3c', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 20, alignItems: 'center', marginTop: 10, elevation: 2 }, addButtonText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
    ...baseStyles,
    pickerItem: { ...baseStyles.pickerItem, color: '#333333' },
    disabledInput: { backgroundColor: '#e0e0e0', color: '#a0a0a0' },
    mealCategoryCard: { ...baseStyles.mealCategoryCard, backgroundColor: '#e9e9e9', shadowColor: '#000000', shadowOpacity: 0.2 }, dailyMealsTitle: { ...baseStyles.dailyMealsTitle, color: '#388e3c' }, pickerLabel: { ...baseStyles.pickerLabel, color: '#333333'}, pickerContainer: { ...baseStyles.pickerContainer, borderColor: '#ccc', backgroundColor: '#f8f8f8'}, picker: { ...baseStyles.picker, color: '#333333'}, modalLabel: { ...baseStyles.modalLabel, color: '#333333' },
    cancelButton: { ...baseStyles.modalButton, backgroundColor: '#e0e0e0'},
    saveButton: { ...baseStyles.modalButton, backgroundColor: '#388e3c'},
    modalButtonText: { ...baseStyles.modalButtonText, color: '#333333' },
    saveModalButtonText: { ...baseStyles.modalButtonText, color: '#ffffff' },
    modalSectionTitle: { ...baseStyles.modalSectionTitle, color: '#388e3c' },
    suggestionChip: { ...baseStyles.suggestionChip, backgroundColor: '#e8f5e9', borderWidth: 1, borderColor: '#c8e6c9' },
    suggestionChipText: { ...baseStyles.suggestionChipText, color: '#1b5e20' },
    suggestionChipCalories: { ...baseStyles.suggestionChipCalories, color: '#388e3c' },
    suggestionScrollArrowContainer: { ...baseStyles.suggestionScrollArrowContainer, backgroundColor: 'rgba(230, 230, 230, 0.85)' },
    suggestionScrollArrowText: { ...baseStyles.suggestionScrollArrowText, color: '#555555' },
    searchInput: { ...baseStyles.searchInput, borderColor: '#ccc', backgroundColor: '#f9f9f9', color: '#333' }, lightLoadingIndicator: { color: '#388e3c' }, loadingText: { ...baseStyles.loadingText, color: '#555' }, noResultsText: { ...baseStyles.noResultsText, color: '#777' }, searchResultsList: { ...baseStyles.searchResultsList, borderColor: '#e0e0e0', backgroundColor: '#ffffff' }, searchResultItem: { ...baseStyles.searchResultItem, borderBottomColor: '#f0f0f0' }, searchResultImage: { ...baseStyles.searchResultImage, backgroundColor: '#e9e9e9' }, searchResultName: { ...baseStyles.searchResultName, color: '#222' }, searchResultBrand: { ...baseStyles.searchResultBrand, color: '#666' }, searchResultMacros: { ...baseStyles.searchResultMacros, color: '#444' },
});

const darkStyles = StyleSheet.create({
    ...lightStyles, 
    wrapper: { ...lightStyles.wrapper, backgroundColor: '#121212' }, 
    innerContainer: { ...lightStyles.innerContainer, backgroundColor: '#1e1e1e', shadowColor: '#000' }, 
    title: { ...lightStyles.title, color: '#80cbc4' }, 
    targetDisplayContainer: { ...lightStyles.targetDisplayContainer, backgroundColor: '#2a2a2a' }, 
    targetLabel: { ...lightStyles.targetLabel, color: '#80cbc4' }, 
    targetValue: { ...lightStyles.targetValue, color: '#a7ffeb' }, 
    editTargetButton: { ...lightStyles.editTargetButton, backgroundColor: '#00796b'}, 
    editTargetButtonText: { ...lightStyles.editTargetButtonText, color: '#e0f2f1'}, 
    statValue: { ...lightStyles.statValue, color: '#ffffff', backgroundColor: 'rgba(128, 203, 196, 0.2)', borderColor: '#80cbc4' }, 
    statLabel: { ...lightStyles.statLabel, color: '#b0b0b0' }, 
    addMealBtn: { ...lightStyles.addMealBtn, backgroundColor: '#00796b' }, 
    resetBtn: { ...lightStyles.resetBtn, backgroundColor: '#00897b' }, 
    buttonText: { ...lightStyles.buttonText, color: '#e0f2f1' },
    modalContent: { ...lightStyles.modalContent, backgroundColor: '#2c2c2c' },
    closeButtonText: { ...lightStyles.closeButtonText, color: '#b0b0b0' },
    modalTitle: { ...lightStyles.modalTitle, color: '#a7ffeb' }, 
    input: { ...lightStyles.input, borderColor: '#555555', backgroundColor: '#3b3b3b', color: '#ffffff' }, 
    placeholderColor: { color: '#888' }, 
    errorText: { ...lightStyles.errorText, color: '#ff8a80' }, 
    addButton: { ...lightStyles.addButton, backgroundColor: '#00796b' }, 
    addButtonText: { ...lightStyles.addButtonText, color: '#e0f2f1' },
    pickerItem: { ...baseStyles.pickerItem, color: '#e0e0e0' },
    disabledInput: { backgroundColor: '#2a2a2a', color: '#777777', borderColor: '#404040' },
    mealCategoryCard: { ...baseStyles.mealCategoryCard, backgroundColor: '#2c2c2c', shadowColor: '#000000', shadowOpacity: 0.3 }, 
    mealCategoryInfo: { ...baseStyles.mealCategoryInfo, backgroundColor: 'rgba(0, 121, 107, 0.65)' }, 
    mealCategoryMacros: { ...baseStyles.mealCategoryMacros, color: '#B2DFDB'}, 
    dailyMealsTitle: { ...baseStyles.dailyMealsTitle, color: '#80cbc4' }, 
    pickerLabel: { ...baseStyles.pickerLabel, color: '#e0e0e0'}, 
    pickerContainer: { ...baseStyles.pickerContainer, borderColor: '#555555', backgroundColor: '#3b3b3b'}, 
    picker: { ...baseStyles.picker, color: '#e0e0e0'}, 
    modalLabel: { ...baseStyles.modalLabel, color: '#e0e0e0' },
    cancelButton: { ...baseStyles.modalButton, backgroundColor: '#424242' }, 
    saveButton: { ...baseStyles.modalButton, backgroundColor: '#00796b' }, 
    modalButtonText: { ...baseStyles.modalButtonText, color: '#e0e0e0' }, 
    saveModalButtonText: { ...baseStyles.modalButtonText, color: '#e0f2f1' }, 
    modalSectionTitle: { ...baseStyles.modalSectionTitle, color: '#80cbc4' },
    suggestionChip: { ...baseStyles.suggestionChip, backgroundColor: '#2a2a2a', borderWidth: 1, borderColor: '#004d40' },
    suggestionChipText: { ...baseStyles.suggestionChipText, color: '#a7ffeb' },
    suggestionChipCalories: { ...baseStyles.suggestionChipCalories, color: '#80cbc4' },
    suggestionScrollArrowContainer: { ...baseStyles.suggestionScrollArrowContainer, backgroundColor: 'rgba(60, 60, 60, 0.85)' },
    suggestionScrollArrowText: { ...baseStyles.suggestionScrollArrowText, color: '#BBBBBB' },
    searchInput: { ...baseStyles.searchInput, borderColor: '#555', backgroundColor: '#3b3b3b', color: '#e0e0e0' }, 
    darkLoadingIndicator: { color: '#80cbc4' }, 
    loadingText: { ...baseStyles.loadingText, color: '#b0b0b0' }, 
    noResultsText: { ...baseStyles.noResultsText, color: '#888' }, 
    searchResultsList: { ...baseStyles.searchResultsList, borderColor: '#404040', backgroundColor: '#2c2c2c' }, 
    searchResultItem: { ...baseStyles.searchResultItem, borderBottomColor: '#3b3b3b' }, 
    searchResultImage: { ...baseStyles.searchResultImage, backgroundColor: '#424242' }, 
    searchResultName: { ...baseStyles.searchResultName, color: '#e0e0e0' }, 
    searchResultBrand: { ...baseStyles.searchResultBrand, color: '#a0a0a0' }, 
    searchResultMacros: { ...baseStyles.searchResultMacros, color: '#b0b0b0' },
});

export default FoodLogScreen;