// MonthlyCaloriesScreen.js (Fixed Layout & Infinite Scroll)

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View, // Changed from SafeAreaView
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity, 
  I18nManager, 
  ActivityIndicator, 
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// --- الثوابت ومصدر البيانات ---
const DAILY_STEPS_HISTORY_KEY = '@Steps:DailyHistory'; 
const CALORIES_PER_STEP = 0.04;
const STEPS_PER_MINUTE = 100;
const STEP_LENGTH_METERS = 0.762;

// --- كائن الترجمة (عربي وإنجليزي) ---
const translations = {
  ar: {
    headerTitle: "السعرات الشهرية",
    averageKcal: "متوسط (كالوري)",
    totalKcal: "الإجمالي (كالوري)",
    summaryTitle: "ملخص الشهر",
    calories: "السعرات",
    trends: "الاتجاهات",
    mostActiveTime: "اليوم الأكثر نشاطاً",
    steps: "خطوة",
    distanceUnit: "كم",
    timeUnit: "ساعات",
    loading: "جارِ تحميل البيانات...",
    noData: "لا توجد بيانات",
    trendHigh: "مرتفع",
    trendLow: "منخفض",
    trendStable: "مستقر",
    averageTooltip: "متوسط:",
  },
  en: {
    headerTitle: "Monthly Calories",
    averageKcal: "Average (Kcal)",
    totalKcal: "Total (Kcal)",
    summaryTitle: "Monthly Summary",
    calories: "Calories",
    trends: "Trends",
    mostActiveTime: "Most Active Day",
    steps: "Steps",
    distanceUnit: "km",
    timeUnit: "hours",
    loading: "Loading data...",
    noData: "No Data Available",
    trendHigh: "Trending Up",
    trendLow: "Trending Down",
    trendStable: "Stable",
    averageTooltip: "Avg:",
  },
};

