// WeeklyTime.js (Fixed Layout & Infinite Scroll)

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
        headerTitle: "ملخص الاسبوع",
        totalLabel: "الإجمالي (ساعات)",
        avgLabel: "متوسط (ساعات)",
        yAxisUnit: "دقائق",
        summaryTitle: "ملخص الاسبوع",
        caloriesLabel: "السعرات",
        trendLabel: "الاتجاهات",
        mostActiveLabel: "الوقت الأكثر نشاطاً",
        stepsUnit: "خطوة",
        kmUnit: "كم",
        hoursUnit: "ساعات",
        dayNamesShort: ['س', 'أ', 'ن', 'ث', 'ر', 'خ', 'ج'], // السبت, الأحد...
        loading: "جار التحميل..."
    },
    en: {
        headerTitle: "Weekly Summary",
        totalLabel: "Total (hours)",
        avgLabel: "Avg (hours)",
        yAxisUnit: "minutes",
        summaryTitle: "Weekly Summary",
        caloriesLabel: "Calories",
        trendLabel: "Trend",
        mostActiveLabel: "Most Active",
        stepsUnit: "Steps",
        kmUnit: "Km",
        hoursUnit: "Hours",
        dayNamesShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'], // Sunday, Monday...
        loading: "Loading..."
    }
};

const lightTheme = {
    safeArea: '#F7FDF9', cardBackground: '#FFFFFF', headerTitle: '#2e7d32', mainText: '#388e3c', secondaryText: '#757575', inactiveBar: '#c8e6c9', activeBar: '#66bb6a', achievedBar: '#4caf50', selectedBar: '#2E7D32', graphLine: '#eee', tooltipBg: '#333333', tooltipText: '#FFFFFF', shadowColor: '#000', separator: '#eee', icon: '#4caf50', 
    iconCircleBg: 'rgba(76, 175, 80, 0.1)',
    badgeBg: '#e0f2f1', badgeText: '#4caf50', chevron: '#bdbdbd', modalOverlay: 'rgba(0, 0, 0, 0.4)',
    activeDayLabelColor: '#000000',
    disabledChevron: '#e0e0e0',
};
const darkTheme = {
    safeArea: '#121212', cardBackground: '#1E1E1E', headerTitle: '#E0E0E0', mainText: '#80CBC4', secondaryText: '#A0A0A0', inactiveBar: '#3E5052', activeBar: '#00796B', achievedBar: '#80CBC4', selectedBar: '#A7FFEB', graphLine: '#333333', tooltipBg: '#E0E0E0', tooltipText: '#121212', shadowColor: '#000', separator: '#424242', icon: '#80CBC4', 
    iconCircleBg: 'rgba(128, 203, 196, 0.1)',
    badgeBg: '#333333', badgeText: '#80CBC4', chevron: '#A0A0A0', modalOverlay: 'rgba(0, 0, 0, 0.6)',
    activeDayLabelColor: '#FFFFFF',
    disabledChevron: '#424242',
};

// =================================================================
// END: Translations and Theming
// =================================================================

// --- Helper Functions & Constants ---
const DAILY_TIME_HISTORY_KEY = '@Time:DailyHistory';
const getDateString = (date) => { if (!date || !(date instanceof Date)) return null; return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10); };
const addDays = (date, days) => { const result = new Date(date); result.setDate(result.getDate() + days); return result; };
const getStartOfWeek = (date, startOfWeekDay = 6) => { const d = new Date(date); const day = d.getDay(); const diff = (day < startOfWeekDay) ? (day - startOfWeekDay + 7) : (day - startOfWeekDay); d.setDate(d.getDate() - diff); return d; };
const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

