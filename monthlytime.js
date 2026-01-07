// MonthlyTime.js (Fixed Layout & Infinite Scroll)

import React, { useState, useMemo, useCallback } from 'react';
import {
  View, // Changed from SafeAreaView
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  I18nManager,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

// =================================================================
// START: Translations and Theming
// =================================================================
const translations = {
    ar: {
        totalLabel: "الإجمالي (ساعات)",
        avgLabel: "متوسط يومي (دقيقة)",
        summaryTitle: "ملخص الشهر",
        caloriesLabel: "السعرات",
        trendLabel: "الاتجاهات",
        mostActiveLabel: "اليوم الأكثر نشاطاً",
        stepsUnit: "خطوة",
        kmUnit: "كم",
        hoursUnit: "ساعات",
        trendHigh: "مرتفع",
        trendLow: "منخفض",
        trendStable: "مستقر",
        loading: "جار التحميل...",
    },
    en: {
        totalLabel: "Total (hours)",
        avgLabel: "Daily Avg (min)",
        summaryTitle: "Monthly Summary",
        caloriesLabel: "Calories",
        trendLabel: "Trend",
        mostActiveLabel: "Most Active Day",
        stepsUnit: "Steps",
        kmUnit: "Km",
        hoursUnit: "Hours",
        trendHigh: "High",
        trendLow: "Low",
        trendStable: "Stable",
        loading: "Loading...",
    }
};

const lightTheme = {
    safeArea: '#F7FDF9', cardBackground: '#FFFFFF', headerTitle: '#2e7d32', mainText: '#388e3c', secondaryText: '#757575', inactiveBar: '#E0E0E0', activeBar: '#66bb6a', achievedBar: '#a5d6a7', selectedBar: '#2E7D32', graphLine: '#eee', tooltipBg: '#333333', tooltipText: '#FFFFFF', shadowColor: '#000', separator: '#eee', icon: '#4caf50', 
    iconCircleBg: 'rgba(76, 175, 80, 0.1)', 
    badgeBg: '#e0f2f1', badgeText: '#4caf50', chevron: '#bdbdbd',
    disabledChevron: '#e0e0e0',
};
const darkTheme = {
    safeArea: '#121212', cardBackground: '#1E1E1E', headerTitle: '#E0E0E0', mainText: '#80CBC4', secondaryText: '#A0A0A0', inactiveBar: '#424242', activeBar: '#00796B', achievedBar: '#004D40', selectedBar: '#A7FFEB', graphLine: '#333333', tooltipBg: '#E0E0E0', tooltipText: '#121212', shadowColor: '#000', separator: '#424242', icon: '#80CBC4', 
    iconCircleBg: 'rgba(128, 203, 196, 0.1)', 
    badgeBg: '#333333', badgeText: '#80CBC4', chevron: '#A0A0A0',
    disabledChevron: '#424242',
};
// =================================================================
// END: Translations and Theming
// =================================================================

// --- Helper Functions & Constants ---
const DAILY_TIME_HISTORY_KEY = '@Time:DailyHistory'; 
const STEPS_PER_MINUTE = 100;
const getDateString = (date) => new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10);
const addDays = (date, days) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
const addMonths = (date, months) => { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; };
const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const getEndOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