// --- دوال مساعدة معتمدة على اللغة ---
const getDateString = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
const formatNumber = (num, lang) => {
    if (num === null || num === undefined) return '';
    const numStr = String(num);
    if (lang === 'ar') {
        const easternNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
        return numStr.replace(/[0-9.,]/g, (digit) => digit === ',' ? '،' : (digit === '.' ? '٫' : easternNumerals[parseInt(digit)]));
    }
    return numStr;
};
const formatHours = (totalMinutes, lang) => {
    if (isNaN(totalMinutes) || totalMinutes < 0) return formatNumber('0.0', lang);
    const hours = totalMinutes / 60;
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    return hours.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

// --- ألوان الوضع الفاتح والداكن ---
const lightTheme = {
    safeArea: '#F7FDF9', cardBackground: '#FFFFFF', headerText: '#2e7d32',
    mainText: '#388e3c', secondaryText: '#757575', inactiveBar: '#e0e0e0',
    activeBar: '#66bb6a', selectedBar: '#2E7D32', graphLine: '#eee',
    tooltipBg: '#333333', tooltipText: '#FFFFFF', separator: '#eee',
    icon: '#4caf50', iconCircleBg: '#e8f5e9', arrowColor: '#2e7d32',
    arrowDisabled: '#a5d6a7', detailValueColor: '#424242',
    calorieValueColor: '#388e3c',
};
const darkTheme = {
    safeArea: '#121212', cardBackground: '#1E1E1E', headerText: '#E0E0E0',
    mainText: '#80CBC4', secondaryText: '#A0A0A0', inactiveBar: '#3E5052',
    activeBar: '#00796B', selectedBar: '#A7FFEB', graphLine: '#333333',
    tooltipBg: '#E0E0E0', tooltipText: '#121212', separator: '#424242',
    icon: '#80CBC4', iconCircleBg: '#2C2C2C', arrowColor: '#E0E0E0',
    arrowDisabled: '#555555', detailValueColor: '#E0E0E0',
    calorieValueColor: '#80CBC4',
};

// --- المكونات الفرعية ---
const MonthlyChart = ({ aggregatedData, dateRange, total, average, styles, lang, onPrev, onNext, isNextDisabled, formatNumber, language }) => {
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);
    const MAX_CHART_VALUE = useMemo(() => Math.max(...aggregatedData.map(d => d.value), 400), [aggregatedData]);
    const yAxisLabels = useMemo(() => Array.from({ length: 5 }, (_, i) => formatNumber(Math.round(MAX_CHART_VALUE - i * (MAX_CHART_VALUE / 4)), language)), [MAX_CHART_VALUE, formatNumber, language]);
    const getBarHeight = useCallback((value) => `${Math.min((value / MAX_CHART_VALUE) * 100, 100)}%`, [MAX_CHART_VALUE]);
    const handleBarPress = (index) => setSelectedBarIndex(prev => prev === index ? null : index);
    
    const PrevMonthButton = () => (
        <TouchableOpacity onPress={onPrev}>
            <Icon name="chevron-back-outline" size={24} color={styles.arrowColor.color} />
        </TouchableOpacity>
    );

    const NextMonthButton = () => (
        <TouchableOpacity onPress={onNext} disabled={isNextDisabled}>
            <Icon name="chevron-forward-outline" size={24} color={isNextDisabled ? styles.arrowDisabled.color : styles.arrowColor.color} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.chartCard}>
            <View style={styles.dateNavigator}>
                {language === 'ar' ? (
                    <>
                        <NextMonthButton />
                        <Text style={styles.dateText}>{dateRange}</Text>
                        <PrevMonthButton />
                    </>
                ) : (
                    <>
                        <NextMonthButton />
                        <Text style={styles.dateText}>{dateRange}</Text>
                        <PrevMonthButton />
                    </>
                )}
            </View>
            <View style={styles.cardSeparator} />
            <View style={styles.summaryContainer}>
                <View style={styles.summaryBox}><Text style={styles.summaryValue}>{formatNumber(Math.round(average), language)}</Text><Text style={styles.summaryLabel}>{lang.averageKcal}</Text></View>
                <View style={styles.summaryBox}><Text style={styles.summaryValue}>{formatNumber(Math.round(total), language)}</Text><Text style={styles.summaryLabel}>{lang.totalKcal}</Text></View>
            </View>
             <View style={styles.graphContainer}>
                <View style={styles.yAxis}>{yAxisLabels.map((label, i) => <Text key={i} style={styles.yAxisLabel}>{label}</Text>)}</View>
                <Pressable style={styles.barsAreaWrapper} onPress={() => setSelectedBarIndex(null)}>
                    <View style={styles.barsArea} collapsable={false}>
                        <View style={styles.bars}>{aggregatedData.map((dataPoint, index) => { 
                            const height = getBarHeight(dataPoint.value); 
                            const isSelected = selectedBarIndex === index; 
                            const hasValue = dataPoint.value > 0; 
                            return ( 
                                <Pressable key={index} style={styles.barWrapper} onPress={() => handleBarPress(index)} disabled={!hasValue}>
                                    {isSelected && ( 
                                        <View style={[styles.tooltipPositioner, { bottom: height }]}>
                                            <View style={styles.tooltipContainer}><Text style={styles.tooltipValueText}>{`${lang.averageTooltip} ${formatNumber(Math.round(dataPoint.value), language)}`}</Text></View>
                                            <View style={styles.tooltipPointer} />
                                        </View> 
                                    )}
                                    <View style={[styles.bar, { height }, isSelected ? styles.selectedBar : (hasValue ? styles.activeBar : styles.inactiveBar)]} />
                                </Pressable> 
                            );
                        })}
                        </View>
                        <View style={styles.xAxis}>{aggregatedData.map((dataPoint, index) => <Text key={index} style={styles.xAxisLabel}>{formatNumber(dataPoint.label, language)}</Text>)}</View>
                    </View>
                </Pressable>
            </View>
        </View>
    );
};

