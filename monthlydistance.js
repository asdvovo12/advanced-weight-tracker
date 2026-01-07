// MonthlyDistance.js (Fixed Layout and Infinite Scroll Issue)

import React, { useState, useMemo, useCallback, useEffect } from 'react';
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

// --- Theme and Translation ---
const lightTheme = { safeArea: '#F7FDF9', cardBackground: '#FFFFFF', headerTitle: '#2e7d32', mainText: '#388e3c', secondaryText: '#757575', inactiveBar: '#c8e6c9', activeBar: '#66bb6a', achievedBar: '#4caf50', selectedBar: '#2E7D32', graphLine: '#eee', tooltipBg: '#333333', tooltipText: '#FFFFFF', shadowColor: '#000', separator: '#eee', icon: '#4caf50', iconCircleBg: 'rgba(76, 175, 80, 0.1)', chevron: '#bdbdbd', disabledChevron: '#e0e0e0'};
const darkTheme = { safeArea: '#121212', cardBackground: '#1E1E1E', headerTitle: '#E0E0E0', mainText: '#80CBC4', secondaryText: '#A0A0A0', inactiveBar: '#3E5052', activeBar: '#00796B', achievedBar: '#80CBC4', selectedBar: '#A7FFEB', graphLine: '#333333', tooltipBg: '#E0E0E0', tooltipText: '#121212', shadowColor: '#000', separator: '#424242', icon: '#80CBC4', iconCircleBg: 'rgba(128, 203, 196, 0.1)', chevron: '#A0A0A0', disabledChevron: '#424242'};
const translations = { ar: { kmUnit: 'كم', dailyAverage: 'متوسط يومي', totalKm: 'الإجمالي (كم)', summaryTitle: 'ملخص الشهر', calories: 'السعرات', trend: 'الاتجاهات', mostActiveDay: 'اليوم الأكثر نشاطاً', steps: 'خطوة', hours: 'ساعات', trendHigh: 'مرتفع', trendLow: 'منخفض', trendStable: 'مستقر', loading: 'تحميل...', noData: '-', }, en: { kmUnit: 'km', dailyAverage: 'Daily Avg', totalKm: 'Total (km)', summaryTitle: 'Monthly Summary', calories: 'Calories', trend: 'Trend', mostActiveDay: 'Most Active Day', steps: 'Steps', hours: 'Hours', trendHigh: 'High', trendLow: 'Low', trendStable: 'Stable', loading: 'Loading...', noData: '-', } };

// --- Constants & Helpers ---
const CALORIES_PER_STEP = 0.04; const STEP_LENGTH_METERS = 0.762; const STEPS_PER_MINUTE = 100;
const DAILY_DISTANCE_HISTORY_KEY = '@DistanceScreen:DailyHistory';
const getDateString = (date) => { if (!date || !(date instanceof Date)) return null; return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())).toISOString().slice(0, 10); };

