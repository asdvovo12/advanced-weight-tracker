// AchievementsScreen.js
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, LayoutAnimation, UIManager, Platform, SafeAreaView, ActivityIndicator, I18nManager, useColorScheme, Dimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

if (Platform.OS === 'android') { if (UIManager.setLayoutAnimationEnabledExperimental) UIManager.setLayoutAnimationEnabledExperimental(true); }

const TOTAL_ACCUMULATED_STEPS_KEY = '@Steps:TotalAccumulatedSteps';
const CONSECUTIVE_GOAL_DAYS_KEY = '@Achievements:consecutiveGoalDays';
const MAX_COMPLETED_CHALLENGE_DAYS_KEY = '@Achievements:maxCompletedChallengeDays';
const CELEBRATE_TIER_COMPLETION_KEY = '@Achievements:celebrateTierCompletion';
const APP_LANGUAGE_KEY = '@App:language';
const APP_DARK_MODE_KEY = '@App:darkMode';
const LAST_CELEBRATED_LEVEL_KEY = '@Achievements:lastCelebratedLevel';
const LAST_CELEBRATED_DAILY_STEPS_MILESTONE_KEY = '@Achievements:lastCelebratedDailyStepsMilestone';
const LAST_CELEBRATED_CONSECUTIVE_DAYS_MILESTONE_KEY = '@Achievements:lastCelebratedConsecutiveDaysMilestone';

const LEVELS = [ { level: 1, name: 'L1', requiredSteps: 0, titleKey: 'level1Title' }, { level: 2, name: 'L2', requiredSteps: 10000, titleKey: 'level2Title' }, { level: 3, name: 'L3', requiredSteps: 30000, titleKey: 'level3Title' }, { level: 4, name: 'L4', requiredSteps: 100000, titleKey: 'level4Title' }, { level: 5, name: 'L5', requiredSteps: 250000, titleKey: 'level5Title' }, { level: 6, name: 'L6', requiredSteps: 500000, titleKey: 'level6Title' }, ];
const translations = {
  ar: { loadingProgress: 'جار تحميل التقدم...', levelReachedHighest: 'لقد وصلت إلى أعلى مستوى!', stepsRemainingToLevel: 'باقي', stepsUnit: 'خطوة', stepsToReach: 'للوصول إلى', dailyStepsSectionTitle: 'الخطوات اليومية', consecutiveDaysSectionTitle: 'أيام متتالية', totalDaysSectionTitle: 'إجمالي الأيام', level1Title: 'المشاة المبتدئين', level2Title: 'متعلم المشي', level3Title: 'مُحب المشي', level4Title: 'خبير المشي', level5Title: 'سيد المسارات', level6Title: 'أسطورة الخطوات', badgeStartMoving: 'ابدأ الحركة', badgeActiveDay: 'يوم نشط', badgeAchievementDay: 'يوم الإنجاز', badgeStepsExpert: 'خبير الخطوات', badgeWanderer: 'المتجول', badgeWalkMarathoner: 'ماراثوني المشي', badgeExpertAdventurer: 'المغامر الخبير', badgeDistanceConqueror: 'قاهر المسافات', badgeWalkLegend: 'أسطورة المشي', badgeTripleChampion: 'البطل الثلاثي', badgeWeeklyWinner: 'الفائز الأسبوعي', badgeTwoWeekVictor: 'منتصر الأسبوعين', badgeHabitBuilder: 'باني العادات', badgeGoalClinger: 'التمسك بالأهداف', badgeStreakCenturion: 'ستريك سنتوريون', badge7Days: '7 أيام', badge14Days: '14 أيام', badge30Days: '30 أيام', badge60Days: '60 أيام', badge100Days: '100 أيام', badge180Days: '180 أيام', badge270Days: '270 يومًا', badge360Days: '360 يومًا' },
  en: { loadingProgress: 'Loading progress...', levelReachedHighest: 'You have reached the highest level!', stepsRemainingToLevel: '', stepsUnit: 'steps', stepsToReach: 'remaining to reach', dailyStepsSectionTitle: 'Daily Steps', consecutiveDaysSectionTitle: 'Consecutive Days', totalDaysSectionTitle: 'Total Days', level1Title: 'Beginner Walker', level2Title: 'Path Learner', level3Title: 'Trail Lover', level4Title: 'Stride Expert', level5Title: 'Track Master', level6Title: 'Step Legend', badgeStartMoving: 'Start Moving', badgeActiveDay: 'Active Day', badgeAchievementDay: 'Achievement Day', badgeStepsExpert: 'Steps Expert', badgeWanderer: 'Wanderer', badgeWalkMarathoner: 'Walk Marathoner', badgeExpertAdventurer: 'Expert Adventurer', badgeDistanceConqueror: 'Distance Conqueror', badgeWalkLegend: 'Walk Legend', badgeTripleChampion: 'Triple Champion', badgeWeeklyWinner: 'Weekly Winner', badgeTwoWeekVictor: 'Two-Week Victor', badgeHabitBuilder: 'Habit Builder', badgeGoalClinger: 'Goal Clinger', badgeStreakCenturion: 'Streak Centurion', badge7Days: '7 Days', badge14Days: '14 Days', badge30Days: '30 Days', badge60Days: '60 Days', badge100Days: '100 Days', badge180Days: '180 Days', badge270Days: '270 Days', badge360Days: '360 Days' },
};
let currentStyles; 