// ... باقي المكونات الفرعية كما هي ...
const StatRow = ({label, value, styles, valueStyle}) => ( <View style={styles.summaryStatRow}><Text style={[styles.detailValueSmall, valueStyle]}>{value}</Text><Text style={styles.summaryStatLabel}>{label}</Text></View> );
const MetricBlock = ({iconName, value, unit, styles}) => ( <View style={styles.metricBlock}><View style={styles.metricIconCircle}><Icon name={iconName} size={24} color={styles.metricIconCircle.iconColor} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricUnit}>{unit}</Text></View> );
const ActivitySummary = ({ stats, styles, lang, theme, formatNumber, language }) => (
    <>
      <Text style={styles.summaryHeaderTitle}>{lang.summaryTitle}</Text>
      <View style={styles.detailsCard}>
          <StatRow label={lang.calories} value={formatNumber(Math.round(stats.totalCalories), language)} styles={styles} valueStyle={styles.calorieValue} />
          <View style={styles.divider} />
          <StatRow label={lang.trends} value={stats.trendText} styles={styles} valueStyle={{ color: theme.mainText, fontWeight: 'bold' }}/>
          <View style={styles.divider} />
          <StatRow label={lang.mostActiveTime} value={stats.mostActiveDayText} styles={styles} valueStyle={{ color: theme.mainText, fontWeight: 'bold' }} />
      </View>
      <View style={[styles.card, styles.metricsCard]}>
          <MetricBlock iconName="walk-outline" value={formatNumber(Math.round(stats.totalSteps), language)} unit={lang.steps} styles={styles} />
          <MetricBlock iconName="location-outline" value={formatNumber(stats.distance.toFixed(1), language)} unit={lang.distanceUnit} styles={styles} />
          <MetricBlock iconName="time-outline" value={stats.duration} unit={lang.timeUnit} styles={styles} />
      </View>
    </>
);