// =================================================================
// Sub-components
// =================================================================
const MonthlyChart = ({ styles, weeklyAggregates, totalDistance, averageDistance, dateRange, onPreviousMonth, onNextMonth, isNextMonthDisabled, translation }) => {
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);
    const locale = I18nManager.isRTL ? 'ar-EG' : 'en-US';

    const { yAxisLabels, yMax } = useMemo(() => {
        const weeklyTotals = weeklyAggregates.map(w => w.value);
        const dataMax = Math.max(...weeklyTotals, 10);
        const topValue = Math.ceil(dataMax / 10) * 10;
        const labels = [];
        for (let i = topValue; i >= 0; i -= (topValue / 4)) { labels.push(Math.round(i).toString()); }
        return { yAxisLabels: [...new Set(labels)], yMax: topValue };
    }, [weeklyAggregates]);

    const getBarHeight = useCallback((value) => yMax === 0 ? '0%' : `${Math.min((value / yMax) * 100, 100)}%`, [yMax]);

    const handleBarPress = (index) => setSelectedBarIndex(prev => prev === index ? null : index);
    const handleDismissTooltip = () => setSelectedBarIndex(null);

    const GoBackButton = (
        <TouchableOpacity onPress={onPreviousMonth}>
            <Icon name="chevron-back-outline" size={24} color={styles.chevron.color} />
        </TouchableOpacity>
    );

    const GoForwardButton = (
        <TouchableOpacity onPress={onNextMonth} disabled={isNextMonthDisabled}>
            <Icon name="chevron-forward-outline" size={24} color={isNextMonthDisabled ? styles.disabledChevron.color : styles.chevron.color} />
        </TouchableOpacity>
    );

    return (
        <View style={styles.chartCard}>
            <View>
                <View style={styles.dateNavigator}>
                   { I18nManager.isRTL ? GoBackButton : GoForwardButton }
                    <Text style={styles.dateText}>{dateRange}</Text>
                   { I18nManager.isRTL ? GoForwardButton : GoBackButton }
                </View>
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBox}><Text style={styles.summaryValue}>{averageDistance.toLocaleString(locale, {maximumFractionDigits: 1})}</Text><Text style={styles.summaryLabel}>{translation.dailyAverage}</Text></View>
                    <View style={styles.summaryBox}><Text style={styles.summaryValue}>{totalDistance.toLocaleString(locale, {maximumFractionDigits: 1})}</Text><Text style={styles.summaryLabel}>{translation.totalKm}</Text></View>
                </View>
            </View>
            <Pressable style={styles.graphContainer} onPress={handleDismissTooltip}>
                <View style={styles.yAxis}>{yAxisLabels.map((label, index) => <Text key={`y-${index}`} style={styles.yAxisLabel}>{label}</Text>)}</View>
                <View style={styles.barsAreaWrapper}>
                    <View style={styles.barsArea} collapsable={false}>
                        <View style={styles.bars}>{weeklyAggregates.map((item, index) => {
                                const height = getBarHeight(item.value); const isSelected = selectedBarIndex === index;
                                const barStyles = [styles.bar, isSelected ? styles.selectedBar : styles.achievedBar, { height }];
                                return (
                                    <Pressable key={index} style={styles.barWrapper} onPress={() => handleBarPress(index)}>
                                        {isSelected && item.value > 0 && (<View style={[styles.tooltipPositioner, { bottom: height }]}><View style={styles.tooltipContainer}><Text style={styles.tooltipText}>{`${item.value.toFixed(1)} ${translation.kmUnit}`}</Text></View><View style={styles.tooltipPointer} /></View>)}
                                        <View style={barStyles} />
                                    </Pressable>
                                );
                            })}</View>
                        <View style={styles.xAxis}>{weeklyAggregates.map((item, index) => (<View key={index} style={styles.xAxisLabelWrapper}><Text style={styles.xAxisLabel}>{item.label}</Text></View>))}</View>
                    </View>
                </View>
            </Pressable>
        </View>
    );
};
const StatRow = ({label, value, styles}) => (<View style={styles.summaryStatRow}><Text style={styles.summaryStatValue}>{value}</Text><Text style={styles.summaryStatLabel}>{label}</Text></View>);
const MetricBlock = ({iconName, value, unit, styles}) => (<View style={styles.metricBlock}><View style={styles.metricIconCircle}><Icon name={iconName} size={28} color={styles.metricIconCircle.iconColor} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricUnit}>{unit}</Text></View>);
const ActivitySummary = ({ styles, totalKm, totalSteps, totalCalories, totalHours, trend, mostActiveTime, translation }) => { 
    const locale = I18nManager.isRTL ? 'ar-EG' : 'en-US';
    return ( 
    <> 
        <Text style={styles.summaryHeaderTitle}>{translation.summaryTitle}</Text> 
        <View style={styles.summaryMainCard}> 
            <StatRow label={translation.calories} value={totalCalories.toLocaleString(locale, {maximumFractionDigits: 0})} styles={styles}/> 
            <View style={styles.divider} /> 
            <StatRow label={translation.trend} value={trend} styles={styles}/> 
            <View style={styles.divider} /> 
            <StatRow label={translation.mostActiveDay} value={mostActiveTime} styles={styles}/> 
        </View> 
        <View style={styles.metricsCard}> 
            <MetricBlock iconName="walk" value={totalSteps.toLocaleString(locale, {maximumFractionDigits: 0})} unit={translation.steps} styles={styles}/> 
            <MetricBlock iconName="location" value={totalKm.toLocaleString(locale, {maximumFractionDigits: 1})} unit={translation.kmUnit} styles={styles}/> 
            <MetricBlock iconName="time-outline" value={totalHours.toLocaleString(locale, {maximumFractionDigits: 1})} unit={translation.hours} styles={styles}/> 
        </View> 
    </> 
    ); 
};


