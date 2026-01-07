// WeeklyCaloriesScreen.js (نسخة قابلة للتحكم عبر Props مع سلوك الأسهم المطلوب وإصلاح المشكلة الرسومية)
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, // تم التغيير من SafeAreaView
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity, 
  I18nManager, 
  ActivityIndicator, 
  Pressable
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// --- الثوابت المشتركة ---
const DAILY_STEPS_HISTORY_KEY = '@Steps:DailyHistory';
const CALORIES_PER_STEP = 0.04;
const STEP_LENGTH_METERS = 0.762;
const STEPS_PER_MINUTE = 100;

// --- كائن الترجمة (عربي وإنجليزي) ---
const translations = {
    ar: {
        headerTitle: "السعرات الأسبوعية",
        dayNamesShort: ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'],
        averageKcal: "متوسط (كالوري)",
        totalKcal: "الإجمالي (كالوري)",
        summaryTitle: "ملخص الأسبوع",
        calories: "السعرات الحرارية",
        trends: "الاتجاهات",
        mostActiveDay: "اليوم الأكثر نشاطاً", 
        steps: "خطوة",
        distanceUnit: "كم",
        timeUnit: "ساعات",
        loading: "جارِ تحميل البيانات...",
        noData: "لا توجد بيانات",
        trendUp: 'مرتفع',
        trendDown: 'منخفض',
        trendStable: 'مستقر',
    },
    en: {
        headerTitle: "Weekly Calories",
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
        averageKcal: "Average (Kcal)",
        totalKcal: "Total (Kcal)",
        summaryTitle: "Weekly Summary",
        calories: "Calories",
        trends: "Trends",
        mostActiveDay: "Most Active Day",
        steps: "Steps",
        distanceUnit: "km",
        timeUnit: "hours",
        loading: "Loading data...",
        noData: "No Data Available",
        trendUp: 'Trending Up',
        trendDown: 'Trending Down',
        trendStable: 'Stable',
    }
};

// --- دوال مساعدة معتمدة على اللغة ---
const getDateString = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
const addDays = (date, days) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
const formatNumber = (num, lang) => {
    if (num === null || num === undefined) return '';
    const numStr = String(num);
    if (lang === 'ar') {
        const easternNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return numStr.replace(/[0-9.,]/g, (digit) => digit === ',' ? '،' : (digit === '.' ? '٫' : easternNumerals[parseInt(digit)]));
    }
    return numStr;
};
const formatDuration = (totalMinutes, lang) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return formatNumber('0:00', lang);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const formattedString = `${hours}:${minutes.toString().padStart(2, '0')}`;
    return formatNumber(formattedString, lang);
};
const getStartOfWeek = (date, lang) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const startDay = lang === 'ar' ? 6 : 0;
    const diff = (day - startDay + 7) % 7;
    d.setDate(d.getDate() - diff);
    return d;
};


// --- ألوان الوضع الفاتح والداكن ---
const lightTheme = { safeArea: '#F7FDF9', cardBackground: '#FFFFFF', headerText: '#2e7d32', mainText: '#388e3c', secondaryText: '#757575', activeBar: '#81c784', todayBar: '#4caf50', selectedBar: '#2E7D32', todayText: '#000000', graphLine: '#eee', tooltipBg: '#333333', tooltipText: '#FFFFFF', separator: '#eee', icon: '#4caf50', iconCircleBg: 'rgba(76, 175, 80, 0.1)', arrowColor: '#2e7d32', arrowDisabled: '#a5d6a7' };
const darkTheme = { safeArea: '#121212', cardBackground: '#1E1E1E', headerText: '#E0E0E0', mainText: '#80CBC4', secondaryText: '#A0A0A0', activeBar: '#00796B', todayBar: '#80CBC4', selectedBar: '#A7FFEB', todayText: '#FFFFFF', graphLine: '#333333', tooltipBg: '#E0E0E0', tooltipText: '#121212', separator: '#424242', icon: '#80CBC4', iconCircleBg: 'rgba(128, 203, 196, 0.1)', arrowColor: '#E0E0E0', arrowDisabled: '#555555' };