// Sub-Components
const MonthlyChart = ({ styles, onNextMonth, onPrevMonth, isNextButtonDisabled, dateRangeDisplay, totalHours, avgHours, weeklyAggregates, translation, locale, language }) => {
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);
    const MAX_WEEKLY_VALUE = useMemo(() => Math.max(2500, ...weeklyAggregates.map(w => w.value)), [weeklyAggregates]);
    const yAxisLabels = useMemo(() => Array.from({ length: 6 }, (_, i) => Math.round(MAX_WEEKLY_VALUE - (MAX_WEEKLY_VALUE / 5) * i).toLocaleString(locale)), [MAX_WEEKLY_VALUE, locale]);
    const getBarHeight = useCallback((value) => `${Math.min((value / MAX_WEEKLY_VALUE) * 100, 100)}%`, [MAX_WEEKLY_VALUE]);
    const handleBarPress = (index) => setSelectedBarIndex(prev => prev === index ? null : index);
    const handleDismissTooltip = () => setSelectedBarIndex(null);

    const GoBackButton = (
        <TouchableOpacity onPress={onPrevMonth}>
            <Icon name="chevron-forward-outline" size={24} color={styles.chevron.color} />
        </TouchableOpacity>
    );

    const GoForwardButton = (
        <TouchableOpacity onPress={onNextMonth} disabled={isNextButtonDisabled} activeOpacity={0.7}>
            <Icon name="chevron-back-outline" size={24} color={isNextButtonDisabled ? styles.disabledChevron.color : styles.chevron.color} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.chartCard}>
            <View>
                <View style={styles.dateNavigator}>
                  { language === 'ar' ? GoForwardButton : GoBackButton }
                  <Text style={styles.dateText}>{dateRangeDisplay}</Text>
                  { language === 'ar' ? GoBackButton : GoForwardButton }
                </View>
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBox}><Text style={styles.summaryValue}>{avgHours}</Text><Text style={styles.summaryLabel}>{translation.avgLabel}</Text></View>
                    <View style={styles.summaryBox}><Text style={styles.summaryValue}>{totalHours}</Text><Text style={styles.summaryLabel}>{translation.totalLabel}</Text></View>
                </View>
            </View>
            <Pressable style={styles.graphContainer} onPress={handleDismissTooltip}>
                <View style={styles.yAxis}>{yAxisLabels.map((label, index) => <Text key={`y-${index}`} style={styles.yAxisLabel}>{label}</Text>)}</View>
                <View style={styles.barsAreaWrapper}>
                    <View style={styles.barsArea} collapsable={false}>
                        <View style={styles.bars}>{weeklyAggregates.map((item, index) => { const height = getBarHeight(item.value); const isSelected = selectedBarIndex === index; const getBarDynamicStyle = () => { if (isSelected) return styles.selectedBar; if (item.status === 'current') return styles.activeBar; if (item.status === 'past') return styles.achievedBar; return styles.inactiveBar; }; return ( <Pressable key={index} style={styles.barWrapper} onPress={() => handleBarPress(index)}> {isSelected && item.status !== 'future' && (<View style={[styles.tooltipPositioner, { bottom: height }]}><View style={styles.tooltipContainer}><Text style={styles.tooltipText}>{item.value.toLocaleString(locale)}</Text></View><View style={styles.tooltipPointer} /></View>)} <View style={[styles.bar, getBarDynamicStyle(), { height }]} /> </Pressable> ); })}</View>
                        <View style={styles.xAxis}>{weeklyAggregates.map((item, index) => (<View key={index} style={styles.xAxisLabelWrapper}><Text style={styles.xAxisLabel}>{item.label}</Text></View>))}</View>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};
const ActivitySummary = ({ styles, stats, translation }) => {
    return (
      <>
        <Text style={styles.summaryHeaderTitle}>{translation.summaryTitle}</Text>
        <View style={styles.summaryMainCard}>
            <StatRow label={translation.caloriesLabel} value={stats.totalCalories} styles={styles}/>
            <View style={styles.divider} />
            <StatRow label={translation.trendLabel} value={stats.trend} styles={styles}/>
            <View style={styles.divider} />
            <StatRow label={translation.mostActiveLabel} value={stats.mostActiveDay} styles={styles}/>
        </View>
        <View style={styles.metricsCard}>
            <MetricBlock iconName="walk" value={stats.totalSteps} unit={translation.stepsUnit} styles={styles}/>
            <MetricBlock iconName="location" value={stats.totalKm} unit={translation.kmUnit} styles={styles}/>
            <MetricBlock iconName="time-outline" value={stats.totalHours} unit={translation.hoursUnit} styles={styles}/>
        </View>
      </>
    );
};
const StatRow = ({label, value, styles}) => ( <View style={styles.summaryStatRow}><Text style={styles.summaryStatValue}>{value}</Text><Text style={styles.summaryStatLabel}>{label}</Text></View> );
const MetricBlock = ({iconName, value, unit, styles}) => ( 
    <View style={styles.metricBlock}>
        <View style={styles.metricIconCircle}>
            <Icon name={iconName} size={28} color={styles.metricIconCircle.iconColor} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
    </View> 
);

