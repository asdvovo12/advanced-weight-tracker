import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    I18nManager,
    Pressable,
    Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// --- Constants ---
const STEPS_PER_MINUTE = 100;
const CALORIES_PER_STEP = 0.04;
const STEP_LENGTH_METERS = 0.762;
const TOOLTIP_WIDTH = 65;
const TOOLTIP_POINTER_HEIGHT = 5;
const TOOLTIP_VERTICAL_OFFSET = 3;

// --- Theme Colors ---
const lightTheme = {
    backgroundColor: '#F7FDF9', cardBackgroundColor: '#FFFFFF', textColor: '#424242',
    primaryText: '#2e7d32', secondaryText: '#757575', accentColor: '#4caf50',
    highlightColor: '#388e3c', barDefault: '#c8e6c9', barSelected: '#4CAF50',
    barInactive: '#e0e0e0', separatorColor: '#EEEEEE', graphLineColor: '#E0E0E0',
    iconBgColor: '#e0f2f1', tooltipBg: 'black', tooltipText: 'white',
    loadingColor: '#e0e0e0', disabledColor: '#e0e0e0', shadowColor: '#000',
};

const darkTheme = {
    backgroundColor: '#121212', cardBackgroundColor: '#1e1e1e', textColor: '#E0E0E0',
    primaryText: '#E0E0E0', secondaryText: '#A0A0A0', accentColor: '#80CBC4',
    highlightColor: '#80CBC4', barDefault: '#00796B', barSelected: '#A7FFEB',
    barInactive: '#3E5052', separatorColor: '#424242', graphLineColor: '#333333',
    iconBgColor: 'rgba(128, 203, 196, 0.1)', tooltipBg: '#E0E0E0', tooltipText: '#121212',
    loadingColor: '#424242', disabledColor: '#424242', shadowColor: '#000',
};

// --- Translations ---
const translations = {
    ar: {
        total: "الإجمالي", average: "متوسط", loading: "...", loadingCalculating: "جارٍ الحساب...",
        vsLast30Days: "ملخص الشهر",
        stepsUnit: "خطوة", trends: "الاتجاهات",
        mostActiveTime: "اليوم الأكثر نشاطاً",
        hoursUnit: "ساعات", minutesUnit: "دقيقة",
        kmUnit: "كم", kcalUnit: "كيلوكالوري", calUnit: "كالوري", yAxisZero: "٠",
        yAxisKiloSuffix: " ألف", defaultMonthName: "الشهر",
        activityNormal: "مفعم بالنشاط كالمعتاد", activityHigh: "نشاط زائد", activityLow: "أقل نشاطاً",
        activityGoodStart: "بداية نشطة!", activityModerate: "نشاط معتدل",
        activeTimeInsufficient: "لا يوجد نشاط بارز",
        activeTimeNoPeak: "لا يوجد يوم بارز",
        graphAreaAccessibility: "منطقة الرسم البياني",
        emptyValue: "...",
        barAccessibilityLabel: (index, value, lang) => `الفترة ${index + 1}, ${formatNumber(value, lang)} خطوة`,
    },
    en: {
        total: "Total", average: "Average", loading: "...", loadingCalculating: "Calculating...",
        vsLast30Days: "Monthly Summary",
        stepsUnit: "steps", trends: "Trends",
        mostActiveTime: "Most Active Day",
        hoursUnit: "hours", minutesUnit: "min",
        kmUnit: "km", kcalUnit: "kcal", calUnit: "cal", yAxisZero: "0",
        yAxisKiloSuffix: "K", defaultMonthName: "Month",
        activityNormal: "As active as usual", activityHigh: "Extra active", activityLow: "Less active",
        activityGoodStart: "Active start!", activityModerate: "Moderate activity",
        activeTimeInsufficient: "No prominent day",
        activeTimeNoPeak: "No prominent day",
        graphAreaAccessibility: "Graph area",
        emptyValue: "...",
        barAccessibilityLabel: (index, value, lang) => `Period ${index + 1}, ${formatNumber(value, lang)} steps`,
    }
};