// --- مكون الرسم البياني مع سلوك الأسهم المطلوب ---
const WeeklyChart = ({ weeklyData, dateRange, styles, lang, onPrev, onNext, isNextDisabled, formatNumber, language }) => {
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);
    const today = new Date();
    const { yAxisLabels, yAxisMax } = useMemo(() => { const maxCalorie = Math.max(...weeklyData.map(d => d.calories), 200); const yMax = Math.ceil(maxCalorie / 100) * 100; const labels = []; for (let i = yMax; i >= 0; i -= (yMax / 4 || 50)) { labels.push(Math.round(i).toString()); } return { yAxisLabels: labels.map(l => formatNumber(l, language)), yAxisMax: yMax }; }, [weeklyData, formatNumber, language]);
    const getBarHeight = useCallback((value) => `${Math.min((value / (yAxisMax || 1)) * 100, 100)}%`, [yAxisMax]);
    const handleBarPress = (index) => setSelectedBarIndex(prev => prev === index ? null : index);
    const handleDismissTooltip = () => setSelectedBarIndex(null);
    const totalCalories = weeklyData.reduce((sum, day) => sum + day.calories, 0);
    const activeDays = weeklyData.filter(d => d.calories > 0).length;
    const avgCalories = activeDays > 0 ? totalCalories / activeDays : 0;
    
    return (
        <View style={styles.chartCard}>
             {/* خاصية flexDirection في هذا النمط ستتحكم بالترتيب تلقائياً */}
            <View style={styles.dateNavigator}>
                {/* هذا الزر دائمًا ينتقل للأسبوع التالي (أقرب لليوم) ويستخدم أيقونة السهم الأيسر */}
                <TouchableOpacity onPress={onNext} disabled={isNextDisabled}>
                    <Icon name="chevron-back-outline" size={24} color={isNextDisabled ? styles.arrowDisabled.color : styles.arrowColor.color} />
                </TouchableOpacity>

                <Text style={styles.dateText}>{dateRange}</Text>

                {/* هذا الزر دائمًا يرجع للأسبوع السابق ويستخدم أيقونة السهم الأيمن */}
                <TouchableOpacity onPress={onPrev}>
                    <Icon name="chevron-forward-outline" size={24} color={styles.arrowColor.color} />
                </TouchableOpacity>
            </View>
            <View style={styles.summaryContainer}>
                <View style={styles.summaryBox}><Text style={styles.summaryValue}>{formatNumber(Math.round(avgCalories), language)}</Text><Text style={styles.summaryLabel}>{lang.averageKcal}</Text></View>
                <View style={styles.summaryBox}><Text style={styles.summaryValue}>{formatNumber(Math.round(totalCalories), language)}</Text><Text style={styles.summaryLabel}>{lang.totalKcal}</Text></View>
            </View>
            <Pressable style={styles.graphContainer} onPress={handleDismissTooltip}>
                <View style={styles.yAxis}>{yAxisLabels.map((label, index) => <Text key={`y-${index}`} style={styles.yAxisLabel}>{label}</Text>)}</View>
                <View style={styles.barsAreaWrapper}>
                    <View style={styles.barsArea} collapsable={false}>
                        <View style={styles.bars}>
                            {weeklyData.map((item, index) => { 
                                const height = getBarHeight(item.calories); 
                                const isSelected = selectedBarIndex === index; 
                                const isTodayBar = isSameDay(item.date, today);
                                const barStyle = [styles.bar, { height }, isSelected ? styles.selectedBar : (isTodayBar ? styles.todayBar : styles.activeBar)];
                                return (
                                    <Pressable key={item.date.toISOString()} style={styles.barWrapper} onPress={() => handleBarPress(index)}>
                                        {isSelected && item.calories > 0 && (<View style={[styles.tooltipPositioner, { bottom: height }]}><View style={styles.tooltipContainer}><Text style={styles.tooltipText}>{formatNumber(Math.round(item.calories), language)}</Text></View><View style={styles.tooltipPointer} /></View>)}
                                        <View style={barStyle} />
                                    </Pressable>
                                );
                            })}
                        </View>
                        <View style={styles.xAxis}>{weeklyData.map((item, index) => { const isTodayLabel = isSameDay(item.date, today); return (<Text key={item.date.toISOString()} style={[styles.xAxisLabel, isTodayLabel && styles.todayXAxisLabel]}>{lang.dayNamesShort[index]}</Text>); })}</View>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};

