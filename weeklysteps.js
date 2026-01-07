import React, { useState, useMemo } from 'react';
import {
    View, // تم التغيير من SafeAreaView
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    I18nManager,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Helper Functions ---
const formatNumber = (num, lang, options = {}) => {
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    if (typeof num !== 'number' || isNaN(num)) {
        if (lang === 'ar') return '٠';
        return '0';
    }
    return num.toLocaleString(locale, options);
};

const formatStepsK = (steps, lang = 'ar') => {
    if (typeof steps !== 'number' || isNaN(steps)) steps = 0;
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    if (lang === 'ar') {
        if (steps === 0) return '٠';
        if (steps >= 1000) {
            const formattedK = (steps / 1000).toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            return `${formattedK.replace(/[.,٫]0$/, '')} ألف`;
        }
        return steps.toLocaleString(locale);
    } else {
        if (steps === 0) return '0';
        if (steps >= 1000) {
            const kValue = steps / 1000;
            const formattedK = kValue % 1 === 0 ? kValue.toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : kValue.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            return `${formattedK}k`;
        }
        return steps.toLocaleString(locale);
    }
};

const addDays = (date, days) => {
    const result = new Date(date);
    result.setUTCDate(result.getUTCDate() + days);
    return result;
};

// --- Theming ---
const lightTheme = {
    safeArea: '#F7FDF9', cardBackground: '#FFFFFF', headerTitle: '#2e7d32', mainText: '#388e3c', secondaryText: '#757575', inactiveBar: '#c8e6c9', activeBar: '#66bb6a', achievedBar: '#4caf50', selectedBar: '#2E7D32', graphLine: '#eee', tooltipBg: '#333333', tooltipText: '#FFFFFF', shadowColor: '#000', separator: '#eee', icon: '#4caf50', iconCircleBg: 'rgba(76, 175, 80, 0.1)', chevron: '#757575', disabledChevron: '#e0e0e0', activeDayLabelColor: '#000000'
};
const darkTheme = {
    safeArea: '#121212', cardBackground: '#1E1E1E', headerTitle: '#E0E0E0', mainText: '#80CBC4', secondaryText: '#A0A0A0', inactiveBar: '#3E5052', activeBar: '#00796B', achievedBar: '#80CBC4', selectedBar: '#A7FFEB', graphLine: '#333333', tooltipBg: '#E0E0E0', tooltipText: '#121212', shadowColor: '#000', separator: '#424242', icon: '#80CBC4', iconCircleBg: 'rgba(128, 203, 196, 0.1)', chevron: '#A0A0A0', disabledChevron: '#424242', activeDayLabelColor: '#FFFFFF'
};

// =================================================================
// Main Component
// =================================================================
const WeeklySteps = ({
    totalSteps = 0,
    averageSteps = 0,
    weeklyDuration = '0',
    weeklyDistance = '0',
    weeklyCalories = '0',
    stepsChange = '0',
    weekData = [],
    previousWeekData = [], 
    weekStartDate,
    formattedDateRange = '',
    onPreviousWeek,
    onNextWeek,
    isCurrentWeek = true,
    targetSteps = 6000,
    isLoading = false,
    maxSteps = 10000,
    language = 'ar',
    isDarkMode = false,
    translation: t = {},
    dayNamesShort = []
}) => {
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);
    const theme = useMemo(() => isDarkMode ? darkTheme : lightTheme, [isDarkMode]);
    const styles = useMemo(() => getStyles(theme, I18nManager.isRTL), [theme, I18nManager.isRTL]);
    
    // Fallback for names if empty
    const safeDayNames = (dayNamesShort && dayNamesShort.length === 7) ? dayNamesShort : ['-', '-', '-', '-', '-', '-', '-'];

    const { calculatedTrendText, calculatedActiveDay } = useMemo(() => {
        const currentWeekTotalSteps = (weekData || []).reduce((sum, steps) => sum + (steps || 0), 0);
        const previousWeekTotalSteps = (previousWeekData || []).reduce((sum, steps) => sum + (steps || 0), 0);
        
        let trend = t.trendUsualActivity || '...';
        if (previousWeekTotalSteps > 0) {
            const changeRatio = currentWeekTotalSteps / previousWeekTotalSteps;
            if (changeRatio > 1.2) trend = t.trendMoreActive || 'نشاط أعلى';
            else if (changeRatio < 0.8) trend = t.trendLessActive || 'نشاط أقل';
        } else if (currentWeekTotalSteps > 1000) {
             trend = t.trendStartActive || 'بداية نشطة';
        } else if (currentWeekTotalSteps === 0 && previousWeekTotalSteps === 0) {
             trend = t.trendNoData || 'لا توجد بيانات';
        }

        let activeDay = t.activeTimeNoSignificant || '-';
        if (weekData && weekData.length > 0 && weekStartDate && !isNaN(new Date(weekStartDate).getTime())) {
            const maxStepsInWeek = Math.max(...weekData.map(v => v || 0));
            if (maxStepsInWeek > 0) {
                const dayIndex = weekData.findIndex(v => (v || 0) === maxStepsInWeek);
                if (dayIndex !== -1) {
                    const mostActiveDate = addDays(new Date(weekStartDate), dayIndex);
                    const locale = language === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory';
                    activeDay = mostActiveDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
                }
            }
        }
        
        return { calculatedTrendText: trend, calculatedActiveDay: activeDay };
    }, [weekData, previousWeekData, weekStartDate, language, t]);
    
    const yAxisLabels = useMemo(() => {
        if (isLoading || !maxSteps) return [];
        const effectiveMax = Math.max(maxSteps, 1000);
        const stepCount = 4;
        const interval = Math.ceil((effectiveMax / stepCount) / 500) * 500;
        const roundedMax = interval * stepCount;
        const labels = [];
        for (let i = roundedMax; i >= 0; i -= interval) {
            labels.push(formatStepsK(i, language));
        }
        return [...new Set(labels)];
    }, [isLoading, maxSteps, language]);

    const todayIndex = useMemo(() => {
        if (!isCurrentWeek) return -1;
        const today = new Date();
        const todayDay = today.getDay();
        let indexInWeek;
        if (language === 'ar') {
            indexInWeek = (todayDay + 1) % 7; 
        } else {
            indexInWeek = todayDay;
        }
        return indexInWeek;
    }, [isCurrentWeek, language]);


    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.mainText} />
                </View>
            </View>
        );
    }
    
    const effectiveWeekData = weekData || Array(7).fill(0);
    const getBarHeight = (value) => {
        const effectiveMax = Math.max(maxSteps || 1, 1);
        return `${Math.min((value / effectiveMax) * 100, 100)}%`;
    };

    const handleBarPress = (index) => {
        const value = effectiveWeekData?.[index] ?? 0;
        if (value <= 0) {
            setSelectedBarIndex(null);
            return;
        }
        setSelectedBarIndex(prev => prev === index ? null : index);
    };
    const handleDismissTooltip = () => setSelectedBarIndex(null);

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.chartCard}>
                    {/* Header Navigator */}
                    <View style={styles.dateNavigator}>
                         <TouchableOpacity onPress={onPreviousWeek}>
                            <Ionicons name={I18nManager.isRTL ? "chevron-back-outline" : "chevron-forward-outline"} size={26} color={theme.chevron} />
                        </TouchableOpacity>

                        <Text style={styles.dateText}>{formattedDateRange}</Text>

                        <TouchableOpacity onPress={onNextWeek} disabled={isCurrentWeek}>
                            <Ionicons name={I18nManager.isRTL ? "chevron-forward-outline" : "chevron-back-outline"} size={26} color={isCurrentWeek ? theme.disabledChevron : theme.chevron} />
                        </TouchableOpacity>
                    </View>

                    {/* Summary Boxes */}
                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryValue}>{formatNumber(totalSteps, language)}</Text>
                            <Text style={styles.summaryLabel}>{t.total || 'Total'}</Text>
                        </View>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryValue}>{formatNumber(averageSteps, language)}</Text>
                            <Text style={styles.summaryLabel}>{t.average || 'Avg'}</Text>
                        </View>
                    </View>
                    
                    {/* THE GRAPH */}
                    <Pressable style={styles.graphContainer} onPress={handleDismissTooltip}>
                        <View style={styles.yAxis}>
                            {yAxisLabels.map((label, index) => (
                                <Text key={`y-${index}`} style={styles.yAxisLabel}>{label}</Text>
                            ))}
                        </View>
                        <View style={styles.barsAreaWrapper}>
                            <View style={styles.barsArea} collapsable={false}>
                                <View style={styles.bars}>
                                    {safeDayNames.map((_, index) => {
                                        const val = effectiveWeekData[index] ?? 0;
                                        const h = getBarHeight(val);
                                        const isSel = selectedBarIndex === index;
                                        const isTodayBar = isCurrentWeek && index === todayIndex;
                                        const barStyle = [styles.bar, { height: h, minHeight: val > 0 ? 2 : 0 }, isSel ? styles.selectedBar : isTodayBar ? styles.activeBar : (val >= targetSteps) ? styles.achievedBar : styles.inactiveBar];
                                        return (
                                            <Pressable key={index} style={styles.barWrapper} onPress={() => handleBarPress(index)}>
                                                {isSel && val > 0 && (<Tooltip value={val} language={language} styles={styles} barHeight={h} />)}
                                                <View style={barStyle} />
                                            </Pressable>
                                        );
                                    })}
                                </View>
                                <View style={styles.xAxis}>
                                    {safeDayNames.map((label, index) => (
                                        <Text key={index} style={[styles.xAxisLabel, (isCurrentWeek && index === todayIndex) && styles.activeXAxisLabel]}>{label}</Text>
                                    ))}
                                </View>
                            </View>
                        </View>
                    </Pressable>
                </View>
                
                {/* Bottom Summary */}
                <Text style={styles.sectionTitle}>{t.weeklySummary || 'Summary'}</Text>
                <View style={styles.summaryMainCard}>
                    <View style={styles.summaryStatRow}>
                        <Text style={styles.summaryStatValue}>{stepsChange}</Text>
                        <Text style={styles.summaryStatLabel}>{t.stepsLabelUnit || 'Steps'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryStatRow}>
                        <Text style={[styles.summaryStatValue, {fontSize: 16}]}>{calculatedTrendText}</Text>
                        <Text style={styles.summaryStatLabel}>{t.trendsLabel || 'Trend'}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.summaryStatRow}>
                        <Text style={[styles.summaryStatValue, {fontSize: 16}]}>{calculatedActiveDay}</Text>
                        <Text style={styles.summaryStatLabel}>{t.mostActiveTimeLabel || 'Active Time'}</Text>
                    </View>
                </View>

                {/* Metrics */}
                <View style={styles.metricsCard}>
                    <MetricBlock iconName="time-outline" value={weeklyDuration} unit={t.durationUnit || 'min'} theme={theme} styles={styles} IconComponent={Ionicons} />
                    <MetricBlock iconName="location-outline" value={weeklyDistance} unit={t.distanceUnit || 'km'} theme={theme} styles={styles} IconComponent={Ionicons} />
                    <MetricBlock iconName="fire" value={weeklyCalories} unit={t.caloriesUnit || 'cal'} theme={theme} styles={styles} IconComponent={MaterialCommunityIcons} />
                </View>
                <View style={{ height: 30 }} />
            </ScrollView>
        </View>
    );
};