// --- Helper Functions ---
const formatNumber = (num, lang, options = {}) => {
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    if (typeof num !== 'number' || isNaN(num)) {
        const zero = lang === 'ar' ? '٠' : '0';
        if (options.minimumFractionDigits === 1) return `${zero}${lang === 'ar' ? '٫' : '.'}0`;
        if (options.minimumFractionDigits === 2) return `${zero}${lang === 'ar' ? '٫' : '.'}00`;
        return zero;
    }
    return num.toLocaleString(locale, options);
};

const formatDuration = (totalMinutes, lang) => {
    if (typeof totalMinutes !== 'number' || isNaN(totalMinutes) || totalMinutes < 0) {
        return lang === 'ar' ? '٠٠:٠٠' : '00:00';
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.floor(totalMinutes % 60);
    const hStr = formatNumber(hours, lang, { minimumIntegerDigits: 2 });
    const mStr = formatNumber(minutes, lang, { minimumIntegerDigits: 2 });
    return `${hStr}:${mStr}`;
};

const formatStepsK = (steps, lang, t) => {
    if (typeof steps !== 'number' || isNaN(steps)) steps = 0;
    const effectiveT = t || {};
    const zeroLabel = effectiveT.yAxisZero !== undefined ? effectiveT.yAxisZero : (lang === 'ar' ? '٠' : '0');
    if (steps === 0) return zeroLabel;

    if (steps >= 1000) {
        const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
        const formattedK = (steps / 1000).toLocaleString(locale, { minimumFractionDigits: 0, maximumFractionDigits: 1 });
        const cleanedK = lang === 'ar' ? formattedK.replace(/[.,٫]0$/, '') : formattedK.replace(/[.]0$/, '');
        const suffix = effectiveT.yAxisKiloSuffix || (lang === 'ar' ? ' ألف' : 'K');
        return `${cleanedK}${suffix}`;
    }
    return formatNumber(steps, lang);
};


const MonthlySteps = ({
    monthlyData = [],
    previousMonthData = [],
    isLoading = false,
    formattedDateRange = "...",
    monthStartDate,
    onPreviousMonth,
    onNextMonth,
    isCurrentMonth = false,
    language,
    isDarkMode = false,
}) => {
    const effectiveLang = language || (I18nManager.isRTL ? 'ar' : 'en');
    const theme = isDarkMode ? darkTheme : lightTheme;
    const t = useMemo(() => translations[effectiveLang] || translations.en, [effectiveLang]);

    const [totalSteps, setTotalSteps] = useState(0);
    const [averageSteps, setAverageSteps] = useState(0);
    const [stepsChange, setStepsChange] = useState(() => `+${formatNumber(0, effectiveLang)}`);
    const [trendText, setTrendText] = useState(() => t.loadingCalculating);
    const [activeTimeText, setActiveTimeText] = useState(() => t.loadingCalculating);
    const [timeValue, setTimeValue] = useState(() => formatDuration(0, effectiveLang));
    const [timeChange, setTimeChange] = useState(() => `+${formatNumber(0, effectiveLang)}`);
    const [distanceValue, setDistanceValue] = useState(() => formatNumber(0, effectiveLang, { minimumFractionDigits: 2 }));
    const [distanceChange, setDistanceChange] = useState(() => `+${formatNumber(0, effectiveLang, { minimumFractionDigits: 2 })}`);
    const [calorieValue, setCalorieValue] = useState(() => formatNumber(0, effectiveLang, { minimumFractionDigits: 1 }));
    const [calorieChange, setCalorieChange] = useState(() => `+${formatNumber(0, effectiveLang, { minimumFractionDigits: 1 })}`);
    const [graphBarsData, setGraphBarsData] = useState([0, 0, 0, 0, 0]);
    const [xAxisMonthLabels, setXAxisMonthLabels] = useState(() => Array(5).fill(t.emptyValue));
    const [yAxisLabels, setYAxisLabels] = useState(() => [t.yAxisZero, ...Array(4).fill(t.emptyValue)]);
    const [maxStepsForGraph, setMaxStepsForGraph] = useState(1000);
    const [selectedBarIndex, setSelectedBarIndex] = useState(null);
    const [selectedBarValue, setSelectedBarValue] = useState(null);

    useEffect(() => {
        // --- تصحيح: إضافة تحقق إضافي للبيانات ---
        const hasData = Array.isArray(monthlyData) && monthlyData.length > 0;
        const totalCheck = hasData ? monthlyData.reduce((a, b) => a + b, 0) : 0;
        const dataAvailable = !isLoading && hasData && totalCheck >= 0;

        if (!dataAvailable && totalCheck === 0) {
            setTotalSteps(0); setAverageSteps(0);
            setStepsChange(`+${formatNumber(0, effectiveLang)}`);
            setTrendText(t.activeTimeInsufficient); 
            setActiveTimeText(t.activeTimeNoPeak);
            setTimeValue(formatDuration(0, effectiveLang)); setTimeChange(`+${formatNumber(0, effectiveLang)}`);
            setDistanceValue(formatNumber(0, effectiveLang, { minimumFractionDigits: 2 }));
            setDistanceChange(`+${formatNumber(0, effectiveLang, { minimumFractionDigits: 2 })}`);
            setCalorieValue(formatNumber(0, effectiveLang, { minimumFractionDigits: 1 }));
            setCalorieChange(`+${formatNumber(0, effectiveLang, { minimumFractionDigits: 1 })}`);
            setGraphBarsData([0, 0, 0, 0, 0]);
            setXAxisMonthLabels(Array(5).fill(t.emptyValue));
            setYAxisLabels([t.yAxisZero, ...Array(4).fill(t.emptyValue)]);
            setMaxStepsForGraph(1000);
            setSelectedBarIndex(null); setSelectedBarValue(null);
            return;
        }

        const currentData = monthlyData;
        const previousData = Array.isArray(previousMonthData) ? previousMonthData : [];
        const currentTotal = currentData.reduce((sum, steps) => sum + (steps || 0), 0);
        const currentAvg = currentData.length > 0 ? Math.round(currentTotal / currentData.length) : 0;
        const currentMinutes = currentTotal / STEPS_PER_MINUTE;
        const currentCals = currentTotal * CALORIES_PER_STEP;
        const currentDistKm = (currentTotal * STEP_LENGTH_METERS) / 1000;

        const prevTotal = previousData.reduce((sum, steps) => sum + (steps || 0), 0);
        const prevMinutes = prevTotal / STEPS_PER_MINUTE;
        const prevCals = prevTotal * CALORIES_PER_STEP;
        const prevDistKm = (prevTotal * STEP_LENGTH_METERS) / 1000;

        const stepsDiff = currentTotal - prevTotal;
        const timeDiffMinutes = Math.round(currentMinutes - prevMinutes);
        const calsDiff = currentCals - prevCals;
        const distDiff = currentDistKm - prevDistKm;

        const formatChangeVal = (diff, lang, fractionDigits = 0) => {
            const prefix = diff >= 0 ? '+' : (lang === 'ar' ? '−' : '-');
            const numDiff = Number(diff);
            if (isNaN(numDiff)) return `+${formatNumber(0, lang, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits })}`;
            return prefix + formatNumber(Math.abs(numDiff), lang, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
        };

        setStepsChange(formatChangeVal(stepsDiff, effectiveLang, 0));
        setTimeChange(formatChangeVal(timeDiffMinutes, effectiveLang, 0));
        setCalorieChange(formatChangeVal(calsDiff, effectiveLang, 1));
        setDistanceChange(formatChangeVal(distDiff, effectiveLang, 2));

        let trendTextValue = t.activityNormal;
        if (prevTotal > 0) {
            const ratio = currentTotal / prevTotal;
            if (ratio > 1.2) trendTextValue = t.activityHigh;
            else if (ratio < 0.8) trendTextValue = t.activityLow;
        } else if (currentTotal > 5000) {
            trendTextValue = t.activityGoodStart;
        } else if (currentTotal > 0) {
            trendTextValue = t.activityModerate;
        }
        setTrendText(trendTextValue);
        
        let activeTimeTextValue = t.activeTimeInsufficient;
        const maxStepsInMonth = Math.max(...currentData.map(d => d || 0));

        if (maxStepsInMonth > 0 && monthStartDate && !isNaN(new Date(monthStartDate).getTime())) {
            const mostActiveDayIndex = currentData.findIndex(d => (d || 0) === maxStepsInMonth);
            
            if (mostActiveDayIndex !== -1) {
                const mostActiveDate = new Date(monthStartDate); 
                mostActiveDate.setUTCDate(mostActiveDate.getUTCDate() + mostActiveDayIndex);

                const locale = effectiveLang === 'ar' ? 'ar-EG-u-ca-gregory' : 'en-US-u-ca-gregory';
                activeTimeTextValue = mostActiveDate.toLocaleDateString(locale, {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    timeZone: 'UTC'
                });
            }
        }
        setActiveTimeText(activeTimeTextValue);

        setTotalSteps(currentTotal);
        setAverageSteps(currentAvg);
        setTimeValue(formatDuration(currentMinutes, effectiveLang));
        setDistanceValue(formatNumber(currentDistKm, effectiveLang, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        setCalorieValue(formatNumber(currentCals, effectiveLang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));

        const numBars = 5;
        const daysInPeriod = currentData.length;
        const chunkSize = Math.max(1, Math.ceil(daysInPeriod / numBars));
        const aggregatedBars = [];
        for (let i = 0; i < daysInPeriod; i += chunkSize) {
            const chunk = currentData.slice(i, i + chunkSize);
            aggregatedBars.push(chunk.reduce((s, v) => s + (v || 0), 0));
        }
        while (aggregatedBars.length < numBars && aggregatedBars.length > 0) aggregatedBars.push(0);
        if (aggregatedBars.length === 0 && daysInPeriod > 0) {
             aggregatedBars.push(currentTotal);
             while(aggregatedBars.length < numBars) aggregatedBars.push(0);
        }
        if(aggregatedBars.length > numBars) aggregatedBars.length = numBars;
        setGraphBarsData(aggregatedBars.length > 0 ? aggregatedBars : Array(numBars).fill(0));

        const dataMax = aggregatedBars.length > 0 ? Math.max(...aggregatedBars, 0) : 0;
        let graphMaxY = Math.max(dataMax * 1.1, 1000);
        if (graphMaxY > 5000) graphMaxY = Math.ceil(graphMaxY / 1000) * 1000;
        else if (graphMaxY > 1000) graphMaxY = Math.ceil(graphMaxY / 500) * 500;
        else graphMaxY = Math.ceil(graphMaxY / 200) * 200;
        if (graphMaxY <= 0) graphMaxY = 1000;
        setMaxStepsForGraph(graphMaxY);

        const newYLabelsCorrectOrder = [];
        for (let i = 0; i <= 4; i++) {
            const val = Math.round((graphMaxY / 4) * i);
            newYLabelsCorrectOrder.push(formatStepsK(val, effectiveLang, t));
        }
        setYAxisLabels(newYLabelsCorrectOrder);

        const labels = [];
        for (let i = 0; i < numBars; i++) {
            const endDay = Math.min(Math.ceil(chunkSize * (i + 1)), daysInPeriod);
            labels.push(endDay > 0 ? formatNumber(endDay, effectiveLang) : (t.emptyValue || ''));
        }
        let monthName = t.defaultMonthName;
        try {
            if (formattedDateRange && formattedDateRange !== "..." && formattedDateRange !== (t.loading || "...")) {
                 const parts = formattedDateRange.split(' ');
                 if (effectiveLang === 'ar') {
                     if (parts.length >= 3 && isNaN(parseInt(parts[parts.length-1]))) monthName = parts[parts.length-1];
                     else if (parts.length >=2 && isNaN(parseInt(parts[parts.length-1]))) monthName = parts[1];
                 } else {
                     if (parts.length > 0 && isNaN(parseInt(parts[0]))) monthName = parts[0];
                     else if (parts.length > 1 && isNaN(parseInt(parts[1]))) monthName = parts[1];
                 }
            }
        } catch (e) { /* ignore */ }
        if (labels.length > 0) labels[0] = monthName;
        setXAxisMonthLabels(labels.length > 0 ? labels : Array(numBars).fill(t.emptyValue));

    }, [monthlyData, previousMonthData, isLoading, formattedDateRange, effectiveLang, t, monthStartDate]);


    const getBarHeight = useCallback((value) => {
        if (maxStepsForGraph <= 0) return '1%';
        const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
        const height = Math.min((numericValue / maxStepsForGraph) * 100, 100);
        return `${value > 0 ? Math.max(height, 1) : 0}%`;
    }, [maxStepsForGraph]);

    const handleBarPress = (index) => {
        const value = graphBarsData[index] ?? 0;
        if (value <= 0) { setSelectedBarIndex(null); setSelectedBarValue(null); return; }
        if (selectedBarIndex === index) { setSelectedBarIndex(null); setSelectedBarValue(null); }
        else { setSelectedBarIndex(index); setSelectedBarValue(value); }
    };
    const handleDismissTooltip = () => { setSelectedBarIndex(null); setSelectedBarValue(null); }

    const S = useMemo(() => styles(theme), [theme]);
    const displayDateRange = isLoading ? t.loading : formattedDateRange;

    const defaultBarAccessibilityLabel = (index, value, lang) => {
        const periodText = lang === 'ar' ? `الفترة ${index + 1}` : `Period ${index + 1}`;
        return `${periodText}, ${formatNumber(value, lang)} ${t.stepsUnit || (lang === 'ar' ? 'خطوة' : 'steps')}`;
    };

    return (
         <ScrollView style={S.container} contentContainerStyle={S.contentContainer}>
            <View style={S.mainCardContainer}>
                <View style={S.topSectionInsideCard}>
                     <View style={S.dateNavigator}>
                         <TouchableOpacity onPress={onNextMonth} disabled={isLoading || isCurrentMonth}>
                            <Icon name="chevron-right" size={28} color={isLoading || isCurrentMonth ? theme.disabledColor : theme.secondaryText} />
                         </TouchableOpacity>
                         <Text style={S.dateText}>{displayDateRange}</Text>
                         <TouchableOpacity onPress={onPreviousMonth} disabled={isLoading}>
                            <Icon name="chevron-left" size={28} color={isLoading ? theme.disabledColor : theme.secondaryText} />
                         </TouchableOpacity>
                     </View>
                     <View style={S.cardSeparator} />
                     <View style={S.summaryContainer}>
                        <View style={S.summaryBox}>
                            <Text style={S.summaryValue}>{isLoading ? formatNumber(0, effectiveLang) : formatNumber(totalSteps, effectiveLang)}</Text>
                            <Text style={S.summaryLabel}>{t.total}</Text>
                        </View>
                        <View style={S.summaryBox}>
                            <Text style={S.summaryValue}>{isLoading ? formatNumber(0, effectiveLang) : formatNumber(averageSteps, effectiveLang)}</Text>
                            <Text style={S.summaryLabel}>{t.average}</Text>
                        </View>
                     </View>
                </View>

                {/* --- FIX IS HERE: FIXED HEIGHT ADDED IN STYLES --- */}
                <View style={S.graphContainerInsideCard}>
                    <View style={S.yAxis}>
                        {yAxisLabels.slice().reverse().map((label, index) =>
                            <Text key={`y-${index}-${label}`} style={S.yAxisLabel}>{label}</Text>
                        )}
                    </View>
                    <Pressable style={S.barsAreaWrapper} onPress={handleDismissTooltip}>
                        <View style={S.barsArea} accessible={true} accessibilityLabel={t.graphAreaAccessibility}>
                            <View style={S.bars}>
                                {graphBarsData.map((value, index) => {
                                    const barHeightStyle = { height: getBarHeight(value) };
                                    const numericValue = typeof value === 'number' && !isNaN(value) ? value : 0;
                                    const isActive = numericValue > 0;
                                    const isSelected = isActive && selectedBarIndex === index;

                                    const accessibilityLabelForBar = typeof t.barAccessibilityLabel === 'function'
                                        ? t.barAccessibilityLabel(index, numericValue, effectiveLang)
                                        : defaultBarAccessibilityLabel(index, numericValue, effectiveLang);

                                    return (
                                        <Pressable
                                            key={`bar-${index}`}
                                            style={S.barWrapper}
                                            onPress={() => isActive && !isLoading ? handleBarPress(index) : handleDismissTooltip()}
                                            disabled={!isActive || isLoading}
                                            hitSlop={5}
                                            accessible={true}
                                            accessibilityLabel={accessibilityLabelForBar}
                                            accessibilityState={{ selected: isSelected, disabled: !isActive || isLoading }}
                                            accessibilityRole="button"
                                        >
                                            {isSelected && !isLoading && selectedBarValue !== null && (
                                                <View style={[
                                                    S.tooltipPositioner,
                                                    {
                                                        bottom: barHeightStyle.height,
                                                        marginBottom: TOOLTIP_VERTICAL_OFFSET
                                                    }
                                                ]}>
                                                    <View style={S.tooltipContainer}>
                                                        <Text style={S.tooltipText}>
                                                            {formatNumber(selectedBarValue, effectiveLang)}
                                                        </Text>
                                                    </View>
                                                    <View style={S.tooltipPointer} />
                                                </View>
                                            )}
                                            <View style={[
                                                S.bar,
                                                barHeightStyle,
                                                !isActive && S.inactiveBar,
                                                isSelected ? S.selectedBar : (isActive ? S.activeBar : {}),
                                            ]} />
                                        </Pressable>
                                    );
                                })}
                            </View>
                            <View style={S.xAxis}>
                                {xAxisMonthLabels.map((label, index) => (
                                    <Text key={`x-${index}-${label}`} style={S.xAxisLabel}>{label}</Text>
                                ))}
                            </View>
                        </View>
                    </Pressable>
                </View>
                <View style={{ height: 10 }}/>
            </View>

            <View style={S.titleContainer}>
                <Text style={S.sectionTitle}>{t.vsLast30Days}</Text>
            </View>
            <View style={S.detailsContainer}>
                <View style={S.detailRow}>
                    <Text style={S.detailValue}>{stepsChange}</Text>
                    <Text style={S.detailLabel}>{t.stepsUnit}</Text>
                </View>
                <View style={S.detailRow}>
                    <Text style={S.detailValueSmall}>{trendText}</Text>
                    <Text style={S.detailLabel}>{t.trends}</Text>
                </View>
                <View style={[S.detailRow, S.detailRowLast]}>
                    <Text style={S.detailValueSmall}>{activeTimeText}</Text>
                    <Text style={S.detailLabel}>{t.mostActiveTime}</Text>
                </View>
            </View>
            <View style={S.iconStatsCard}>
                <View style={S.iconStatBox}>
                    <View style={S.iconBackground}><Icon name="clock-time-four-outline" size={24} color={theme.accentColor} /></View>
                    <Text style={S.iconStatValue}>{timeValue} <Text style={S.iconStatUnit}>{t.hoursUnit}</Text></Text>
                    <Text style={S.iconStatChange}>{timeChange} {t.minutesUnit}</Text>
                </View>
                <View style={S.iconStatBox}>
                    <View style={S.iconBackground}><Icon name="map-marker-outline" size={24} color={theme.accentColor} /></View>
                    <Text style={S.iconStatValue}>{distanceValue} <Text style={S.iconStatUnit}>{t.kmUnit}</Text></Text>
                    <Text style={S.iconStatChange}>{distanceChange} {t.kmUnit}</Text>
                </View>
                <View style={S.iconStatBox}>
                    <View style={S.iconBackground}><Icon name="fire" size={24} color={theme.accentColor} /></View>
                    <Text style={S.iconStatValue}>{calorieValue} <Text style={S.iconStatUnit}>{t.kcalUnit}</Text></Text>
                    <Text style={S.iconStatChange}>{calorieChange} {t.calUnit}</Text>
                </View>
            </View>

            <View style={{ height: 30 }} />
        </ScrollView>
    );
};

const styles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.backgroundColor, },
    contentContainer: { paddingBottom: 10, paddingTop: 10, },
    mainCardContainer: {
        backgroundColor: theme.cardBackgroundColor,
        borderRadius: 12, marginHorizontal: 15, marginTop: 5, marginBottom: 20,
        shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 4,
        elevation: Platform.OS === 'android' ? (theme === darkTheme ? 1 : 2) : undefined,
        overflow: 'hidden',
    },
    topSectionInsideCard: {},
    dateNavigator: {
        flexDirection: 'row',
        justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 15,
    },
    dateText: {
        fontSize: 18, fontWeight: 'bold', color: theme.primaryText,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        minWidth: 150, textAlign: 'center',
    },
    cardSeparator: { height: 1, backgroundColor: theme.separatorColor, marginHorizontal: 20, },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 10,
    },
    summaryBox: { alignItems: 'center', minWidth: 80, flex: 1 },
    summaryValue: {
        fontSize: 32, fontWeight: 'bold', color: theme.highlightColor,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontVariant: ['tabular-nums'],
    },
    summaryLabel: {
        fontSize: 14, color: theme.secondaryText, marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    
    // --- IMPORTANT FIX: Fixed Height is applied here ---
    graphContainerInsideCard: {
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', // Ensures correct graph direction
        paddingHorizontal: 15, 
        paddingTop: 30, 
        height: 300,  // <--- FIXED HEIGHT PREVENTS INFINITE SCROLL BUG
        paddingBottom: 10,
        alignItems: 'stretch'
    },
    
    yAxis: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingRight: 8,
        height: '100%', paddingBottom: 25,
    },
    yAxisLabel: {
        fontSize: 11, color: theme.secondaryText,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', fontVariant: ['tabular-nums'],
    },
    barsAreaWrapper: {
        flex: 1,
        marginLeft: 5,
        height: '100%' // Ensure it takes the full fixed height
    },
    barsArea: {
        flex: 1, position: 'relative',
        borderBottomWidth: 1, borderBottomColor: theme.graphLineColor,
        marginBottom: 25,
    },
    bars: {
        position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
        flexDirection: 'row',
        justifyContent: 'space-around', alignItems: 'flex-end',
        paddingHorizontal: '2%',
    },
    barWrapper: {
        flex: 1, height: '100%',
        justifyContent: 'flex-end', alignItems: 'center',
        position: 'relative', overflow: 'visible',
    },
    bar: {
        width: 12,
        borderTopLeftRadius: 6, borderTopRightRadius: 6,
    },
    activeBar: {
        backgroundColor: theme.barDefault,
        minHeight: 2,
    },
    inactiveBar: {
        backgroundColor: theme.barInactive,
        height: 2, minHeight: 2,
        borderTopLeftRadius: 0, borderTopRightRadius: 0,
    },
    selectedBar: {
        backgroundColor: theme.barSelected,
        minHeight: 2,
    },
    xAxis: {
        position: 'absolute', bottom: -25, left: 0, right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around', height: 20,
        paddingHorizontal: '2%',
    },
    xAxisLabel: {
        fontSize: 11, color: theme.secondaryText, textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        flex: 1, fontVariant: ['tabular-nums'],
    },
    tooltipPositioner: {
        position: 'absolute', left: '50%', transform: [{ translateX: -(TOOLTIP_WIDTH / 2) }],
        alignItems: 'center', zIndex: 10,
        elevation: Platform.OS === 'android' ? 3 : undefined,
        minWidth: TOOLTIP_WIDTH, width: TOOLTIP_WIDTH, pointerEvents: 'none',
    },
    tooltipContainer: {
        backgroundColor: theme.tooltipBg, borderRadius: 5,
        paddingVertical: 5, paddingHorizontal: 8,
        shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3, shadowRadius: 2,
        width: '100%', alignItems: 'center',
    },
    tooltipText: {
        color: theme.tooltipText, fontSize: 12, fontWeight: 'bold',
        fontVariant: ['tabular-nums'], textAlign: 'center',
    },
    tooltipPointer: {
        width: 0, height: 0,
        borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: TOOLTIP_POINTER_HEIGHT,
        borderStyle: 'solid', backgroundColor: 'transparent',
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: theme.tooltipBg, marginTop: -1,
    },
    titleContainer: { 
        paddingHorizontal: 20, paddingTop: 25, paddingBottom: 15,
        alignItems: I18nManager.isRTL ? 'flex-end' : 'flex-start',
    },
    sectionTitle: {
        fontSize: 18, fontWeight: 'bold', color: theme.primaryText,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        textAlign: I18nManager.isRTL ? 'right' : 'left',
    },
    detailsContainer: {
        backgroundColor: theme.cardBackgroundColor,
        borderRadius: 12, marginHorizontal: 15,
        paddingVertical: 5, paddingHorizontal: 20, marginBottom: 20,
        shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 4,
        elevation: Platform.OS === 'android' ? (theme === darkTheme ? 1 : 2) : undefined,
    },
    detailRow: {
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 16,
        borderBottomWidth: 1, 
        borderBottomColor: theme.separatorColor,
    },
    detailRowLast: { borderBottomWidth: 0, },
    detailLabel: {
        fontSize: 16,
        color: theme.secondaryText,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    detailValue: {
        fontSize: 18, 
        fontWeight: 'bold', 
        color: theme.accentColor,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        fontVariant: ['tabular-nums'],
    },
    detailValueSmall: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.accentColor,
        textAlign: I18nManager.isRTL ? 'right' : 'left',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', 
        fontVariant: ['tabular-nums'],
        flex: 1, 
        marginRight: I18nManager.isRTL ? 0 : 8,
        marginLeft: I18nManager.isRTL ? 8 : 0,
    },
    iconStatsCard: {
        flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
        justifyContent: 'space-around', paddingHorizontal: 10, paddingVertical: 20,
        marginHorizontal: 15, backgroundColor: theme.cardBackgroundColor, borderRadius: 12,
        shadowColor: theme.shadowColor, shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08, shadowRadius: 4,
        elevation: Platform.OS === 'android' ? (theme === darkTheme ? 1 : 2) : undefined,
    },
    iconStatBox: { alignItems: 'center', flex: 1, paddingHorizontal: 5, },
    iconBackground: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: theme.iconBgColor,
        justifyContent: 'center', alignItems: 'center', marginBottom: 10,
    },
    iconStatValue: {
        fontSize: 16, fontWeight: 'bold', color: theme.highlightColor, marginBottom: 2,
        textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        fontVariant: ['tabular-nums'],
    },
    iconStatUnit: {
        fontSize: 11, fontWeight: 'normal', color: theme.secondaryText,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    iconStatChange: {
        fontSize: 13, color: theme.accentColor, marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
        fontVariant: ['tabular-nums'], textAlign: 'center',
    },
});

export default MonthlySteps;