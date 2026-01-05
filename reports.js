import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
    SafeAreaView, View, Text, StyleSheet, ScrollView,
    Dimensions, I18nManager, ActivityIndicator, TouchableOpacity,
    Alert, Platform
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabaseClient';

// --- الثوابت والمفاتيح ---
const WEIGHT_HISTORY_KEY = '@WeightTracker:history';
const SETTINGS_KEY = '@Settings:generalSettings';
const STEPS_HISTORY_KEY = '@Steps:DailyHistory';
const FOOD_LOG_PREFIX = 'mealsData_';
const WATER_DATA_PREFIX = 'waterData_';
const USER_SUBSCRIPTION_DATA_KEY = '@App:userSubscriptionData';

const translations = {
    ar: {
        title: 'التقارير الصحية',
        week: 'أسبوعي',
        month: 'شهري',
        weight: 'الوزن',
        bmi: 'مؤشر كتلة الجسم',
        avgDailySteps: 'متوسط الخطوات',
        avgDailyKm: 'المسافة (كم)',
        avgCaloriesBurned: 'حرق السعرات',
        avgActiveTime: 'الوقت النشط',
        avgDailyWater: 'الماء',
        weeklyActivity: 'النشاط الأسبوعي',
        monthlyActivity: 'النشاط الشهري',
        steps: 'خطوات',
        caloriesConsumed: 'السعرات',
        kg: 'كجم',
        hrs: 'ساعة',
        mlUnit: 'مل',
        loading: 'جاري تحميل البيانات...',
        
        dayNames: ["ﺃﺣﺪ", "ﺍﺛﻨﻴﻦ", "ﺛﻼﺛﺎﺀ", "ﺃﺭﺑﻌﺎﺀ", "ﺧﻤﻴﺲ", "ﺟﻤﻌﺔ", "ﺳﺒﺖ"], 
        weekLabels: ["ﺃﺳﺒﻮﻉ 4", "ﺃﺳﺒﻮﻉ 3", "ﺃﺳﺒﻮﻉ 2", "ﺃﺳﺒﻮﻉ 1"],
        vsLastWeek: 'مقارنة بالأسبوع الماضي',
        vsLastMonth: 'مقارنة بالشهر الماضي',
        increase: 'زيادة',
        decrease: 'نقصان',
        stable: 'مستقر',
        shareReport: 'مشاركة',
        shareError: 'خطأ',
        shareMessage: 'تقريري الصحي',
        sharingNotAvailable: 'المشاركة غير متاحة',
        premiumFeatureTitle: 'ميزة مميزة',
        upgradePrompt: 'للترقية',
        upgrade: 'ترقية',
    },
    en: {
        title: 'Health Reports', week: 'Weekly', month: 'Monthly', weight: 'WEIGHT', bmi: 'BMI', avgDailySteps: 'AVG STEPS', avgDailyKm: 'AVG KM', avgCaloriesBurned: 'AVG CALORIES', avgActiveTime: 'ACTIVE TIME', avgDailyWater: 'AVG WATER', weeklyActivity: 'Weekly Activity', monthlyActivity: 'Monthly Activity', steps: 'Steps', caloriesConsumed: 'Calories', kg: 'kg', hrs: 'hrs', mlUnit: 'ml', loading: 'Loading...',
        dayNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        vsLastWeek: 'vs Last Week', vsLastMonth: 'vs Last Month', increase: 'Increase', decrease: 'Decrease', stable: 'Stable', shareReport: 'Share', shareError: 'Error', shareMessage: 'My Health Report', sharingNotAvailable: 'N/A',
        premiumFeatureTitle: 'Premium', upgradePrompt: 'Upgrade to access', upgrade: 'Upgrade',
    },
};

const getLocalDateString = (date) => { const d = new Date(date); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().split('T')[0]; };
const addDays = (date, days) => { const res = new Date(date); res.setDate(res.getDate() + days); return res; };