// Main Component
const MonthlyTime = ({ language, isDarkMode }) => {
    const translation = useMemo(() => translations[language] || translations.en, [language]);
    const theme = useMemo(() => isDarkMode ? darkTheme : lightTheme, [isDarkMode]);
    const styles = useMemo(() => getStyles(theme, language === 'ar'), [theme, language]);
    const locale = useMemo(() => language === 'ar' ? 'ar-EG' : 'en-US', [language]);
    
    const [currentDate, setCurrentDate] = useState(new Date());
    const [timeHistory, setTimeHistory] = useState(null); 

    useFocusEffect(
      useCallback(() => {
        const loadTimeHistory = async () => {
          try {
            const storedHistory = await AsyncStorage.getItem(DAILY_TIME_HISTORY_KEY);
            setTimeHistory(storedHistory ? JSON.parse(storedHistory) : {});
          } catch (e) {
            console.error("Failed to load time history", e);
            setTimeHistory({});
          }
        };
        
        loadTimeHistory();
      }, [])
    );

    const memoizedData = useMemo(() => {
        if (timeHistory === null) return null;

        const today = new Date();
        const startOfMonth = getStartOfMonth(currentDate);
        const endOfMonth = getEndOfMonth(currentDate);
        const monthDaysCount = endOfMonth.getDate();
        const isCurrentMonth = startOfMonth.getFullYear() === today.getFullYear() && startOfMonth.getMonth() === today.getMonth();
        const todayIndex = isCurrentMonth ? today.getDate() - 1 : -1;
        const monthDataInMinutes = Array.from({ length: monthDaysCount }, (_, i) => { const dayDate = addDays(startOfMonth, i); const dateString = getDateString(dayDate); const dayMinutes = timeHistory[dateString] || 0; return typeof dayMinutes === 'number' ? dayMinutes : 0; });
        const weeklyAggregates = [];
        for (let i = 0; i < monthDaysCount; i += 7) { const startPeriod = i; const endPeriod = Math.min(i + 7, monthDaysCount); const periodValues = monthDataInMinutes.slice(startPeriod, endPeriod); const total = periodValues.reduce((sum, val) => sum + val, 0); let status = 'future'; if (isCurrentMonth) { if (todayIndex >= endPeriod - 1) status = 'past'; else if (todayIndex >= startPeriod) status = 'current'; } else { status = 'past'; } const isLastBar = (startPeriod + 7) >= monthDaysCount; const startDayNumber = startPeriod + 1; const label = isLastBar ? monthDaysCount.toLocaleString(locale) : startDayNumber.toLocaleString(locale); weeklyAggregates.push({ label, value: total, status }); }
        const dataForStats = isCurrentMonth ? monthDataInMinutes.slice(0, todayIndex + 1) : monthDataInMinutes;
        const totalMinutes = dataForStats.reduce((sum, val) => sum + val, 0);
        const activeDays = dataForStats.filter(v => v > 0).length || 1;
        const totalHours = parseFloat((totalMinutes / 60).toFixed(1)).toLocaleString(locale, {minimumFractionDigits: 1, maximumFractionDigits: 1});
        const avgMinutes = Math.round(totalMinutes / activeDays).toLocaleString(locale);
        const totalSteps = Math.round(totalMinutes * STEPS_PER_MINUTE).toLocaleString(locale);
        const totalCalories = Math.round(totalMinutes * STEPS_PER_MINUTE * 0.04).toLocaleString(locale);
        const totalKm = parseFloat(((totalMinutes * STEPS_PER_MINUTE * 0.762) / 1000).toFixed(2)).toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        const prevMonthDate = addMonths(startOfMonth, -1);
        const prevMonthStart = getStartOfMonth(prevMonthDate);
        const prevMonthEnd = getEndOfMonth(prevMonthDate);
        let prevMonthTotalMinutes = 0;
        for (let d = new Date(prevMonthStart); d <= prevMonthEnd; d.setDate(d.getDate() + 1)) { const dayMinutes = timeHistory[getDateString(d)] || 0; if (typeof dayMinutes === 'number') { prevMonthTotalMinutes += dayMinutes; } }
        let trend = '-';
        if (prevMonthTotalMinutes > 0) { const changePercent = (totalMinutes - prevMonthTotalMinutes) / prevMonthTotalMinutes; if (changePercent > 0.1) trend = translation.trendHigh; else if (changePercent < -0.1) trend = translation.trendLow; else trend = translation.trendStable; } 
        else if (totalMinutes > 0) { trend = translation.trendHigh; }
        const maxTotalMinutes = Math.max(...monthDataInMinutes);
        let mostActiveDay = '-';
        if (maxTotalMinutes > 0) { const mostActiveDayIndex = monthDataInMinutes.indexOf(maxTotalMinutes); const mostActiveDate = addDays(startOfMonth, mostActiveDayIndex); mostActiveDay = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(mostActiveDate); }
        
        // ======================= التاريخ =======================
        const dateDisplayFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long'});
        const dateDisplay = `${dateDisplayFormat.format(startOfMonth)} - ${dateDisplayFormat.format(endOfMonth)}`;
        
        const isNextButtonDisabled = isCurrentMonth;

        return { dateRangeDisplay: dateDisplay, totalHours, avgHours: avgMinutes, weeklyAggregates, isNextButtonDisabled, stats: { totalCalories, trend, mostActiveDay, totalSteps, totalKm, totalHours }, };
    }, [currentDate, timeHistory, locale, translation]);

    const handlePreviousMonth = () => setCurrentDate(d => addMonths(d, -1));
    const handleNextMonth = useCallback(() => { setCurrentDate(d => { const nextMonth = addMonths(d, 1); return nextMonth > new Date() ? d : nextMonth; }); }, []);
    
    if (!memoizedData) { return ( <View style={styles.safeArea}><View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={theme.mainText} /></View></View> ); }

    return ( 
        <View style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.mainContainer}>
                <MonthlyChart 
                    styles={styles} 
                    {...memoizedData} 
                    onNextMonth={handleNextMonth} 
                    onPrevMonth={handlePreviousMonth}
                    translation={translation}
                    locale={locale} 
                    language={language}
                />
                <ActivitySummary 
                    styles={styles} 
                    stats={memoizedData.stats}
                    translation={translation} 
                />
            </ScrollView>
        </View> 
    );
};