const WavyBackground = ({ active = false, style = {}, activeColor, inactiveColor }) => { const activeWaveColors = [`${activeColor}B3`, `${activeColor}E6`, activeColor]; return ( <View style={[currentStyles.wavyBackgroundBase, style]}><View style={[currentStyles.waveLineBase, { backgroundColor: active ? activeWaveColors[0] : inactiveColor, width: '75%' }]} /><View style={[currentStyles.waveLineBase, { backgroundColor: active ? activeWaveColors[1] : inactiveColor, width: '70%', marginLeft: '5%' }]} /><View style={[currentStyles.waveLineBase, { backgroundColor: active ? activeWaveColors[2] : inactiveColor, width: '75%' }]} /></View> ); };
const BadgeBase = ({ containerStyle, value, label, isActive, children, valueStyleOverride = {}, labelStyleOverride = {} }) => { const valueStyle = [currentStyles.badgeValue, isActive ? currentStyles.activeBadgeTextValue : currentStyles.inactiveBadgeText, valueStyleOverride]; const labelStyle = [currentStyles.badgeLabel, isActive ? currentStyles.activeBadgeLabel : currentStyles.inactiveBadgeLabel, labelStyleOverride]; const baseStyle = isActive ? currentStyles.activeBadgeBase : currentStyles.inactiveBadgeBase; return ( <View style={currentStyles.badgeContainer}><View style={[currentStyles.badgeBase, baseStyle, containerStyle]}>{children}<View style={currentStyles.badgeTextContainer}><Text style={valueStyle}>{value}</Text></View></View><Text style={labelStyle}>{label}</Text></View> ); };
const DailyStepsBadge = ({ value, label, isActive = false }) => ( <BadgeBase containerStyle={currentStyles.badgeCircle} value={value} label={label} isActive={isActive}><WavyBackground active={isActive} style={currentStyles.badgeWavyBackground} activeColor={currentStyles.activeBadgeBase.borderColor} inactiveColor={currentStyles.inactiveBadgeBase.borderColor} /></BadgeBase> );
const HexBadge = ({ value, label, isActive = false }) => ( <BadgeBase containerStyle={currentStyles.badgeHex} value={value} label={label} isActive={isActive} labelStyleOverride={isActive ? { color: currentStyles.activeBadgeLabel.color, fontWeight: 'bold' } : {}}><WavyBackground active={isActive} style={currentStyles.badgeWavyBackground} activeColor={currentStyles.activeBadgeBase.borderColor} inactiveColor={currentStyles.inactiveBadgeBase.borderColor} />{isActive && <View style={[currentStyles.activeHexInnerGlow, { borderColor: currentStyles.activeBadgeBase.borderColor+'4D' }]} />}</BadgeBase> );
const OvalBadge = ({ value, label, isActive = false }) => { const InactiveOvalDetail = () => (<View style={currentStyles.ovalDetailContainer}><MCommunityIcon name="chevron-down" size={18} color={currentStyles.inactiveBadgeBase.borderColor} /></View>); return ( <BadgeBase containerStyle={currentStyles.badgeOval} value={value} label={label} isActive={isActive} labelStyleOverride={isActive ? { color: currentStyles.activeBadgeLabel.color, fontWeight: 'bold' } : {}}>{!isActive && <InactiveOvalDetail />}</BadgeBase> ); };