// --- المكون الرئيسي للصفحة (يقبل language و isDarkMode كـ props) ---
const MonthlyCaloriesScreen = ({ language = 'ar', isDarkMode = false }) => {
    
    const theme = useMemo(() => isDarkMode ? darkTheme : lightTheme, [isDarkMode]);
    const lang = useMemo(() => translations[language] || translations.ar, [language]);
    const styles = useMemo(() => getStyles(theme, language), [theme, language]);

    const [isLoading, setIsLoading] = useState(true);
    const [viewedMonth, setViewedMonth] = useState(new Date());
    const [statsForMonth, setStatsForMonth] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async (currentDate) => {
                setIsLoading(true);
                try {
                    const storedHistory = await AsyncStorage.getItem(DAILY_STEPS_HISTORY_KEY);
                    const stepsHistory = storedHistory ? JSON.parse(storedHistory) : {};
                    const today = new Date();
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();
                    
                    const getFullMonthData = (targetDate) => { 
                        const y = targetDate.getFullYear(); 
                        const m = targetDate.getMonth(); 
                        const daysInMonth = new Date(y, m + 1, 0).getDate(); 
                        return Array.from({ length: daysInMonth }).map((_, i) => { 
                            const dayDate = new Date(y, m, i + 1); 
                            const steps = stepsHistory[getDateString(dayDate)] || 0; 
                            return { date: dayDate, steps: steps }; 
                        }); 
                    };
                    
                    const fullMonthData = getFullMonthData(currentDate);
                    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
                    const dataForStats = isCurrentMonth ? fullMonthData.slice(0, today.getDate()) : fullMonthData;
                    const totalSteps = dataForStats.reduce((sum, day) => sum + day.steps, 0);
                    
                    const prevMonthDate = new Date(year, month - 1, 1);
                    const prevMonthFullData = getFullMonthData(prevMonthDate);
                    const totalStepsPrevMonth = prevMonthFullData.reduce((sum, day) => sum + day.steps, 0);
                    
                    let trendText = lang.noData;
                    if (totalStepsPrevMonth > 0) { const changePercent = (totalSteps - totalStepsPrevMonth) / totalStepsPrevMonth; if (changePercent > 0.1) trendText = lang.trendHigh; else if (changePercent < -0.1) trendText = lang.trendLow; else trendText = lang.trendStable; } 
                    else if (totalSteps > 0) { trendText = lang.trendHigh; }
                    
                    let mostActiveDayText = lang.noData;
                    const maxSteps = Math.max(...dataForStats.map(d => d.steps));
                    if (maxSteps > 0) { 
                        const mostActiveDayObject = dataForStats.find(d => d.steps === maxSteps); 
                        if (mostActiveDayObject) { 
                            const locale = language === 'ar' ? 'ar-EG' : 'en-US';
                            const options = { weekday: 'long', day: 'numeric', month: 'long' }; 
                            mostActiveDayText = mostActiveDayObject.date.toLocaleDateString(locale, options); 
                        } 
                    }
                    
                    const totalCalories = totalSteps * CALORIES_PER_STEP;
                    const activeDays = dataForStats.filter(day => day.steps > 0);
                    const averageCalories = activeDays.length > 0 ? totalCalories / activeDays.length : 0;
                    
                    const caloriesDataFullMonth = fullMonthData.map(d => ({...d, calories: d.steps * CALORIES_PER_STEP }));
                    const aggregatedChartData = []; const chunkSize = 5;
                    for (let i = 0; i < caloriesDataFullMonth.length; i += chunkSize) { 
                        const chunk = caloriesDataFullMonth.slice(i, i + chunkSize); 
                        const chunkLabel = (i + chunkSize <= caloriesDataFullMonth.length) ? (i + chunkSize).toString() : caloriesDataFullMonth.length.toString(); 
                        const activeDaysInChunk = chunk.filter(d => d.calories > 0); 
                        let avgCaloriesInChunk = 0; 
                        if (activeDaysInChunk.length > 0) { avgCaloriesInChunk = activeDaysInChunk.reduce((acc, day) => acc + day.calories, 0) / activeDaysInChunk.length; } 
                        aggregatedChartData.push({ label: chunkLabel, value: avgCaloriesInChunk }); 
                    }
                    
                    setStatsForMonth({ 
                        totalCalories, 
                        averageCalories, 
                        aggregatedChartData, 
                        totalSteps, 
                        distance: (totalSteps * STEP_LENGTH_METERS) / 1000, 
                        duration: formatHours(totalSteps / STEPS_PER_MINUTE, language), 
                        mostActiveDayText, 
                        trendText 
                    });
                } catch (error) { console.error("Failed to fetch data:", error); } 
                finally { setIsLoading(false); }
            };
            fetchData(viewedMonth);
        }, [viewedMonth, language, lang])
    );

    const handlePreviousMonth = () => setViewedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    const handleNextMonth = () => setViewedMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    
    const isNextMonthDisabled = useMemo(() => { 
        const now = new Date(); 
        return viewedMonth.getFullYear() === now.getFullYear() && viewedMonth.getMonth() === now.getMonth(); 
    }, [viewedMonth]);
    
    // --- تعديل تنسيق التاريخ هنا ---
    const formattedDateRange = useMemo(() => {
        const year = viewedMonth.getFullYear();
        const month = viewedMonth.getMonth();

        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);

        const locale = language === 'ar' ? 'ar-EG' : 'en-US';
        const options = { day: 'numeric', month: 'long' };

        const formattedStart = startDate.toLocaleDateString(locale, options);
        const formattedEnd = endDate.toLocaleDateString(locale, options);

        return `${formattedStart} - ${formattedEnd}`;
    }, [viewedMonth, language]);

    if (isLoading || !statsForMonth) { return <View style={styles.safeArea}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.mainText} /></View></View>; }
    
    return (
        <View style={styles.safeArea}>
             <View style={styles.headerContainer}>
                <Text style={styles.headerTitle}>{lang.headerTitle}</Text>
            </View>
            <ScrollView contentContainerStyle={styles.mainContainer} showsVerticalScrollIndicator={false}>
                <MonthlyChart 
                    aggregatedData={statsForMonth.aggregatedChartData} 
                    dateRange={formattedDateRange} 
                    total={statsForMonth.totalCalories} 
                    average={statsForMonth.averageCalories} 
                    styles={styles} 
                    lang={lang} 
                    onPrev={handlePreviousMonth} 
                    onNext={handleNextMonth} 
                    isNextDisabled={isNextMonthDisabled}
                    formatNumber={formatNumber}
                    language={language}
                />
                <ActivitySummary 
                    stats={statsForMonth} 
                    styles={styles} 
                    lang={lang} 
                    theme={theme}
                    formatNumber={formatNumber}
                    language={language}
                />
            </ScrollView>
        </View>
    );
};