// ... (Stylesheets)
const getStyles = (theme, isRTL) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.safeArea },
    mainContainer: { padding: 15, paddingBottom: 50 },
    chartCard: { backgroundColor: theme.cardBackground, borderRadius: 20, marginBottom: 20, shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
    dateNavigator: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    dateText: { fontSize: 18, fontWeight: '600', color: theme.headerTitle },
    chevron: { color: theme.chevron },
    disabledChevron: { color: theme.disabledChevron },
    summaryContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', paddingVertical: 20, paddingTop: 10 },
    summaryBox: { alignItems: 'center', flex:1 },
    summaryValue: { fontSize: 32, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    summaryLabel: { fontSize: 14, color: theme.secondaryText, marginTop: 4, textAlign:'center' },
    
    // --- FIX IS HERE: FIXED HEIGHT ADDED ---
    graphContainer: { 
        flexDirection: isRTL ? 'row-reverse' : 'row', 
        paddingHorizontal: 15, 
        paddingTop: 10, 
        paddingBottom: 10, 
        height: 300, // <--- FIXED HEIGHT
        alignItems: 'stretch'
    },
    
    yAxis: { width: 40, justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: isRTL ? 8 : 0, paddingRight: isRTL ? 0 : 8, height: '100%', paddingBottom: 25 },
    yAxisLabel: { fontSize: 11, color: theme.secondaryText, fontVariant: ['tabular-nums'] },
    barsAreaWrapper: { flex: 1, [isRTL ? 'marginRight' : 'marginLeft']: 5 },
    barsArea: { flex: 1, borderBottomWidth: 1, borderBottomColor: theme.graphLine, position: 'relative', marginBottom: 25 },
    bars: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingHorizontal: 5 },
    barWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
    bar: { width: 18, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
    achievedBar: { backgroundColor: theme.achievedBar }, 
    activeBar: { backgroundColor: theme.activeBar },
    selectedBar: { backgroundColor: theme.selectedBar }, 
    inactiveBar: { backgroundColor: theme.inactiveBar },
    xAxis: { position: 'absolute', bottom: -25, left: 0, right: 0, height: 25, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', paddingHorizontal: 5 },
    xAxisLabelWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    xAxisLabel: { fontSize: 11, color: theme.secondaryText, textAlign: 'center' },
    tooltipPositioner: { position: 'absolute', alignItems: 'center', zIndex: 10, marginBottom: 5, left: '50%', transform: [{ translateX: -30 }] },
    tooltipContainer: { backgroundColor: theme.tooltipBg, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, minWidth: 60, alignItems: 'center' },
    tooltipText: { color: theme.tooltipText, fontSize: 12, fontWeight: 'bold', fontVariant: ['tabular-nums'] },
    tooltipPointer: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.tooltipBg, marginTop: -1 },
    summaryHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: theme.headerTitle, marginBottom: 15, width: '100%', textAlign: I18nManager.isRTL ? 'right' : 'left' },
    summaryMainCard: { backgroundColor: theme.cardBackground, borderRadius: 15, padding: 20, width: '100%', marginBottom: 20 },
    summaryStatRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    summaryStatLabel: { fontSize: 16, color: theme.secondaryText, textAlign: I18nManager.isRTL ? 'right' : 'left' },
    summaryStatValue: { fontSize: 18, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    divider: { height: 1, backgroundColor: theme.separator, marginVertical: 15 },
    metricsCard: { backgroundColor: theme.cardBackground, borderRadius: 15, paddingVertical: 20, width: '100%', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'center' },
    metricBlock: { alignItems: 'center', flex: 1 },
    metricIconCircle: { 
        backgroundColor: theme.iconCircleBg, 
        width: 60, 
        height: 60, 
        borderRadius: 30, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginBottom: 12, 
        iconColor: theme.icon 
    },
    metricValue: { 
        fontSize: 22, 
        fontWeight: 'bold', 
        color: theme.mainText, 
        fontVariant: ['tabular-nums'] 
    },
    metricUnit: { 
        fontSize: 14, 
        color: theme.secondaryText, 
        marginTop: 2 
    },
});

export default MonthlyTime;