// --- باقي المكونات (بدون تغيير) ---
const StatRow = ({label, value, styles}) => ( <View style={styles.summaryStatRow}><Text style={styles.summaryStatValue}>{value}</Text><Text style={styles.summaryStatLabel}>{label}</Text></View> );
const MetricBlock = ({iconName, value, unit, styles}) => ( <View style={styles.metricBlock}><View style={styles.metricIconCircle}><Icon name={iconName} size={28} color={styles.metricIconCircle.iconColor} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricUnit}>{unit}</Text></View> );
const ActivitySummary = ({ stats, styles, lang, formatNumber, language }) => {
    return (
    <>
      <Text style={styles.summaryHeaderTitle}>{lang.summaryTitle}</Text>
      <View style={styles.summaryMainCard}>
        <StatRow label={lang.calories} value={formatNumber(Math.round(stats.totalCalories), language)} styles={styles}/>
        <View style={styles.divider} />
        <StatRow label={lang.trends} value={stats.trend} styles={styles} />
        <View style={styles.divider} />
        <StatRow label={lang.mostActiveDay} value={stats.mostActiveDay || lang.noData} styles={styles}/>
      </View>
      <View style={styles.metricsCard}>
        <MetricBlock iconName="walk" value={formatNumber(Math.round(stats.totalSteps), language)} unit={lang.steps} styles={styles}/>
        <MetricBlock iconName="location" value={formatNumber(stats.totalDistance.toFixed(1), language)} unit={lang.distanceUnit} styles={styles}/>
        <MetricBlock iconName="time" value={stats.totalDuration} unit={lang.timeUnit} styles={styles}/>
      </View>
    </>);
};
const WeeklyCaloriesScreen = ({ language = 'ar', isDarkMode = false }) => {
    const theme = useMemo(() => isDarkMode ? darkTheme : lightTheme, [isDarkMode]);
    const lang = useMemo(() => translations[language] || translations.ar, [language]);
    const styles = useMemo(() => getStyles(theme, language), [theme, language]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewedDate, setViewedDate] = useState(new Date()); 
    const [weeklyData, setWeeklyData] = useState([]);
    const [stats, setStats] = useState(null);
    useFocusEffect(
        useCallback(() => {
            const fetchDataForWeek = async (currentDate) => {
                setIsLoading(true);
                try {
                    const storedStepsHistory = await AsyncStorage.getItem(DAILY_STEPS_HISTORY_KEY);
                    const stepsHistory = storedStepsHistory ? JSON.parse(storedStepsHistory) : {};
                    const currentWeekStart = getStartOfWeek(currentDate, language);
                    const today = new Date();
                    const currentWeekDates = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));
                    const currentWeekData = currentWeekDates.map(date => {
                        const steps = (date > today) ? 0 : (stepsHistory[getDateString(date)] || 0);
                        return { date, steps, calories: steps * CALORIES_PER_STEP };
                    });
                    setWeeklyData(currentWeekData);
                    const previousWeekStart = addDays(currentWeekStart, -7);
                    const previousWeekDates = Array.from({ length: 7 }).map((_, i) => addDays(previousWeekStart, i));
                    const getStepsForDates = (dates) => dates.reduce((sum, date) => sum + (stepsHistory[getDateString(date)] || 0), 0);
                    const currentWeekTotalSteps = getStepsForDates(currentWeekDates);
                    const previousWeekTotalSteps = getStepsForDates(previousWeekDates);
                    let trend = lang.trendStable; 
                    if (previousWeekTotalSteps > 0) { const changePercent = (currentWeekTotalSteps - previousWeekTotalSteps) / previousWeekTotalSteps; if (changePercent > 0.1) trend = lang.trendUp; else if (changePercent < -0.1) trend = lang.trendDown; } 
                    else if (currentWeekTotalSteps > 0) { trend = lang.trendUp; }
                    let mostActiveDay = lang.noData;
                    const maxSteps = Math.max(...currentWeekData.map(d => d.steps));
                    if (maxSteps > 0) {
                        const mostActiveDayObject = currentWeekData.find(d => d.steps === maxSteps);
                        if (mostActiveDayObject) {
                            const locale = language === 'ar' ? 'ar-EG' : 'en-US';
                            mostActiveDay = mostActiveDayObject.date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
                        }
                    }
                    setStats({
                        totalCalories: currentWeekTotalSteps * CALORIES_PER_STEP,
                        totalSteps: currentWeekTotalSteps,
                        totalDistance: (currentWeekTotalSteps * STEP_LENGTH_METERS) / 1000,
                        totalDuration: formatDuration(currentWeekTotalSteps / STEPS_PER_MINUTE, language),
                        trend: trend,
                        mostActiveDay: mostActiveDay,
                    });
                } catch (error) { console.error("Failed to fetch weekly data:", error); } 
                finally { setIsLoading(false); }
            };
            fetchDataForWeek(viewedDate);
        }, [viewedDate, language, lang])
    );
    const handlePreviousWeek = () => { setViewedDate(prevDate => addDays(prevDate, -7)); };
    const handleNextWeek = () => { setViewedDate(prevDate => addDays(prevDate, 7)); };
    const isNextWeekDisabled = useMemo(() => { const currentWeekStart = getStartOfWeek(new Date(), language); const viewedWeekStart = getStartOfWeek(viewedDate, language); return viewedWeekStart.getTime() >= currentWeekStart.getTime(); }, [viewedDate, language]);
    const dateRange = useMemo(() => { if (weeklyData.length < 7) return ''; const locale = language === 'ar' ? 'ar-EG' : 'en-US'; const options = { month: 'long', day: 'numeric' }; const startDate = weeklyData[0].date; const endDate = weeklyData[6].date; const formattedStart = startDate.toLocaleDateString(locale, options); const formattedEnd = endDate.toLocaleDateString(locale, options); return `${formatNumber(formattedStart, language)} - ${formatNumber(formattedEnd, language)}`; }, [weeklyData, language]);
    return (
        <View style={styles.safeArea}>
             <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>{lang.headerTitle}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.mainContainer} showsVerticalScrollIndicator={false}>
            {isLoading ? ( <View style={[styles.centerSpinner, {height: 400}]}><ActivityIndicator size="large" color={theme.mainText} /></View> ) 
             : stats && weeklyData.length > 0 ? (
                <>
                    <WeeklyChart weeklyData={weeklyData} dateRange={dateRange} styles={styles} lang={lang} onPrev={handlePreviousWeek} onNext={handleNextWeek} isNextDisabled={isNextWeekDisabled} formatNumber={formatNumber} language={language}/>
                    <ActivitySummary stats={stats} styles={styles} lang={lang} formatNumber={formatNumber} language={language}/>
                </>
            ) : ( <View style={styles.centerSpinner}><Text style={styles.loadingText}>{lang.noData}</Text></View> )}
            </ScrollView>
        </View>
    );
};