const AchievementsScreen = ({ navigation, route, language: propLanguage, darkMode: propDarkMode }) => {
  
  const [language, setLanguage] = useState(propLanguage || route.params?.language || (I18nManager.isRTL ? 'ar' : 'en'));
  
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(
    propDarkMode !== undefined 
      ? propDarkMode 
      : (route.params?.isDarkMode === undefined ? systemColorScheme === 'dark' : route.params?.isDarkMode)
  );

  useEffect(() => {
    if (propLanguage && propLanguage !== language) {
      setLanguage(propLanguage);
    }
  }, [propLanguage]);

  useEffect(() => {
    if (propDarkMode !== undefined && propDarkMode !== isDarkMode) {
      setIsDarkMode(propDarkMode);
    }
  }, [propDarkMode]);

  const translation = useMemo(() => translations[language] || translations.en, [language]);
  currentStyles = useMemo(() => isDarkMode ? darkStyles : lightStyles, [isDarkMode]);

  const passedDailySteps = route.params?.currentDailySteps ?? 0;
  const [totalAccumulatedSteps, setTotalAccumulatedSteps] = useState(0);
  const [isLoadingTotalSteps, setIsLoadingTotalSteps] = useState(true);
  const [currentLevelNumber, setCurrentLevelNumber] = useState(1); 
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiRef = useRef(null);
  const [isDailyStepsExpanded, setIsDailyStepsExpanded] = useState(true);
  const [isConsecutiveDaysExpanded, setIsConsecutiveDaysExpanded] = useState(true);
  const [isTotalDaysExpanded, setIsTotalDaysExpanded] = useState(true);
  const [consecutiveDays, setConsecutiveDays] = useState(0);
  const [isLoadingConsecutiveDays, setIsLoadingConsecutiveDays] = useState(true);
  const [maxCompletedChallenge, setMaxCompletedChallenge] = useState(0); 
  const [isLoadingMaxChallenge, setIsLoadingMaxChallenge] = useState(true);
  
  const initialLoadDone = useRef(false);
  const firstLoadLevelSet = useRef(false); 

  const [lastCelebratedLevel, setLastCelebratedLevel] = useState(0);
  const [lastCelebratedDailySteps, setLastCelebratedDailySteps] = useState(0);
  const [lastCelebratedConsecutiveDays, setLastCelebratedConsecutiveDays] = useState(0);
  const [pendingTierCelebration, setPendingTierCelebration] = useState(null); 

  const [readyForCelebrationCheck, setReadyForCelebrationCheck] = useState(false);

  const dailyStepsBadgesData = useMemo(() => [ { value: '3K', labelKey: 'badgeStartMoving', requiredSteps: 3000 }, { value: '7K', labelKey: 'badgeActiveDay', requiredSteps: 7000 }, { value: '10K', labelKey: 'badgeAchievementDay', requiredSteps: 10000 }, { value: '14K', labelKey: 'badgeStepsExpert', requiredSteps: 14000 }, { value: '20K', labelKey: 'badgeWanderer', requiredSteps: 20000 }, { value: '30K', labelKey: 'badgeWalkMarathoner', requiredSteps: 30000 }, { value: '50K', labelKey: 'badgeExpertAdventurer', requiredSteps: 50000 }, { value: '75K', labelKey: 'badgeDistanceConqueror', requiredSteps: 75000 }, { value: '100K', labelKey: 'badgeWalkLegend', requiredSteps: 100000 }, ].sort((a, b) => a.requiredSteps - b.requiredSteps), []);
  const consecutiveBadgesData = useMemo(() => [ { value: '3X', labelKey: 'badgeTripleChampion', requiredDays: 3 }, { value: '7X', labelKey: 'badgeWeeklyWinner', requiredDays: 7 }, { value: '14X', labelKey: 'badgeTwoWeekVictor', requiredDays: 14 }, { value: '21X', labelKey: 'badgeHabitBuilder', requiredDays: 21 }, { value: '50X', labelKey: 'badgeGoalClinger', requiredDays: 50 }, { value: '100X', labelKey: 'badgeStreakCenturion', requiredDays: 100 }, ].sort((a, b) => a.requiredDays - b.requiredDays), []);
  const totalBadgesData = useMemo(() => [ { value: '7D', labelKey: 'badge7Days', requiredDays: 7 }, { value: '14D', labelKey: 'badge14Days', requiredDays: 14 }, { value: '30D', labelKey: 'badge30Days', requiredDays: 30 }, { value: '60D', labelKey: 'badge60Days', requiredDays: 60 }, { value: '100D', labelKey: 'badge100Days', requiredDays: 100 }, { value: '180D', labelKey: 'badge180Days', requiredDays: 180 }, { value: '270D', labelKey: 'badge270Days', requiredDays: 270 }, { value: '360D', labelKey: 'badge360Days', requiredDays: 360 }, ].sort((a, b) => a.requiredDays - b.requiredDays), []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingTotalSteps(true);
      setIsLoadingConsecutiveDays(true);
      setIsLoadingMaxChallenge(true);
      setReadyForCelebrationCheck(false);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        let cloudData = null;

        if (user) {
            const { data } = await supabase.from('achievements').select('*').eq('user_id', user.id).single();
            if (data) cloudData = data;
        }

        const [
          storedTotalStr, storedStreakStr, storedMaxChallengeStr,
          tierToCelebrateStr, storedLastCelebratedLevel, storedLastCelebratedDaily, storedLastCelebratedConsecutive,
        ] = await Promise.all([
          AsyncStorage.getItem(TOTAL_ACCUMULATED_STEPS_KEY),
          AsyncStorage.getItem(CONSECUTIVE_GOAL_DAYS_KEY),
          AsyncStorage.getItem(MAX_COMPLETED_CHALLENGE_DAYS_KEY),
          AsyncStorage.getItem(CELEBRATE_TIER_COMPLETION_KEY),
          AsyncStorage.getItem(LAST_CELEBRATED_LEVEL_KEY),
          AsyncStorage.getItem(LAST_CELEBRATED_DAILY_STEPS_MILESTONE_KEY),
          AsyncStorage.getItem(LAST_CELEBRATED_CONSECUTIVE_DAYS_MILESTONE_KEY),
        ]);

        let localTotal = parseInt(storedTotalStr || '0', 10);
        let localStreak = parseInt(storedStreakStr || '0', 10);
        let localMax = parseInt(storedMaxChallengeStr || '0', 10);
        let localLastLevel = parseInt(storedLastCelebratedLevel || '0', 10);

        if (cloudData) {
            if (cloudData.total_accumulated_steps > localTotal) {
                localTotal = cloudData.total_accumulated_steps;
                await AsyncStorage.setItem(TOTAL_ACCUMULATED_STEPS_KEY, String(localTotal));
            }
            if (cloudData.consecutive_days > localStreak) {
                localStreak = cloudData.consecutive_days;
                await AsyncStorage.setItem(CONSECUTIVE_GOAL_DAYS_KEY, String(localStreak));
            }
            if (cloudData.max_challenge_days > localMax) {
                localMax = cloudData.max_challenge_days;
                await AsyncStorage.setItem(MAX_COMPLETED_CHALLENGE_DAYS_KEY, String(localMax));
            }
            if (cloudData.last_celebrated_level > localLastLevel) {
                localLastLevel = cloudData.last_celebrated_level;
                await AsyncStorage.setItem(LAST_CELEBRATED_LEVEL_KEY, String(localLastLevel));
            }
        }

        setTotalAccumulatedSteps(localTotal);
        setConsecutiveDays(localStreak);
        setMaxCompletedChallenge(localMax);
        setLastCelebratedLevel(localLastLevel);
        setLastCelebratedDailySteps(parseInt(storedLastCelebratedDaily || '0', 10));
        setLastCelebratedConsecutiveDays(parseInt(storedLastCelebratedConsecutive || '0', 10));

        if (tierToCelebrateStr) {
          const tier = parseInt(tierToCelebrateStr, 10);
          if (!isNaN(tier) && tier > 0) setPendingTierCelebration(tier);
        }

      } catch (error) {
        console.error("AchievementsScreen: Failed to load data:", error);
      } finally {
        setIsLoadingTotalSteps(false);
        setIsLoadingConsecutiveDays(false);
        setIsLoadingMaxChallenge(false);
        initialLoadDone.current = true;
        setReadyForCelebrationCheck(true);
      }
    };
    loadData();
  }, [totalBadgesData]);

  const syncToCloud = async (updates) => {
      try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
              await supabase.from('achievements').upsert({
                  user_id: user.id,
                  ...updates,
                  updated_at: new Date()
              });
          }
      } catch (e) { console.error("Sync achievements error", e); }
  };

  const currentLevelInfo = useMemo(() => { let achievedLevelNumber = 1; for (let i = LEVELS.length - 1; i >= 0; i--) { if (totalAccumulatedSteps >= LEVELS[i].requiredSteps) { achievedLevelNumber = LEVELS[i].level; break; } } const levelData = LEVELS.find(l => l.level === achievedLevelNumber) || LEVELS[0]; return { ...levelData, title: translation[levelData.titleKey] || levelData.titleKey }; }, [totalAccumulatedSteps, translation]);
  const nextLevelInfo = useMemo(() => { const nextLvlData = LEVELS.find(l => l.level === currentLevelInfo.level + 1); return nextLvlData ? { ...nextLvlData, title: translation[nextLvlData.titleKey] || nextLvlData.titleKey } : null; }, [currentLevelInfo, translation]);
  
  useEffect(() => {
    if (!isLoadingTotalSteps && currentLevelInfo.level !== currentLevelNumber) {
      if (firstLoadLevelSet.current) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCurrentLevelNumber(currentLevelInfo.level);
      if (!firstLoadLevelSet.current) firstLoadLevelSet.current = true;
    }
  }, [currentLevelInfo, currentLevelNumber, isLoadingTotalSteps]);

  const { stepsRemaining, progressPercent, progressBarStartSteps, nextLevelTargetLabel, levelRingProgressVisual } = useMemo(() => { let stepsRem = 0, progPerc = 0, progBarStart = 0, nextLvlLabel = '', ringProgVis = 0; const locale = language === 'ar' ? 'ar-EG' : 'en-US'; const currentReq = currentLevelInfo.requiredSteps; const nextReq = nextLevelInfo?.requiredSteps; if (nextLevelInfo) { const stepsNeeded = nextReq - currentReq; const stepsMade = Math.max(0, totalAccumulatedSteps - currentReq); stepsRem = Math.max(0, nextReq - totalAccumulatedSteps); progPerc = stepsNeeded > 0 ? Math.min(100, (stepsMade / stepsNeeded) * 100) : 100; progBarStart = currentReq; nextLvlLabel = `${(nextReq / 1000).toLocaleString(locale)}k`; ringProgVis = 1 - (stepsNeeded > 0 ? Math.min(1, stepsMade / stepsNeeded) : 1); } else { progPerc = 100; progBarStart = currentReq; nextLvlLabel = `${(currentReq / 1000).toLocaleString(locale)}k`; ringProgVis = (totalAccumulatedSteps >= currentReq) ? 0 : 1; } return { stepsRemaining: stepsRem, progressPercent: progPerc, progressBarStartSteps: progBarStart, nextLevelTargetLabel: nextLvlLabel, levelRingProgressVisual: ringProgVis }; }, [currentLevelInfo, nextLevelInfo, totalAccumulatedSteps, language]);
  
  useEffect(() => {
    if (!readyForCelebrationCheck || isLoadingTotalSteps || isLoadingConsecutiveDays || isLoadingMaxChallenge || !initialLoadDone.current) return; 

    let celebratedThisLoad = false;

    if (currentLevelInfo.level >= 2 && currentLevelInfo.level > lastCelebratedLevel) {
      setShowConfetti(true);
      AsyncStorage.setItem(LAST_CELEBRATED_LEVEL_KEY, currentLevelInfo.level.toString());
      setLastCelebratedLevel(currentLevelInfo.level);
      syncToCloud({ last_celebrated_level: currentLevelInfo.level });
      celebratedThisLoad = true;
    }

    if (!celebratedThisLoad && passedDailySteps > 0) {
      let currentHighestAchievedDailyValue = 0;
      for (const badge of dailyStepsBadgesData) {
        if (passedDailySteps >= badge.requiredSteps) currentHighestAchievedDailyValue = badge.requiredSteps;
        else break;
      }
      if (currentHighestAchievedDailyValue > 0 && currentHighestAchievedDailyValue > lastCelebratedDailySteps) {
        setShowConfetti(true);
        AsyncStorage.setItem(LAST_CELEBRATED_DAILY_STEPS_MILESTONE_KEY, currentHighestAchievedDailyValue.toString());
        setLastCelebratedDailySteps(currentHighestAchievedDailyValue);
        celebratedThisLoad = true;
      }
    }

    if (!celebratedThisLoad && consecutiveDays > 0) {
      let currentHighestAchievedConsecutiveValue = 0;
      for (const badge of consecutiveBadgesData) {
        if (consecutiveDays >= badge.requiredDays) currentHighestAchievedConsecutiveValue = badge.requiredDays;
        else break; 
      }
      if (currentHighestAchievedConsecutiveValue > 0 && currentHighestAchievedConsecutiveValue > lastCelebratedConsecutiveDays) {
        setShowConfetti(true);
        AsyncStorage.setItem(LAST_CELEBRATED_CONSECUTIVE_DAYS_MILESTONE_KEY, currentHighestAchievedConsecutiveValue.toString());
        setLastCelebratedConsecutiveDays(currentHighestAchievedConsecutiveValue);
        celebratedThisLoad = true;
      }
    }
    
    if (!celebratedThisLoad && pendingTierCelebration !== null) {
      if (maxCompletedChallenge >= pendingTierCelebration) {
        setShowConfetti(true);
        AsyncStorage.removeItem(CELEBRATE_TIER_COMPLETION_KEY);
        setPendingTierCelebration(null); 
      } else {
        AsyncStorage.removeItem(CELEBRATE_TIER_COMPLETION_KEY);
        setPendingTierCelebration(null);
      }
    }

    if (readyForCelebrationCheck) setReadyForCelebrationCheck(false);

  }, [readyForCelebrationCheck, isLoadingTotalSteps, currentLevelInfo, lastCelebratedLevel, passedDailySteps, dailyStepsBadgesData, lastCelebratedDailySteps, consecutiveDays, consecutiveBadgesData, lastCelebratedConsecutiveDays, pendingTierCelebration, maxCompletedChallenge]);

  const toggleExpansion = useCallback((setter, currentState) => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setter(!currentState); }, []);
  const handleAction = useCallback(() => { if (navigation && typeof navigation.goBack === 'function') navigation.goBack(); }, [navigation]);

  const CollapsibleSection = React.memo(({ titleKey, isExpanded, onToggle, data, BadgeComponent, count, isLoading = false }) => ( 
    <View style={currentStyles.collapsibleSection}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7}>
        <View style={currentStyles.sectionHeader}>
          <Icon name={isExpanded ? "keyboard-arrow-down" : (I18nManager.isRTL ? "keyboard-arrow-right" : "keyboard-arrow-left")} size={28} color={currentStyles.dropdownArrow.color} style={currentStyles.dropdownArrowStyle} />
          <Text style={currentStyles.sectionTitle}>{translation[titleKey]}</Text>
        </View>
      </TouchableOpacity>
      {isExpanded && ( isLoading ? <View style={currentStyles.sectionLoadingContainer}><ActivityIndicator size="small" color={currentStyles.loadingIndicator.color} /></View> : <View style={currentStyles.badgesGrid}>{data.map((badge, index) => <BadgeComponent key={`${titleKey}-${index}`} value={badge.value} label={translation[badge.labelKey]} isActive={count >= (badge.requiredSteps ?? badge.requiredDays)} />)}</View> )}
    </View> 
  ));

  if (!currentStyles) return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" color="#4CAF50" /></View>;

  return (
    <SafeAreaView style={currentStyles.safeArea}>
      <View style={currentStyles.flexContainer}>
        <ScrollView style={currentStyles.scrollViewStyle} contentContainerStyle={currentStyles.contentContainer} showsVerticalScrollIndicator={false} >
          <View style={currentStyles.headerContainer}><TouchableOpacity onPress={handleAction} style={currentStyles.actionButton}><Icon name={I18nManager.isRTL ? "arrow-back" : "arrow-forward"} size={28} color={currentStyles.headerIcon.color} /></TouchableOpacity></View>
          {isLoadingTotalSteps ? ( <View style={currentStyles.loadingContainer}><ActivityIndicator size="large" color={currentStyles.loadingIndicator.color} /><Text style={currentStyles.loadingText}>{translation.loadingProgress}</Text></View> ) : ( <View style={currentStyles.topSection}><View style={currentStyles.levelBadgeContainer}><Progress.Circle style={currentStyles.levelProgressCircle} size={110} progress={1 - levelRingProgressVisual} color={currentStyles.levelProgressCircleColor.color} unfilledColor={currentStyles.levelProgressCircleUnfilled.color} thickness={8} borderWidth={0} showsText={false} direction="counter-clockwise" strokeCap="round" /><View style={currentStyles.levelBadgeInner}><Text style={currentStyles.levelBadgeText}>{currentLevelInfo.name}</Text></View></View><Text style={currentStyles.levelTitle}>{currentLevelInfo.title}</Text>{nextLevelInfo ? ( <Text style={currentStyles.levelProgressText}>{translation.stepsRemainingToLevel}{' '}<Text style={currentStyles.boldPrimaryGreenText}>{stepsRemaining.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}</Text>{' '}{translation.stepsUnit} {language === 'en' ? translation.stepsToReach : ''} {nextLevelInfo.name}{language === 'ar' ? ` (${translation.stepsToReach})` : ''}</Text> ) : ( <Text style={currentStyles.levelProgressText}>{translation.levelReachedHighest}</Text> )}<View style={currentStyles.progressBarArea}><View style={currentStyles.progressBarContainer}><View style={[currentStyles.progressBarFill, { width: `${progressPercent}%` }]} /><View style={[currentStyles.progressBarMarker, { left: `${progressPercent}%` }]} /></View><View style={currentStyles.progressLabels}><Text style={currentStyles.progressLabelText}> {(currentLevelInfo.level === 1 && totalAccumulatedSteps < (LEVELS[1]?.requiredSteps || Infinity)) ? totalAccumulatedSteps.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : `${(progressBarStartSteps / 1000).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}k`} </Text><Text style={currentStyles.progressLabelText}>{nextLevelTargetLabel}</Text></View></View></View> )}
           <CollapsibleSection titleKey="dailyStepsSectionTitle" isExpanded={isDailyStepsExpanded} onToggle={() => toggleExpansion(setIsDailyStepsExpanded, isDailyStepsExpanded)} data={dailyStepsBadgesData} BadgeComponent={DailyStepsBadge} count={passedDailySteps} />
           <CollapsibleSection titleKey="consecutiveDaysSectionTitle" isExpanded={isConsecutiveDaysExpanded} onToggle={() => toggleExpansion(setIsConsecutiveDaysExpanded, isConsecutiveDaysExpanded)} data={consecutiveBadgesData} BadgeComponent={HexBadge} count={consecutiveDays} isLoading={isLoadingConsecutiveDays} />
           <CollapsibleSection titleKey="totalDaysSectionTitle" isExpanded={isTotalDaysExpanded} onToggle={() => toggleExpansion(setIsTotalDaysExpanded, isTotalDaysExpanded)} data={totalBadgesData} BadgeComponent={OvalBadge} count={maxCompletedChallenge} isLoading={isLoadingMaxChallenge} />
        </ScrollView>
        {showConfetti && <ConfettiCannon ref={confettiRef} count={200} origin={{ x: I18nManager.isRTL ? width + 50 : -50 , y: 0 }} autoStart={true} fadeOut={true} explosionSpeed={400} fallSpeed={3000} onAnimationEnd={() => setShowConfetti(false)} style={currentStyles.confetti} />}
      </View>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

// ----------------------------------------------------------------------
// Updated Styles to match "WeightTracker" look and feel (Colors & Backgrounds)
// ----------------------------------------------------------------------
const lightStyles = StyleSheet.create({ 
  // تعديل الخلفية لتكون #F7FDF9 زي الصفحة التانية
  safeArea: { flex: 1, backgroundColor: '#F7FDF9' }, 
  flexContainer: { flex: 1 }, 
  scrollViewStyle: { flex: 1 }, 
  contentContainer: { alignItems: 'center', paddingBottom: 30 }, 
  headerContainer: { height: 60, flexDirection: I18nManager.isRTL ? 'row' : 'row-reverse', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 15, width: '100%' }, 
  actionButton: { padding: 10 }, 
  // تعديل لون الأيقونة ليكون نفس درجة الأخضر الغامق
  headerIcon: { color: '#2e7d32' }, 
  
  topSection: { 
    width: '90%', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 15, marginBottom: 15, 
    backgroundColor: '#FFFFFF', borderRadius: 16, 
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, 
  }, 
  
  levelBadgeContainer: { marginBottom: 10, width: 120, height: 120, justifyContent: 'center', alignItems: 'center', position: 'relative' }, 
  levelProgressCircle: { position: 'absolute', top: 5, left: 5 }, 
  // تعديل ألوان الدائرة
  levelProgressCircleColor: { color: '#4CAF50' }, 
  levelProgressCircleUnfilled: { color: '#e0f2f1' }, // لون أفتح متناسق مع الصفحة التانية
  levelBadgeInner: { 
    width: 95, height: 95, borderRadius: 47.5, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#e0f2f1', 
    justifyContent: 'center', alignItems: 'center', zIndex: 1, 
    shadowColor: '#b0b0b0', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4 
  }, 
  levelBadgeText: { fontSize: 48, fontWeight: '300', color: '#388e3c', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-light' }, 
  
  // تعديل العناوين لنفس درجة الأخضر الغامق
  levelTitle: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32', marginBottom: 5, textAlign: 'center' }, 
  levelProgressText: { fontSize: 15, color: '#757575', marginBottom: 15, textAlign: 'center', minHeight: 20, paddingHorizontal: 10 }, 
  boldPrimaryGreenText: { fontWeight: 'bold', color: '#2e7d32' }, 
  
  progressBarArea: { width: '85%', alignItems: 'center', marginTop: 10 }, 
  progressBarContainer: { height: 8, width: '100%', backgroundColor: '#e0f2f1', borderRadius: 4, position: 'relative', overflow: 'hidden' }, 
  progressBarFill: { height: '100%', backgroundColor: '#4CAF50', borderRadius: 4, position: 'absolute', left: 0, top: 0 }, 
  progressBarMarker: { 
    position: 'absolute', top: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: '#388e3c', borderWidth: 2, borderColor: '#FFFFFF', 
    transform: [{ translateX: -8 }], shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1, elevation: 3, zIndex: 5 
  }, 
  
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 5 }, 
  progressLabelText: { fontSize: 13, color: '#757575', fontVariant: ['tabular-nums'] }, 
  
  collapsibleSection: { 
    width: '90%', backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 15, 
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3, overflow: 'hidden' 
  }, 
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 20 }, 
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2e7d32', textAlign: I18nManager.isRTL ? 'right' : 'left', flex: 1, marginRight: I18nManager.isRTL ? 0 : 10, marginLeft: I18nManager.isRTL ? 10 : 0 }, 
  dropdownArrow: { color: '#757575'}, 
  dropdownArrowStyle: { }, 
  
  badgesGrid: { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingTop: 5, paddingBottom: 15, paddingHorizontal: 10 }, 
  badgeContainer: { width: '33.33%', alignItems: 'center', marginBottom: 25, paddingHorizontal: 5 }, 
  badgeBase: { width: 85, height: 85, justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' }, 
  badgeTextContainer: { zIndex: 2, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent' }, 
  badgeValue: { fontSize: 22, fontWeight: 'bold', fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium', textAlign: 'center' }, 
  badgeLabel: { fontSize: 13, textAlign: 'center', paddingHorizontal: 2, fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif', marginTop: 8, color: '#757575' }, 
  badgeCircle: { borderRadius: 42.5 }, 
  badgeHex: { borderRadius: 15 }, 
  badgeOval: { width: 100, height: 70, borderRadius: 35 }, 
  
  // تعديل ألوان البادجات (Badges) لتتناسب
  activeBadgeBase: { backgroundColor: '#e8f5e9', borderWidth: 2, borderColor: '#4CAF50', shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 }, 
  inactiveBadgeBase: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', shadowColor: '#B0BEC5', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 }, 
  
  activeBadgeTextValue: { color: '#2E7D32' }, 
  inactiveBadgeText: { color: '#9E9E9E' }, 
  activeBadgeLabel: { fontWeight: 'bold', color: '#388e3c' }, 
  inactiveBadgeLabel: { color: '#9E9E9E' }, 
  
  wavyBackgroundBase: { position: 'absolute', bottom: 10, left: 0, right: 0, height: 15, alignItems: 'center', zIndex: 0, opacity: 0.8 }, 
  badgeWavyBackground: { bottom: 15 }, 
  waveLineBase: { height: 2.5, borderRadius: 1.5, marginBottom: 3 }, 
  ovalDetailContainer: { position: 'absolute', bottom: 10, zIndex: 1, opacity: 0.7 }, 
  activeHexInnerGlow: { position: 'absolute', top: 2, left: 2, right: 2, bottom: 2, borderRadius: 13, borderWidth: 2, zIndex: 0, borderColor: '#4CAF50' + '4D' }, 
  confetti: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, pointerEvents: 'none' }, 
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50, width: '90%', backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 15, elevation: 3, shadowColor:'#555', shadowOffset:{width:0, height:2}, shadowOpacity:0.1, shadowRadius: 4 }, 
  loadingIndicator: { color: '#4CAF50' }, 
  loadingText: { marginTop: 15, fontSize: 16, color: '#757575' }, 
  sectionLoadingContainer: { height: 100, justifyContent: 'center', alignItems: 'center' },
});

const darkStyles = StyleSheet.create({
  ...lightStyles, 
  // تعديل الخلفية الداكنة لتطابق #121212
  safeArea: { ...lightStyles.safeArea, backgroundColor: '#121212' }, 
  headerIcon: { color: '#E0E0E0' }, 
  
  // Cards Background #1E1E1E
  topSection: { ...lightStyles.topSection, backgroundColor: '#1E1E1E', shadowColor: '#000', shadowOpacity: 0.7 }, 
  
  // *** KEY CHANGE: Using Teal/Cyan Accents (#80CBC4) instead of Green to match Code 2 Dark Mode ***
  levelProgressCircleColor: { color: '#80CBC4' }, 
  levelProgressCircleUnfilled: { color: '#333333' }, 
  
  levelBadgeInner: { ...lightStyles.levelBadgeInner, backgroundColor: '#2C2C2C', borderColor: '#333333', shadowColor: '#000' }, 
  levelBadgeText: { ...lightStyles.levelBadgeText, color: '#80CBC4' }, 
  
  levelTitle: { ...lightStyles.levelTitle, color: '#80CBC4' }, 
  levelProgressText: { ...lightStyles.levelProgressText, color: '#B0B0B0' }, 
  boldPrimaryGreenText: { ...lightStyles.boldPrimaryGreenText, color: '#80CBC4' }, 
  
  progressBarContainer: { ...lightStyles.progressBarContainer, backgroundColor: '#333333' }, 
  progressBarFill: { ...lightStyles.progressBarFill, backgroundColor: '#80CBC4' }, 
  progressBarMarker: { ...lightStyles.progressBarMarker, backgroundColor: '#80CBC4', borderColor: '#1E1E1E' }, 
  
  progressLabelText: { ...lightStyles.progressLabelText, color: '#A0A0A0' }, 
  
  collapsibleSection: { ...lightStyles.collapsibleSection, backgroundColor: '#1E1E1E', shadowColor: '#000', shadowOpacity: 0.7 }, 
  sectionTitle: { ...lightStyles.sectionTitle, color: '#80CBC4' }, 
  dropdownArrow: { color: '#B0B0B0' }, 
  
  // Badges in Dark Mode (Using Teal)
  activeBadgeBase: { ...lightStyles.activeBadgeBase, backgroundColor: '#004D40', borderColor: '#80CBC4', shadowColor: '#80CBC4' }, 
  inactiveBadgeBase: { ...lightStyles.inactiveBadgeBase, backgroundColor: '#2C2C2C', borderColor: '#424242', shadowColor: '#000' }, 
  
  activeBadgeTextValue: { ...lightStyles.activeBadgeTextValue, color: '#E0F2F1' }, 
  inactiveBadgeText: { ...lightStyles.inactiveBadgeText, color: '#78909c' }, 
  activeBadgeLabel: { ...lightStyles.activeBadgeLabel, color: '#80CBC4' }, 
  inactiveBadgeLabel: { ...lightStyles.inactiveBadgeLabel, color: '#78909c' }, 
  
  activeHexInnerGlow: { ...lightStyles.activeHexInnerGlow, borderColor: '#80CBC4' + '4D' }, 
  
  loadingContainer: { ...lightStyles.loadingContainer, backgroundColor: '#1E1E1E', shadowColor: '#000' }, 
  loadingIndicator: { color: '#80CBC4' }, 
  loadingText: { ...lightStyles.loadingText, color: '#B0B0B0' },
});

export default AchievementsScreen;