const ComparisonCard = React.memo(({ value, label, unit, comparisonText, changePercent, styles }) => {
    const isIncrease = changePercent > 0;
    const isDecrease = changePercent < 0;
    const changeColor = isIncrease ? '#4CAF50' : (isDecrease ? '#F44336' : styles.summaryLabel.color);
    const iconName = isIncrease ? 'arrow-top-right' : (isDecrease ? 'arrow-bottom-right' : 'minus');
    return (
        <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{value}{unit && <Text style={styles.summaryUnit}> {unit}</Text>}</Text>
            <Text style={styles.summaryLabel}>{label}</Text>
            {comparisonText && (
                <View style={[styles.changeBadge, { backgroundColor: changeColor }]}>
                    <Icon name={iconName} size={12} color="#fff" />
                    <Text style={styles.changeText}>{Math.abs(changePercent).toFixed(0)}%</Text>
                </View>
            )}
        </View>
    );
});

const PremiumLockView = ({ t, styles, onUpgrade }) => (
    <View style={styles.premiumLockOverlay}>
        <View style={styles.premiumLockContentBox}>
            <Icon name="lock-outline" size={50} color={styles.premiumLockIcon.color} />
            <Text style={styles.premiumLockTitle}>{t.premiumFeatureTitle}</Text>
            <Text style={styles.premiumLockMessage}>{t.upgradePrompt}</Text>
            <TouchableOpacity style={styles.premiumLockButton} onPress={onUpgrade}>
                <Text style={styles.premiumLockButtonText}>{t.upgrade}</Text>
            </TouchableOpacity>
        </View>
    </View>
);