// --- الأنماط الديناميكية (مع التعديل على dateNavigator) ---
const getStyles = (theme, language) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.safeArea },
    headerContainer: { paddingVertical: 15, paddingHorizontal: 20, alignItems: language === 'ar' ? 'flex-end' : 'flex-start' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.headerText },
    mainContainer: { padding: 15, paddingBottom: 50, flexGrow: 1 },
    centerSpinner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: theme.secondaryText, marginTop: 10 },
    chartCard: { backgroundColor: theme.cardBackground, borderRadius: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
    dateNavigator: {
        // هذا هو الجزء الأهم. الترتيب سيتغير تلقائيًا بناءً على اللغة
        flexDirection: language === 'ar' ? 'row-reverse' : 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 15
    },
    dateText: { fontSize: 18, fontWeight: '600', color: theme.headerText, marginHorizontal: 10, flexShrink: 1, textAlign: 'center' },
    summaryContainer: { flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-around', paddingVertical: 20 },
    summaryBox: { alignItems: 'center', flex: 1 },
    summaryValue: { fontSize: 32, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    summaryLabel: { fontSize: 14, color: theme.secondaryText, marginTop: 4, textAlign: 'center' },
    
    // --- FIX IS HERE: FIXED HEIGHT ADDED ---
    graphContainer: { 
        flexDirection: language === 'ar' ? 'row-reverse' : 'row', 
        paddingHorizontal: 15, 
        paddingTop: 10, 
        paddingBottom: 10, 
        height: 300, // <--- FIXED HEIGHT
        alignItems: 'stretch'
    },
    
    yAxis: { width: 35, justifyContent: 'space-between', paddingLeft: language === 'ar' ? 8 : 0, paddingRight: language === 'ar' ? 0 : 8, height: '100%', paddingBottom: 25, alignItems: language === 'ar' ? 'flex-start' : 'flex-end' },
    yAxisLabel: { fontSize: 11, color: theme.secondaryText, fontVariant: ['tabular-nums'] },
    barsAreaWrapper: { flex: 1, marginHorizontal: 5 },
    barsArea: { flex: 1, borderBottomWidth: 1, borderBottomColor: theme.graphLine, position: 'relative', marginBottom: 25 },
    bars: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
    barWrapper: { width: `${100 / 7}%`, height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
    bar: { width: 18, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
    activeBar: { backgroundColor: theme.activeBar }, 
    todayBar: { backgroundColor: theme.todayBar },
    selectedBar: { backgroundColor: theme.selectedBar },
    xAxis: { position: 'absolute', bottom: -25, left: 0, right: 0, height: 20, flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'center' },
    xAxisLabel: { fontSize: 12, color: theme.secondaryText, textAlign: 'center', flex: 1 },
    todayXAxisLabel: { color: theme.todayText, fontWeight: 'bold' },
    tooltipPositioner: { position: 'absolute', alignItems: 'center', zIndex: 10, marginBottom: 5, left: '50%', transform: [{ translateX: -30 }] },
    tooltipContainer: { backgroundColor: theme.tooltipBg, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, minWidth: 60, alignItems: 'center' },
    tooltipText: { color: theme.tooltipText, fontSize: 12, fontWeight: 'bold' },
    tooltipPointer: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.tooltipBg, marginTop: -1 },
    summaryHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: theme.headerText, marginBottom: 15, width: '100%', textAlign: language === 'ar' ? 'right' : 'left' },
    summaryMainCard: { backgroundColor: theme.cardBackground, borderRadius: 15, padding: 20, width: '100%', marginBottom: 20 },
    summaryStatRow: { flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    summaryStatLabel: { fontSize: 16, color: theme.secondaryText },
    summaryStatValue: { fontSize: 18, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    divider: { height: 1, backgroundColor: theme.separator, marginVertical: 15 },
    metricsCard: { backgroundColor: theme.cardBackground, borderRadius: 15, paddingVertical: 20, width: '100%', flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'center' },
    metricBlock: { alignItems: 'center', flex: 1 },
    metricIconCircle: { backgroundColor: theme.iconCircleBg, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12, iconColor: theme.icon },
    metricValue: { fontSize: 22, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    metricUnit: { fontSize: 14, color: theme.secondaryText, marginTop: 2 },
    arrowColor: {color: theme.arrowColor},
    arrowDisabled: {color: theme.arrowDisabled},
});

export default WeeklyCaloriesScreen;