// Sub-Components
const NewMonthlyChart = ({ styles, data, todayIndex, onNextWeek, onPrevWeek, weekDateRange, totalHours, avgHours, isNextButtonDisabled, translation, language }) => {
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);
    const handleBarPress = (index) => setSelectedBarIndex(prev => prev === index ? null : index);
    const handleDismissTooltip = () => setSelectedBarIndex(null);
    const locale = language === 'ar' ? 'ar-EG' : 'en-US';
    const chartDayLabels = translation.dayNamesShort;

    const yAxisMax = useMemo(() => Math.ceil(Math.max(...data, 60) / 60) * 60, [data]);
    const yAxisLabels = useMemo(() => Array.from({ length: 5 }, (_, i) => (yAxisMax - (yAxisMax / 4) * i).toLocaleString(locale)), [yAxisMax, locale]);
    const getBarHeight = useCallback((value) => yAxisMax > 0 ? `${Math.min((value / yAxisMax) * 100, 100)}%` : '0%', [yAxisMax]);

    const GoBackButton = (
        <TouchableOpacity onPress={onPrevWeek}>
            <Icon name="chevron-forward-outline" size={24} color={styles.chevron.color} />
        </TouchableOpacity>
    );

    const GoForwardButton = (
        <TouchableOpacity onPress={onNextWeek} disabled={isNextButtonDisabled} activeOpacity={0.7}>
            <Icon name="chevron-back-outline" size={24} color={isNextButtonDisabled ? styles.disabledChevron.color : styles.chevron.color} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.chartCard}>
            <View>
                <View style={styles.dateNavigator}>
                  { language === 'ar' ? GoBackButton : GoForwardButton }
                  <Text style={styles.dateText}>{weekDateRange.display}</Text>
                  { language === 'ar' ? GoForwardButton : GoBackButton }
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
                        <View style={styles.bars}>
                            {data.map((value, index) => { const height = getBarHeight(value); const isSelected = selectedBarIndex === index; const isToday = index === todayIndex;
                                return ( <Pressable key={index} style={styles.barWrapper} onPress={() => handleBarPress(index)}> {isSelected && value > 0 && (<View style={[styles.tooltipPositioner, { bottom: height }]}><View style={styles.tooltipContainer}><Text style={styles.tooltipText}>{Math.round(value).toLocaleString(locale)}</Text></View><View style={styles.tooltipPointer} /></View>)} <View style={[styles.bar, isSelected ? styles.selectedBar : (isToday ? styles.activeBar : styles.achievedBar), { height }]} /> </Pressable> );
                            })}
                        </View>
                        <View style={styles.xAxis}>{chartDayLabels.map((label, index) => <Text key={index} style={[styles.xAxisLabel, index === todayIndex && styles.activeXAxisLabel]}>{label}</Text>)}</View>
                    </View>
                </View>
            </Pressable>
        </View>
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
const ActivitySummary = ({ styles, totalCalories, trend, mostActiveTimeRange, totalSteps, totalKm, totalHours, translation }) => {
    return (
        <>
            <Text style={styles.summaryHeaderTitle}>{translation.summaryTitle}</Text>
            <View style={styles.summaryMainCard}>
                <StatRow label={translation.caloriesLabel} value={totalCalories} styles={styles}/>
                <View style={styles.divider} />
                <StatRow label={translation.trendLabel} value={trend} styles={styles}/>
                <View style={styles.divider} />
                <StatRow label={translation.mostActiveLabel} value={mostActiveTimeRange} styles={styles}/>
            </View>
            <View style={styles.metricsCard}>
                <MetricBlock iconName="walk" value={totalSteps} unit={translation.stepsUnit} styles={styles}/>
                <MetricBlock iconName="location" value={totalKm} unit={translation.kmUnit} styles={styles}/>
                <MetricBlock iconName="time-outline" value={totalHours} unit={translation.hoursUnit} styles={styles}/>
            </View>
        </>
    );
};