const ReportsScreen = ({ navigation, language, isDarkMode }) => {
    const t = useMemo(() => translations[language] || translations.en, [language]);
    const styles = useMemo(() => getStyles(isDarkMode), [isDarkMode]);

    const [isLoading, setIsLoading] = useState(true);
    const [isUserPremium, setIsUserPremium] = useState(false);
    const [period, setPeriod] = useState('week');
    const reportContainerRef = useRef(null);
    const [reportData, setReportData] = useState({ weight: '0.0', bmi: '0.0', avgSteps: '0', avgKm: '0.0', avgCaloriesBurned: '0', avgActiveHours: '0.0', avgWater: '0' });
    const [comparisonData, setComparisonData] = useState({ steps: 0, km: 0, caloriesBurned: 0, activeHours: 0, water: 0 });
    const [chartData, setChartData] = useState({ labels: [], datasets: [{ data: [] }] });
    const [tooltip, setTooltip] = useState(null);

    useFocusEffect(useCallback(() => {
        const checkStatusAndFetchData = async () => {
            setIsLoading(true);
            try {
                const subscriptionDataString = await AsyncStorage.getItem(USER_SUBSCRIPTION_DATA_KEY);
                let isPremium = false;
                if (subscriptionDataString) {
                    const subscriptionData = JSON.parse(subscriptionDataString);
                    if (subscriptionData.expiryDate && Date.now() < subscriptionData.expiryDate) {
                        isPremium = true;
                    } else if (subscriptionData.expiryDate) {
                        await AsyncStorage.removeItem(USER_SUBSCRIPTION_DATA_KEY);
                    }
                }
                setIsUserPremium(isPremium);
                await fetchData();
            } catch (e) {
                console.error("Fetch error", e);
                setIsUserPremium(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkStatusAndFetchData();
    }, [language, period]));

    const fetchData = async () => {
        try {
            const daysInPeriod = period === 'week' ? 7 : 30;
            const today = new Date();

            const currentPeriodDates = Array.from({ length: daysInPeriod }).map((_, i) => {
                return addDays(today, i - (daysInPeriod - 1));
            });
            const previousPeriodDates = Array.from({ length: daysInPeriod }).map((_, i) => {
                return addDays(today, i - (daysInPeriod * 2 - 1));
            });
            const allDates = [...previousPeriodDates, ...currentPeriodDates];
            const allDateStrings = allDates.map(d => getLocalDateString(d));

            const foodLogKeys = allDateStrings.map(dateStr => `${FOOD_LOG_PREFIX}${dateStr}`);
            const waterLogKeys = allDateStrings.map(dateStr => `${WATER_DATA_PREFIX}${dateStr}`);
            const keysToFetch = [WEIGHT_HISTORY_KEY, SETTINGS_KEY, STEPS_HISTORY_KEY, ...foodLogKeys, ...waterLogKeys];
            const storedData = await AsyncStorage.multiGet(keysToFetch);
            const dataMap = new Map(storedData);
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const localSteps = JSON.parse(dataMap.get(STEPS_HISTORY_KEY) || '{}');
                if (Object.keys(localSteps).length === 0) {
                    const { data: cloudSteps } = await supabase
                        .from('steps')
                        .select('date, step_count')
                        .eq('user_id', user.id)
                        .in('date', allDateStrings);

                    if (cloudSteps) {
                        const newStepsMap = {};
                        cloudSteps.forEach(s => newStepsMap[s.date] = s.step_count);
                        dataMap.set(STEPS_HISTORY_KEY, JSON.stringify(newStepsMap));
                        await AsyncStorage.setItem(STEPS_HISTORY_KEY, JSON.stringify(newStepsMap));
                    }
                }
            }
            const processPeriodData = (periodDates) => {
                const periodDateStrings = periodDates.map(d => getLocalDateString(d));
                const stepsHistory = JSON.parse(dataMap.get(STEPS_HISTORY_KEY) || '{}');
                const dailySteps = periodDateStrings.map(dateStr => stepsHistory[dateStr] || 0);
                const totalSteps = dailySteps.reduce((sum, s) => sum + s, 0);
                const foodLogs = periodDateStrings.map(dateStr => JSON.parse(dataMap.get(`${FOOD_LOG_PREFIX}${dateStr}`) || '{}'));
                const dailyCaloriesConsumed = foodLogs.map(log => log.totalCalories || 0);
                const waterLogs = periodDateStrings.map(dateStr => JSON.parse(dataMap.get(`${WATER_DATA_PREFIX}${dateStr}`) || '{}'));
                const dailyWaterConsumed = waterLogs.map(log => (log.waterHistory || []).reduce((sum, entry) => sum + (entry.amount || 0), 0));
                const totalWater = dailyWaterConsumed.reduce((sum, w) => sum + w, 0);
                return {
                    avgSteps: totalSteps > 0 ? totalSteps / periodDates.length : 0,
                    avgKm: totalSteps > 0 ? ((totalSteps * 0.762) / 1000) / periodDates.length : 0,
                    avgCaloriesBurned: totalSteps > 0 ? (totalSteps * 0.04) / periodDates.length : 0,
                    avgActiveHours: totalSteps > 0 ? ((totalSteps / 100) / periodDates.length) / 60 : 0,
                    avgWater: totalWater > 0 ? totalWater / periodDates.length : 0,
                    dailySteps,
                    dailyCaloriesConsumed,
                };
            };

            const currentData = processPeriodData(currentPeriodDates);
            const previousData = processPeriodData(previousPeriodDates);
            const weightHistory = JSON.parse(dataMap.get(WEIGHT_HISTORY_KEY) || '[]');
            let currentWeight = 0;
            if (weightHistory.length > 0) { currentWeight = [...weightHistory].sort((a, b) => new Date(b.date) - new Date(a.date))[0].weight || 0; }
            const settings = JSON.parse(dataMap.get(SETTINGS_KEY) || '{}');
            const heightFromSettings = settings.height;
            let bmiDisplayValue = '---';
            if (currentWeight > 0 && heightFromSettings && !isNaN(parseFloat(heightFromSettings))) {
                const heightInMeters = parseFloat(heightFromSettings) / 100;
                if (heightInMeters > 0) { bmiDisplayValue = (currentWeight / (heightInMeters * heightInMeters)).toFixed(1); }
            }

            setReportData({
                weight: currentWeight.toFixed(1),
                bmi: bmiDisplayValue,
                avgSteps: Math.round(currentData.avgSteps).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
                avgKm: currentData.avgKm.toFixed(1),
                avgCaloriesBurned: Math.round(currentData.avgCaloriesBurned).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
                avgActiveHours: currentData.avgActiveHours.toFixed(1),
                avgWater: Math.round(currentData.avgWater).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US'),
            });

            const calculateChange = (current, previous) => (previous > 0 ? ((current - previous) / previous) * 100 : (current > 0 ? 100 : 0));
            setComparisonData({
                steps: calculateChange(currentData.avgSteps, previousData.avgSteps),
                km: calculateChange(currentData.avgKm, previousData.avgKm),
                caloriesBurned: calculateChange(currentData.avgCaloriesBurned, previousData.avgCaloriesBurned),
                activeHours: calculateChange(currentData.avgActiveHours, previousData.avgActiveHours),
                water: calculateChange(currentData.avgWater, previousData.avgWater),
            });
            
            let labels, stepsDataset, caloriesDataset;
            if (period === 'week') {
                labels = currentPeriodDates.map(date => {
                    const jsDayIndex = date.getDay(); 
                    
                    if (language === 'ar') {
                        let customIndex = 0;
                        if (jsDayIndex === 1) customIndex = 0;      
                        else if (jsDayIndex === 0) customIndex = 1; 
                        else if (jsDayIndex === 6) customIndex = 2; 
                        else if (jsDayIndex === 5) customIndex = 3; 
                        else if (jsDayIndex === 4) customIndex = 4; 
                        else if (jsDayIndex === 3) customIndex = 5; 
                        else if (jsDayIndex === 2) customIndex = 6; 
                        return t.dayNames[customIndex];
                    }
                    return t.dayNames[jsDayIndex]; 
                });
                
                stepsDataset = currentData.dailySteps;
                caloriesDataset = currentData.dailyCaloriesConsumed;
            } else {
                labels = t.weekLabels;
                stepsDataset = [0, 0, 0, 0];
                caloriesDataset = [0, 0, 0, 0];
                for (let i = 0; i < 30; i++) {
                    const weekIndex = Math.floor(i / 7);
                    if (weekIndex < 4) {
                        stepsDataset[weekIndex] += currentData.dailySteps[i] || 0;
                        caloriesDataset[weekIndex] += currentData.dailyCaloriesConsumed[i] || 0;
                    }
                }
            }

            setChartData({
                labels,
                datasets: [
                    { data: stepsDataset.length > 0 ? stepsDataset : [0], color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`, strokeWidth: 3, legend: t.steps },
                    { data: caloriesDataset.length > 0 ? caloriesDataset : [0], color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`, strokeWidth: 3, legend: t.caloriesConsumed }
                ],
            });

        } catch (error) {
            console.error("Error fetching report data:", error);
        }
    };

    const handleShareReport = useCallback(async () => {
        try {
            const uri = await reportContainerRef.current.capture();
            if (!(await Sharing.isAvailableAsync())) { Alert.alert(t.shareError, t.sharingNotAvailable); return; }
            await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: t.shareMessage, UTI: 'public.png' });
        } catch (error) { Alert.alert(t.shareError, error.message); }
    }, [t]);

    const chartConfig = {
        backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        backgroundGradientFrom: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        backgroundGradientTo: isDarkMode ? '#1E1E1E' : '#FFFFFF',
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(120, 120, 120, ${opacity})`,
        labelColor: (opacity = 1) => isDarkMode ? `rgba(224, 224, 224, ${opacity})` : `rgba(50, 50, 50, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: { r: '4', strokeWidth: '2', stroke: isDarkMode ? '#00796B' : '#388e3c' },
        propsForLabels: { fontSize: 10, fontWeight: 'bold' },
        propsForBackgroundLines: {
             strokeDasharray: "", 
             strokeWidth: 1,
             stroke: isDarkMode ? '#333' : '#F0F0F0' 
        },
        paddingRight: 30,
        paddingLeft: 30,
        count: 5 
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={isDarkMode ? '#4CAF50' : '#388e3c'} />
                <Text style={styles.loadingText}>{t.loading}</Text>
            </SafeAreaView>
        );
    }

    const comparisonLabel = period === 'week' ? t.vsLastWeek : t.vsLastMonth;
    const isChartDataValid = chartData.datasets.length > 0 && chartData.datasets.every(ds => ds.data && ds.data.length > 0) && chartData.labels.length > 0;

    const chartWidth = Dimensions.get('window').width - 55;

    let tooltipStyle = {};
    const tooltipWidth = 100;
    const tooltipHeight = 45;
    
    if (tooltip) {
        let left = tooltip.x - (tooltipWidth / 2);
        let top = tooltip.y - tooltipHeight - -3;
        
        // --- دي الفرامل (بنحطها في الأول عشان نضمن الأساسيات) ---
        if (left < 0) left = 0;
        if (left + tooltipWidth > chartWidth) left = chartWidth - tooltipWidth;
        
        // --- تعديلات الشهر (الكود القديم) ---
        if (period === 'month') {
            if (tooltip.index === 0) {
                // أسبوع 4 (الشمال)
                left = left - 6; 
            } else if (tooltip.index === 3) {
                // أسبوع 1 (اليمين)
                left = left + 25; 
            } else {
                // اللي في النص
                left = left + 25; 
            }
        }
        // --- هنا التعديل بتاع الجمعة والسبت ---
        else if (period === 'week') {
            // يوم السبت (آخر يوم في الاسبوع على اليمين)
            if (tooltip.index === 6) {
                left = left - -10; // بنرجعه شمال 25 نقطة عشان يدخل جوا الشاشة
            } 
            // يوم الجمعة (اللي قبل الأخير)
            else if (tooltip.index === 0) {
                left = left - 25; // بنرجعه شمال شوية بسيطة
            }
        }

        tooltipStyle = { 
            position: 'absolute', 
            top: top, 
            left: left, 
            width: tooltipWidth, 
            height: tooltipHeight, 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 100 
        };
    }

    let rightAxisLabels = [];
    if (isChartDataValid) {
        const allDataPoints = chartData.datasets.reduce((acc, ds) => [...acc, ...ds.data], []);
        let maxValue = Math.max(...allDataPoints);
        if (maxValue === 0) maxValue = 100;
        for (let i = 4; i >= 0; i--) {
            rightAxisLabels.push(Math.round((maxValue / 4) * i));
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView>
                <ViewShot ref={reportContainerRef} options={{ format: 'png', quality: 0.9 }}>
                    <View style={styles.reportContainer} collapsable={false}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{t.title}</Text>
                            <TouchableOpacity onPress={handleShareReport} style={styles.shareIcon}>
                                <Icon name="share-variant" size={24} color={isDarkMode ? '#E0E0E0' : '#2e7d32'} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.periodSelector}>
                            <TouchableOpacity style={[styles.periodButton, period === 'week' && styles.activePeriod]} onPress={() => setPeriod('week')}>
                                <Text style={[styles.periodText, period === 'week' && styles.activePeriodText]}>{t.week}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.periodButton, period === 'month' && styles.activePeriod]} onPress={() => setPeriod('month')}>
                                <Text style={[styles.periodText, period === 'month' && styles.activePeriodText]}>{t.month}</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.summaryGrid}>
                            <ComparisonCard value={reportData.weight} label={t.weight} unit={t.kg} styles={styles} />
                            <ComparisonCard value={reportData.bmi} label={t.bmi} styles={styles} />
                            <ComparisonCard value={reportData.avgSteps} label={t.avgDailySteps} comparisonText={comparisonLabel} changePercent={comparisonData.steps} styles={styles} />
                            <ComparisonCard value={reportData.avgKm} label={t.avgDailyKm} comparisonText={comparisonLabel} changePercent={comparisonData.km} styles={styles} />
                            <ComparisonCard value={reportData.avgWater} label={t.avgDailyWater} unit={t.mlUnit} comparisonText={comparisonLabel} changePercent={comparisonData.water} styles={styles} />
                            <ComparisonCard value={reportData.avgCaloriesBurned} label={t.avgCaloriesBurned} comparisonText={comparisonLabel} changePercent={comparisonData.caloriesBurned} styles={styles} />
                            <ComparisonCard value={reportData.avgActiveHours} label={t.avgActiveTime} unit={t.hrs} comparisonText={comparisonLabel} changePercent={comparisonData.activeHours} styles={styles} />
                        </View>
                        
                        <View style={styles.chartContainer}>
                            <Text style={styles.chartTitle}>{period === 'week' ? t.weeklyActivity : t.monthlyActivity}</Text>

                            <View style={styles.legendContainer}>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: 'rgba(76, 175, 80, 1)' }]} />
                                    <Text style={styles.legendText}>{t.steps}</Text>
                                </View>
                                <View style={styles.legendItem}>
                                    <View style={[styles.legendDot, { backgroundColor: 'rgba(255, 152, 0, 1)' }]} />
                                    <Text style={styles.legendText}>{t.caloriesConsumed}</Text>
                                </View>
                            </View>
                            
                            {isChartDataValid ? (
                                <View style={{ alignItems: 'center', position: 'relative', width: '100%' }}>
                                    
                                    <View style={{ direction: 'ltr', width: '100%', alignItems: 'center' }}>
                                        
                                        <View style={{ width: chartWidth, position: 'relative' }}>

                                            <View style={{
                                                borderRadius: 16,
                                                overflow: 'hidden',
                                                backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                                                width: '100%'
                                            }}>
                                                <LineChart
                                                    data={chartData}
                                                    width={chartWidth} 
                                                    height={240}
                                                    chartConfig={chartConfig}
                                                    bezier
                                                    style={{ 
                                                        borderRadius: 16,
                                                        marginVertical: 8,
                                                        paddingRight: period === 'month' ? 20 : 25, 
                                                        paddingLeft: period === 'month' ? 25 : 0,  
                                                    }}
                                                    fromZero
                                                    withInnerLines={true}
                                                    segments={4}
                                                    formatYLabel={(y) => language === 'ar' ? '' : Math.round(y).toString()} 
                                                    withVerticalLines={false}
                                                    xLabelsOffset={period === 'month' ? -5 : 0}
                                                    onDataPointClick={({ value, x, y, index, dataset }) => {
                                                        const datasetIndex = chartData.datasets.findIndex(d => d.legend === dataset.legend);
                                                        if (tooltip && tooltip.index === index && tooltip.datasetIndex === datasetIndex) {
                                                            setTooltip(null);
                                                        } else {
                                                            const unit = datasetIndex === 0 ? ` ${t.steps}` : ` ${t.caloriesConsumed}`;
                                                            setTooltip({ x, y, value, index, datasetIndex, unit });
                                                        }
                                                    }}
                                                />
                                            </View>

                                            {tooltip && (
                                                <View style={tooltipStyle}>
                                                    <View style={styles.tooltipContainer}>
                                                        <Text style={styles.tooltipText} numberOfLines={1}>
                                                            {Math.round(tooltip.value).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}{tooltip.unit}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.tooltipArrow} />
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {language === 'ar' && (
                                        <View style={[styles.rightAxisContainer, { right: 285 }]}> 
                                            {rightAxisLabels.map((label, index) => (
                                                <Text key={index} style={styles.rightAxisText}>{label}</Text>
                                            ))}
                                        </View>
                                    )}

                                </View>
                            ) : (
                                <View style={{ height: 240, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: isDarkMode ? '#777' : '#999' }}>No Data Available</Text></View>
                            )}
                        </View>
                      
                    </View>
                </ViewShot>
            </ScrollView>
            {!isUserPremium &&
                <PremiumLockView t={t} styles={styles} onUpgrade={() => navigation.navigate('PremiumScreen')} />
            }
        </SafeAreaView>
    );
};