const Tooltip = ({ value, language, styles, barHeight }) => (
    <View style={[styles.tooltipPositioner, { bottom: barHeight, marginBottom: 5 }]}>
        <View style={styles.tooltipContainer}>
            <Text style={styles.tooltipText}>{formatNumber(value, language)}</Text>
        </View>
        <View style={styles.tooltipPointer} />
    </View>
);

const MetricBlock = ({ iconName, value, unit, theme, styles, IconComponent }) => (
    <View style={styles.metricBlock}>
        <View style={styles.metricIconCircle}>
            <IconComponent name={iconName} size={28} color={theme.icon} />
        </View>
        <Text style={styles.metricValue}>{value}</Text>
        <Text style={styles.metricUnit}>{unit}</Text>
    </View>
);

const getStyles = (theme, isRTL) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.safeArea },
    contentContainer: { padding: 15, paddingBottom: 50 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    chartCard: { backgroundColor: theme.cardBackground, borderRadius: 20, marginBottom: 20, shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2, overflow: 'hidden' },
    dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
    dateText: { fontSize: 18, fontWeight: '600', color: theme.headerTitle, marginHorizontal: 10, textAlign: 'center' },
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingTop: 10, borderBottomWidth: 1, borderBottomColor: theme.separator, marginHorizontal: 20 },
    summaryBox: { alignItems: 'center', flex:1 },
    summaryValue: { fontSize: 32, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    summaryLabel: { fontSize: 14, color: theme.secondaryText, marginTop: 4, textAlign:'center' },
    
    // --- FIX HERE: Fixed height prevents infinite stretching ---
    graphContainer: { 
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', // Force RTL direction
        paddingHorizontal: 15, 
        paddingTop: 30, 
        paddingBottom: 10, 
        height: 300, // <--- IMPORTANT: Fixed Height
        alignItems: 'stretch'
    },
    
    yAxis: { width: 45, justifyContent: 'space-between', alignItems: 'flex-end', paddingRight: 8, height: '100%', paddingBottom: 25 },
    yAxisLabel: { fontSize: 11, color: theme.secondaryText, fontVariant: ['tabular-nums'] },
    barsAreaWrapper: { flex: 1, marginLeft: 5 },
    barsArea: { flex: 1, borderBottomWidth: 1, borderBottomColor: theme.graphLine, position: 'relative', marginBottom: 25 },
    bars: { position: 'absolute', bottom: 0, left: 0, right: 0, top: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end' },
    barWrapper: { width: `${100 / 7}%`, height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
    bar: { width: 14, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
    inactiveBar: { backgroundColor: theme.inactiveBar },
    activeBar: { backgroundColor: theme.activeBar },
    achievedBar: { backgroundColor: theme.achievedBar },
    selectedBar: { backgroundColor: theme.selectedBar },
    xAxis: { position: 'absolute', bottom: -25, left: 0, right: 0, height: 20, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    xAxisLabel: { fontSize: 12, color: theme.secondaryText, textAlign: 'center', flex: 1 },
    activeXAxisLabel: { color: theme.activeDayLabelColor, fontWeight: 'bold' },
    tooltipPositioner: { position: 'absolute', alignItems: 'center', zIndex: 10, width: 100 },
    tooltipContainer: { backgroundColor: theme.tooltipBg, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, minWidth: 65, alignItems: 'center' },
    tooltipText: { color: theme.tooltipText, fontSize: 12, fontWeight: 'bold' },
    tooltipPointer: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: theme.tooltipBg, marginTop: -1 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.headerTitle, marginBottom: 15, width: '100%', textAlign: isRTL ? 'right' : 'left', paddingHorizontal: 5 },
    summaryMainCard: { backgroundColor: theme.cardBackground, borderRadius: 15, padding: 20, width: '100%', marginBottom: 20 },
    summaryStatRow: { flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
    summaryStatLabel: { fontSize: 16, color: theme.secondaryText, textAlign: isRTL ? 'left' : 'right' },
    summaryStatValue: { fontSize: 18, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'], textAlign: isRTL ? 'right': 'left', flex: 1, marginHorizontal: 10 },
    divider: { height: 1, backgroundColor: theme.separator, marginVertical: 15 },
    metricsCard: { backgroundColor: theme.cardBackground, borderRadius: 15, paddingVertical: 20, width: '100%', flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-around', alignItems: 'center' },
    metricBlock: { alignItems: 'center', flex: 1 },
    metricIconCircle: { backgroundColor: theme.iconCircleBg, width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    metricValue: { fontSize: 22, fontWeight: 'bold', color: theme.mainText, fontVariant: ['tabular-nums'] },
    metricUnit: { fontSize: 14, color: theme.secondaryText, marginTop: 2 },
});

export default WeeklySteps;