// Main Component
const WeeklyTime = ({ language, isDarkMode }) => {
  const translation = useMemo(() => translations[language] || translations.en, [language]);
  const theme = useMemo(() => isDarkMode ? darkTheme : lightTheme, [isDarkMode]);
  const styles = useMemo(() => getStyles(theme, language === 'ar'), [theme, language]);
  const startOfWeekDay = useMemo(() => language === 'ar' ? 6 : 0, [language]);
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
    const startOfWeek = getStartOfWeek(currentDate, startOfWeekDay); 
    const endOfWeek = addDays(startOfWeek, 6); 
    const today = new Date(); 
    let todayIndex = -1;
    const weeklyDetails = Array.from({ length: 7 }).map((_, i) => { 
        const dayDate = addDays(startOfWeek, i); 
        if(isSameDay(dayDate, today)) { todayIndex = i; } 
        const dateString = getDateString(dayDate); 
        const totalMinutes = timeHistory[dateString] || 0; 
        if (typeof totalMinutes !== 'number' || isNaN(totalMinutes)) { return { date: dayDate, minutes: 0 }; } 
        return { date: dayDate, minutes: totalMinutes }; 
    });

    const weeklyData = weeklyDetails.map(d => d.minutes);
    const displayFormat = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }); 
    const displayRange = `${displayFormat.format(startOfWeek)} - ${displayFormat.format(endOfWeek)}`;
    const totalMinutes = weeklyData.reduce((sum, val) => sum + val, 0); 
    const activeDays = weeklyData.filter(val => val > 0).length || 1; 
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1)).toLocaleString(locale, {minimumFractionDigits: 1, maximumFractionDigits: 1});
    const avgHours = parseFloat((totalMinutes / 60 / activeDays).toFixed(1)).toLocaleString(locale, {minimumFractionDigits: 1, maximumFractionDigits: 1});
    const STEPS_PER_MINUTE = 100, CALORIES_PER_STEP = 0.04, STEP_LENGTH_METERS = 0.762; 
    const totalSteps = Math.round(totalMinutes * STEPS_PER_MINUTE).toLocaleString(locale); 
    const totalCalories = Math.round((totalMinutes * STEPS_PER_MINUTE) * CALORIES_PER_STEP).toLocaleString(locale); 
    const totalKm = parseFloat(((totalMinutes * STEPS_PER_MINUTE) * STEP_LENGTH_METERS) / 1000).toLocaleString(locale, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const mostActiveTimeRange = '-';
    const trend = '-';
    const startOfCurrentSystemWeek = getStartOfWeek(new Date(), startOfWeekDay);
    const isNextButtonDisabled = getDateString(startOfWeek) >= getDateString(startOfCurrentSystemWeek);
    return { weeklyData, todayIndex, weekDateRange: { start: startOfWeek, end: endOfWeek, display: displayRange }, stats: { totalHours, avgHours, trend, mostActiveTimeRange, totalSteps, totalCalories, totalKm }, isNextButtonDisabled: isNextButtonDisabled, };
  }, [currentDate, timeHistory, startOfWeekDay, locale]);

  const handlePreviousWeek = () => setCurrentDate(prev => addDays(prev, -7));
  const handleNextWeek = () => { 
    if (memoizedData && memoizedData.isNextButtonDisabled) return;
    const nextWeekStart = addDays(currentDate, 7);
    setCurrentDate(nextWeekStart); 
  };
  
  if (!memoizedData) { return ( <View style={styles.safeArea}><View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color={theme.mainText} /></View></View> ); }
  
  return (
    <View style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.mainContainer}>
        <NewMonthlyChart 
            styles={styles} 
            data={memoizedData.weeklyData} 
            todayIndex={memoizedData.todayIndex} 
            onNextWeek={handleNextWeek} 
            onPrevWeek={handlePreviousWeek} 
            weekDateRange={memoizedData.weekDateRange} 
            totalHours={memoizedData.stats.totalHours} 
            avgHours={memoizedData.stats.avgHours} 
            isNextButtonDisabled={memoizedData.isNextButtonDisabled}
            translation={translation}
            language={language}
        />
        <ActivitySummary 
            styles={styles} 
            totalCalories={memoizedData.stats.totalCalories} 
            trend={memoizedData.stats.trend} 
            mostActiveTimeRange={memoizedData.stats.mostActiveTimeRange} 
            totalSteps={memoizedData.stats.totalSteps} 
            totalKm={memoizedData.stats.totalKm} 
            totalHours={memoizedData.stats.totalHours}
            translation={translation}
        />
      </ScrollView>
    </View>
  );
};

// Dynamic Stylesheet
const getStyles = (theme, isRTL) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.safeArea },
    mainContainer: { padding: 15, paddingBottom: 50 },
    chartCard: { backgroundColor: theme.cardBackground, borderRadius: 20, marginBottom: 20, shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
    dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
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
        height: 300,  // <--- FIXED HEIGHT
        alignItems: 'stretch'
    },
    
    yAxis: { width: 35, justifyContent: 'space-between', alignItems: 'flex-start', paddingLeft: isRTL ? 8 : 0, paddingRight: isRTL ? 0 : 8, height: '100%', paddingBottom: 25 },
    yAxisLabel: { fontSize: 11, color: theme.secondaryText, fontVariant: ['tabular-nums'] },
    barsAreaWrapper: { flex: 1, [isRTL ? 'marginRight' : 'marginLeft']: 5 },
    barsArea: { flex: 1, borderBottomWidth: 1, borderBottomColor: theme.graphLine, position: 'relative', marginBottom: 25 },
    bars: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
    barWrapper: { width: `${100 / 7}%`, height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
    bar: { width: 14, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
    achievedBar: { backgroundColor: theme.inactiveBar }, 
    activeBar: { backgroundColor: theme.activeBar },
    selectedBar: { backgroundColor: theme.selectedBar }, 
    xAxis: { position: 'absolute', bottom: -25, left: 0, right: 0, height: 20, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'center' },
    xAxisLabel: { fontSize: 12, color: theme.secondaryText, textAlign: 'center', flex: 1 },
    activeXAxisLabel: { fontWeight: 'bold', color: theme.activeDayLabelColor },
    tooltipPositioner: { position: 'absolute', alignItems: 'center', zIndex: 10, marginBottom: 5, left: '50%', transform: [{ translateX: -30 }] },
    tooltipContainer: { backgroundColor: theme.tooltipBg, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, minWidth: 60, alignItems: 'center' },
    tooltipText: { color: theme.tooltipText, fontSize: 12, fontWeight: 'bold' },
    tooltipPointer: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.tooltipBg, marginTop: -1 },
    summaryHeaderTitle: { fontSize: 18, fontWeight: 'bold', color: theme.headerTitle, marginBottom: 15, width: '100%', textAlign: isRTL ? 'right' : 'left' },
    summaryMainCard: { backgroundColor: theme.cardBackground, borderRadius: 15, padding: 20, width: '100%', marginBottom: 20 },
    summaryStatRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    summaryStatLabel: { fontSize: 16, color: theme.secondaryText },
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

export default WeeklyTime;