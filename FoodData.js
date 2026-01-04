// foodData.js

// --- Meal Categories ---
export const MEAL_CATEGORIES = {
    BREAKFAST: 'breakfast',
    LUNCH: 'lunch',
    DINNER: 'dinner',
    SNACKS: 'snacks',
};

export const MEAL_CATEGORIES_ORDER = [
    MEAL_CATEGORIES.BREAKFAST,
    MEAL_CATEGORIES.LUNCH,
    MEAL_CATEGORIES.DINNER,
    MEAL_CATEGORIES.SNACKS
];

// --- Default Target Calories for Meal Categories ---
export const DEFAULT_MEAL_TARGETS = {
    [MEAL_CATEGORIES.BREAKFAST]: 450,
    [MEAL_CATEGORIES.LUNCH]: 600,
    [MEAL_CATEGORIES.DINNER]: 700,
    [MEAL_CATEGORIES.SNACKS]: 250,
};

// --- Placeholder Images for Meal Categories ---
// !!! راجع هذه الأسماء لتطابق ملفاتك الفعلية في مجلد assets !!!
export const MEAL_IMAGES = {
    [MEAL_CATEGORIES.BREAKFAST]: require('./assets/breakfast.png'),
    [MEAL_CATEGORIES.LUNCH]: require('./assets/lunch.png'),
    [MEAL_CATEGORIES.DINNER]: require('./assets/dinner.png'),
    [MEAL_CATEGORIES.SNACKS]: require('./assets/snacks.png'),
};

// --- PREDEFINED FOODS (Example) ---
// IMPORTANT: Create these image files in your ./assets/ directory
export const PREDEFINED_FOODS = {
    [MEAL_CATEGORIES.BREAKFAST]: [
        // !!! تأكد من أسماء ملفات الصور هنا !!!
        { id: 'bf1', name_ar: 'بيضتان مسلوقتان', name_en: '2 Boiled Eggs', calories: 156, protein: 13, fat: 11, carbs: 1.1, image: require('./assets/2BoiledEggs.png'), unit_ar: 'طبق', unit_en: 'serving' },
        { id: 'bf2', name_ar: 'شريحة خبز أسمر', name_en: 'Whole Wheat Bread Slice', calories: 78, protein: 3.6, fat: 1.2, carbs: 13.8, image: require('./assets/WholeWheatBreadSlice.png'), unit_ar: 'شريحة', unit_en: 'slice' },
        { id: 'bf3', name_ar: 'كوب حليب (كامل الدسم)', name_en: 'Cup of Milk (Whole)', calories: 149, protein: 7.7, fat: 8, carbs: 12, image: require('./assets/CupofMilk.png'), unit_ar: 'كوب', unit_en: 'cup' },
        { id: 'bf4', name_ar: 'موزة متوسطة', name_en: 'Medium Banana', calories: 105, protein: 1.3, fat: 0.4, carbs: 27, image: require('./assets/MediumBanana.png'), unit_ar: 'حبة', unit_en: 'piece' },
    ],
    [MEAL_CATEGORIES.LUNCH]: [
        // !!! تأكد من أسماء ملفات الصور هنا !!!
        { id: 'ln1', name_ar: 'صدر دجاج مشوي (100جم)', name_en: 'Grilled Chicken Breast (100g)', calories: 165, protein: 31, fat: 3.6, carbs: 0, image: require('./assets/GrilledChickenBreast.png'), unit_ar: '100 جم', unit_en: '100g' },
        { id: 'ln2', name_ar: 'أرز أبيض مطبوخ (كوب)', name_en: 'Cooked White Rice (cup)', calories: 205, protein: 4.3, fat: 0.4, carbs: 45, image: require('./assets/CookedWhiteRice.png'), unit_ar: 'كوب', unit_en: 'cup' },
        { id: 'ln3', name_ar: 'سلطة خضراء (وسط)', name_en: 'Green Salad (Medium)', calories: 50, protein: 2, fat: 1, carbs: 10, image: require('./assets/GreenSalad.png'), unit_ar: 'طبق', unit_en: 'bowl' },
        { id: 'ln4', name_ar: 'سمك سلمون مشوي (100جم)', name_en: 'Grilled Salmon (100g)', calories: 208, protein: 20, fat: 13, carbs: 0, image: require('./assets/GrilledSalmon.png'), unit_ar: '100 جم', unit_en: '100g' },
    ],
    [MEAL_CATEGORIES.DINNER]: [
        // !!! تأكد من أسماء ملفات الصور هنا !!!
        { id: 'dn1', name_ar: 'زبادي يوناني (170جم)', name_en: 'Greek Yogurt (170g)', calories: 100, protein: 17, fat: 0, carbs: 6, image: require('./assets/GreekYogurt.png'), unit_ar: 'كوب', unit_en: 'cup' },
        { id: 'dn2', name_ar: 'شوربة عدس (كوب)', name_en: 'Lentil Soup (cup)', calories: 180, protein: 10, fat: 5, carbs: 25, image: require('./assets/LentilSoup.png'), unit_ar: 'كوب', unit_en: 'cup' },
        //   VVV--- غيّر هذا السطر ليطابق اسم الملف الفعلي لديك ---VVV
        { id: 'dn3', name_ar: 'خضروات سوتيه (كوب)', name_en: 'Sautéed Vegetables (cup)', calories: 120, protein: 3, fat: 5, carbs: 15, image: require('./assets/SauteedVegetables.png'), unit_ar: 'طبق', unit_en: 'plate' }, // <--- أو استخدم الاسم البسيط مثل 'sauteed_vegetables.png' إذا أعدت تسمية الملف
    ],
    [MEAL_CATEGORIES.SNACKS]: [
        // !!! تأكد من أسماء ملفات الصور هنا !!!
        { id: 'sn1', name_ar: 'تفاحة متوسطة', name_en: 'Medium Apple', calories: 95, protein: 0.5, fat: 0.3, carbs: 25, image: require('./assets/MediumApple.png'), unit_ar: 'حبة', unit_en: 'piece' },
        { id: 'sn2', name_ar: 'حفنة مكسرات (لوز، 28جم)', name_en: 'Almonds (28g)', calories: 164, protein: 6, fat: 14, carbs: 6, image: require('./assets/Almonds.png'), unit_ar: '28 جم', unit_en: '28g' },
        { id: 'sn3', name_ar: 'قطعة شوكولاتة داكنة (20جم)', name_en: 'Dark Chocolate (20g)', calories: 120, protein: 1.5, fat: 8, carbs: 10, image: require('./assets/DarkChocolate.png'), unit_ar: '20 جم', unit_en: '20g' },
    ],
};