// =================================================================
// Main Page Component
// =================================================================
const MonthlyDistance = ({ language = 'ar', isDarkMode = false }) => {
  const theme = isDarkMode ? darkTheme : lightTheme;
  const translation = useMemo(() => translations[language] || translations.ar, [language]);
  const styles = useMemo(() => getStyles(theme, I18nManager.isRTL), [theme]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState({ weeklyAggregates: Array(5).fill({ label: '', value: 0 }), totalKm: 0, averageKm: 0, totalSteps: 0, totalCalories: 0, totalHours: 0, dateRange: translation.loading, trend: translation.noData, mostActiveTime: translation.noData });

  useFocusEffect(
    useCallback(() => {
        const fetchAndProcessData = async () => {
            setIsLoading(true);
            const locale = language === 'ar' ? 'ar-EG-u-ca-gregory-nu-arab' : 'en-US-u-ca-gregory';
            try {
                const storedHistory = await AsyncStorage.getItem(DAILY_DISTANCE_HISTORY_KEY);
                const historyData = storedHistory ? JSON.parse(storedHistory) : {};

                const fetchDistanceDetails = (offset) => {
                    const targetDate = new Date();
                    targetDate.setUTCHours(0, 0, 0, 0);
                    targetDate.setUTCMonth(targetDate.getUTCMonth() - offset, 1);
                    
                    const year = targetDate.getUTCFullYear();
                    const month = targetDate.getUTCMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getUTCDate();
                    
                    const distances = Array.from({ length: daysInMonth }).map((_, i) => {
                        const dateKey = getDateString(new Date(Date.UTC(year, month, i + 1)));
                        return historyData[dateKey] || 0;
                    });
                    
                    const totalKm = distances.reduce((sum, d) => sum + d, 0);
                    return { distances, totalKm, year, month, daysInMonth };
                };
                
                const currentMonth = fetchDistanceDetails(monthOffset);
                const previousMonth = fetchDistanceDetails(monthOffset + 1);

                const { distances, totalKm, year, month, daysInMonth } = currentMonth;
                const { totalKm: previousTotalKm } = previousMonth;
                
                const daysWithActivity = distances.filter(d => d > 0).length || 1;
                const averageKm = totalKm / daysWithActivity;
                const totalSteps = (totalKm * 1000) / STEP_LENGTH_METERS;
                const totalCalories = totalSteps * CALORIES_PER_STEP;
                const totalHours = (totalSteps / STEPS_PER_MINUTE) / 60;
                
                const startDate = new Date(Date.UTC(year, month, 1));
                const endDate = new Date(Date.UTC(year, month, daysInMonth));
                const formatter = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' });
                const dateRange = `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
                
                const weeklyAggregates = [
                    { label: '7', value: distances.slice(0, 7).reduce((a, b) => a + b, 0) },
                    { label: '14', value: distances.slice(7, 14).reduce((a, b) => a + b, 0) },
                    { label: '21', value: distances.slice(14, 21).reduce((a, b) => a + b, 0) },
                    { label: '28', value: distances.slice(21, 28).reduce((a, b) => a + b, 0) },
                ];
                if (daysInMonth > 28) { weeklyAggregates.push({ label: `${daysInMonth}`, value: distances.slice(28).reduce((a, b) => a + b, 0) }); }
                
                let trend = translation.noData;
                if (totalKm > 0 || previousTotalKm > 0) {
                    const changePercent = (totalKm - previousTotalKm) / (previousTotalKm || 1);
                    if (changePercent > 0.1) trend = translation.trendHigh;
                    else if (changePercent < -0.1) trend = translation.trendLow;
                    else trend = translation.trendStable;
                }
                
                let mostActiveTime = translation.noData;
                const maxDistance = Math.max(...distances);
                if (maxDistance > 0) { 
                    const mostActiveDayIndex = distances.indexOf(maxDistance); 
                    const mostActiveDate = new Date(Date.UTC(year, month, mostActiveDayIndex + 1)); 

                    // --- FORMATTING LOGIC FOR MOST ACTIVE DAY ---
                    mostActiveTime = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' }).format(mostActiveDate);
                }
                
                setMonthlyData({ weeklyAggregates, totalKm, averageKm, totalSteps, totalCalories, totalHours, dateRange, trend, mostActiveTime });
            } catch (error) { 
                console.error("Failed to fetch monthly distance data:", error); 
            } finally {
                setIsLoading(false);
            }
        };

        fetchAndProcessData();
    }, [monthOffset, language, translation])
  );

  const handlePreviousMonth = () => setMonthOffset(prev => prev + 1);
  const handleNextMonth = () => setMonthOffset(prev => (prev > 0 ? prev - 1 : 0));

  if (isLoading) {
    return ( <View style={styles.safeArea}><ActivityIndicator size="large" color={theme.mainText} style={{ flex: 1 }} /></View> );
  }

  return ( 
    <View style={styles.safeArea}> 
        <ScrollView contentContainerStyle={styles.mainContainer}> 
            <MonthlyChart styles={styles} weeklyAggregates={monthlyData.weeklyAggregates} totalDistance={monthlyData.totalKm} averageDistance={monthlyData.averageKm} dateRange={monthlyData.dateRange} onPreviousMonth={handlePreviousMonth} onNextMonth={handleNextMonth} isNextMonthDisabled={monthOffset === 0} translation={translation}/> 
            <ActivitySummary styles={styles} totalKm={monthlyData.totalKm} totalSteps={monthlyData.totalSteps} totalCalories={monthlyData.totalCalories} totalHours={monthlyData.totalHours} trend={monthlyData.trend} mostActiveTime={monthlyData.mostActiveTime} translation={translation} /> 
        </ScrollView> 
    </View> 
  );
};

// =================================================================
// Dynamic Stylesheet
// =================================================================
const getStyles = (theme, isRTL) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.safeArea },
    mainContainer: { padding: 15, paddingBottom: 50 },
    chartCard: { backgroundColor: theme.cardBackground, borderRadius: 20, marginBottom: 20, shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
    dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    dateText: { fontSize: 18, fontWeight: '600', color: theme.headerTitle, fontVariant: ['tabular-nums'], textAlign: 'center' },
    chevron: { color: theme.chevron },
    disabledChevron: { color: theme.disabledChevron },
    summaryContainer: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', paddingVertical: 20, paddingTop: 10 },
    summaryBox: { alignItems: 'center', flex:1 },
    summaryValue: { fontSize: 32, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    summaryLabel: { fontSize: 14, color: theme.secondaryText, marginTop: 4, textAlign:'center' },
    
    // --- FIX IS HERE: Fixed Height prevents infinite scrolling ---
    graphContainer: { 
        flexDirection: isRTL ? 'row-reverse' : 'row', 
        paddingHorizontal: 15, 
        paddingTop: 10, 
        paddingBottom: 10, 
        height: 300, // Fixed height added here
        alignItems: 'stretch'
    },
    
    yAxis: { width: 35, justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: isRTL ? 8 : 0, paddingRight: isRTL ? 0 : 8, height: '100%', paddingBottom: 25, position: 'relative' },
    yAxisLabel: { fontSize: 11, color: theme.secondaryText, fontVariant: ['tabular-nums'] },
    barsAreaWrapper: { flex: 1, [isRTL ? 'marginRight' : 'marginLeft']: 5 },
    barsArea: { flex: 1, borderBottomWidth: 1, borderBottomColor: theme.graphLine, position: 'relative', marginBottom: 25 },
    bars: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'flex-end', paddingHorizontal: 10 },
    barWrapper: { width: '18%', height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
    bar: { width: 20, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
    xAxis: { position: 'absolute', bottom: -25, left: 0, right: 0, height: 20, flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', paddingHorizontal: 10, },
    xAxisLabelWrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    xAxisLabel: { fontSize: 11, color: theme.secondaryText, fontVariant: ['tabular-nums'] },
    achievedBar: { backgroundColor: theme.achievedBar }, 
    selectedBar: { backgroundColor: theme.selectedBar }, 
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
    metricIconCircle: { backgroundColor: theme.iconCircleBg, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12, iconColor: theme.icon },
    metricValue: { fontSize: 22, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    metricUnit: { fontSize: 14, color: theme.secondaryText, marginTop: 2 },
});

export default MonthlyDistance;