// --- الأنماط الديناميكية (مع التعديل على dateNavigator) ---
const getStyles = (theme, language) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.safeArea },
    headerContainer: { paddingVertical: 15, paddingHorizontal: 20, alignItems: language === 'ar' ? 'flex-end' : 'flex-start' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: theme.headerText },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    mainContainer: { padding: 15, paddingBottom: 50 },
    card: { backgroundColor: theme.cardBackground, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 5, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    chartCard: { backgroundColor: theme.cardBackground, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2, overflow: 'hidden' },
    dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, paddingBottom: 10 },
    dateText: { fontSize: 18, fontWeight: 'bold', color: theme.headerText },
    arrowColor: { color: theme.arrowColor },
    arrowDisabled: { color: theme.arrowDisabled },
    cardSeparator: { height: 1, backgroundColor: theme.separator, marginHorizontal: 15 },
    summaryContainer: { flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-around', paddingVertical: 20 },
    summaryBox: { alignItems: 'center', flex:1 },
    summaryValue: { fontSize: 32, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    summaryLabel: { fontSize: 14, color: theme.secondaryText, marginTop: 4, textAlign:'center' },
    
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
    yAxisLabel: { fontSize: 11, color: theme.secondaryText },
    barsAreaWrapper: { flex: 1, marginHorizontal: language === 'ar' ? 5 : 0, marginLeft: language === 'ar' ? 0 : 5 },
    barsArea: { flex: 1, borderBottomWidth: 1, borderBottomColor: theme.graphLine, position: 'relative', marginBottom: 25 },
    bars: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingHorizontal: '2%' },
    barWrapper: { width: '14%', height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
    bar: { width: 12, borderTopLeftRadius: 6, borderTopRightRadius: 6 }, 
    inactiveBar: { backgroundColor: theme.inactiveBar, height: 2, minHeight: 2 },
    activeBar: { backgroundColor: theme.activeBar, minHeight: 2, }, 
    selectedBar: { backgroundColor: theme.selectedBar, minHeight: 2, },
    xAxis: { position: 'absolute', bottom: -25, left: 0, right: 0, height: 20, flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: '2%' },
    xAxisLabel: { fontSize: 11, color: theme.secondaryText, textAlign: 'center', flex:1, fontWeight: '500' },
    tooltipPositioner: { position: 'absolute', alignItems: 'center', zIndex: 10, marginBottom: 5, left: '50%', transform: [{ translateX: -45 }] },
    tooltipContainer: { backgroundColor: theme.tooltipBg, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, minWidth: 90, alignItems: 'center' },
    tooltipValueText: { color: theme.tooltipText, fontSize: 13, fontWeight: 'bold'},
    tooltipPointer: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.tooltipBg, marginTop: -1 },
    summaryHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: theme.headerText, marginBottom: 15, width: '100%', textAlign: language === 'ar' ? 'right' : 'left' },
    detailsCard: { backgroundColor: theme.cardBackground, borderRadius: 12, paddingVertical: 5, paddingHorizontal: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
    summaryStatRow: { flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, },
    summaryStatLabel: { fontSize: 14, color: theme.secondaryText, },
    detailValueSmall: { fontSize: 14, color: theme.detailValueColor, fontWeight: '500', textAlign: language === 'ar' ? 'left' : 'right', },
    calorieValue: { color: theme.calorieValueColor, fontWeight: 'bold', fontSize: 16, },
    divider: { height: 1, backgroundColor: theme.separator, marginHorizontal: -20, },
    metricsCard: { flexDirection: language === 'ar' ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 15, },
    metricBlock: { alignItems: 'center', flex: 1 },
    metricIconCircle: { backgroundColor: theme.iconCircleBg, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10, iconColor: theme.icon },
    metricValue: { fontSize: 22, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    metricUnit: { fontSize: 14, color: theme.secondaryText, marginTop: 2 },
});

export default MonthlyCaloriesScreen;