const getStyles = (isDark) => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: isDark ? '#121212' : '#F7FDF9' },
    reportContainer: { padding: 20, paddingBottom: 40, backgroundColor: isDark ? '#121212' : '#F7FDF9' },
    header: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, position: 'relative' },
    title: { fontSize: 26, fontWeight: 'bold', color: isDark ? '#E0E0E0' : '#2e7d32', textAlign: 'center' },
    shareIcon: { position: 'absolute', [I18nManager.isRTL ? 'left' : 'right']: 0, padding: 5 },
    loadingText: { marginTop: 10, color: isDark ? '#999' : '#555' },
    periodSelector: { flexDirection: 'row', backgroundColor: isDark ? '#2C2C2C' : '#E8F5E9', borderRadius: 20, overflow: 'hidden', width: '80%', alignSelf: 'center', marginBottom: 24 },
    periodButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
    activePeriod: { backgroundColor: isDark ? '#00796B' : '#388e3c', borderRadius: 20 },
    periodText: { fontSize: 16, fontWeight: 'bold', color: isDark ? '#80CBC4' : '#388e3c' },
    activePeriodText: { color: isDark ? '#E0E0E0' : '#FFFFFF' },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    summaryCard: { width: '48%', backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, paddingVertical: 20, paddingHorizontal: 10, marginBottom: 16, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 4, elevation: 4 },
    summaryValue: { fontSize: 26, fontWeight: 'bold', color: isDark ? '#81C784' : '#388e3c', fontVariant: ['tabular-nums'] },
    summaryUnit: { fontSize: 14, fontWeight: 'normal', color: isDark ? '#81C784' : '#388e3c' },
    summaryLabel: { fontSize: 11, color: isDark ? '#B0B0B0' : '#757575', marginTop: 8, textAlign: 'center' },
    changeBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 10 },
    changeText: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginLeft: 4 },
    chartContainer: { marginTop: 20, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, paddingVertical: 20, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 4, elevation: 4 },
    chartTitle: { fontSize: 18, fontWeight: '600', color: isDark ? '#E0E0E0' : '#34495e', marginBottom: 10, alignSelf: 'flex-start', paddingLeft: 20 },
    legendContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15, marginTop: -5 },
    legendItem: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 15 },
    legendDot: { width: 12, height: 12, borderRadius: 6, marginRight: 8 },
    legendText: { fontSize: 14, color: isDark ? '#B0B0B0' : '#757575' },

    tooltipContainer: { width: 120, backgroundColor: 'black', paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6, elevation: 5, alignItems: 'center' },
    tooltipText: { color: 'white', fontWeight: 'bold', textAlign: 'center' },
    tooltipArrow: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 6, borderStyle: 'solid', backgroundColor: 'transparent', borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: 'black', marginTop: -1 },

    rightAxisContainer: {
        position: 'absolute',
        right: 293,     
        top: 25,       
        bottom: 55,    
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    rightAxisText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: isDark ? '#B0B0B0' : 'rgba(50, 50, 50, 0.7)',
        backgroundColor: 'transparent',
    },

    premiumLockOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? 'rgba(18, 18, 18, 0.9)' : 'rgba(247, 253, 249, 0.95)', zIndex: 10 },
    premiumLockContentBox: { width: '90%', maxWidth: 400, backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderRadius: 16, padding: 30, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
    premiumLockIcon: { color: '#4CAF50', marginBottom: 20 },
    premiumLockTitle: { fontSize: 22, fontWeight: 'bold', color: isDark ? '#E0E0E0' : '#333', textAlign: 'center', marginBottom: 15 },
    premiumLockMessage: { fontSize: 16, color: isDark ? '#B0B0B0' : '#757575', textAlign: 'center', lineHeight: 24, marginBottom: 30 },
    premiumLockButton: { backgroundColor: '#4CAF50', paddingVertical: 15, paddingHorizontal: 50, borderRadius: 30 },
    premiumLockButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
});

export default ReportsScreen;