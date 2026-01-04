// Tips.js

const tips = {
  en: [
    // --- Original & Provided (1-20) ---
    'Eating leafy greens helps you feel full longer.', // 1
    'Drinking water before meals can help with weight loss.', // 2
    'Regular exercise boosts your metabolism.', // 3
    'Getting enough sleep is crucial for weight management.', // 4
    'Mindful eating can prevent overeating.', // 5
    'Portion control is key to managing calorie intake.', // 6
    'Choose whole grains over refined grains.', // 7
    'Incorporate lean protein into every meal.', // 8
    'Limit sugary drinks and opt for water or unsweetened tea.', // 9
    'Healthy fats (like avocados, nuts) are important in moderation.', // 10
    'Plan your meals ahead of time to avoid impulsive unhealthy choices.', // 11
    'Don\'t skip breakfast; it kickstarts your metabolism.', // 12
    'Read food labels to understand nutritional content.', // 13
    'Find a workout buddy for motivation and accountability.', // 14
    'Listen to your body\'s hunger and fullness cues.', // 15
    'Reduce processed food consumption.', // 16
    'Stay consistent with your healthy habits, even on weekends.', // 17
    'Allow yourself occasional treats to prevent feelings of deprivation.', // 18
    'Strength training builds muscle, which burns more calories at rest.', // 19
    'Manage stress, as it can lead to emotional eating.', // 20

    // --- Added Tips (21-200) --- Corrected Escaping ---
    'Track your food intake honestly and accurately.', // 21
    'Increase your daily fiber intake gradually.', // 22
    'Chew your food slowly and thoroughly.', // 23
    'Use smaller plates to help control portion sizes.', // 24
    'Eat a variety of colorful fruits and vegetables daily.', // 25
    'Limit alcohol consumption, as it contains empty calories.', // 26
    'Stay hydrated throughout the day, not just at meal times.', // 27
    'Incorporate high-intensity interval training (HIIT) for efficient calorie burn.', // 28
    'Don\'t rely solely on the scale; track measurements and how clothes fit.', // 29
    'Set realistic and achievable short-term goals.', // 30
    'Celebrate non-scale victories, like increased energy or better sleep.', // 31
    'Cook more meals at home to control ingredients and portions.', // 32
    'Be mindful of hidden sugars in sauces, dressings, and packaged foods.', // 33
    'Find physical activities you genuinely enjoy.', // 34
    'Take the stairs instead of the elevator whenever possible.', // 35
    'Walk or bike for short errands instead of driving.', // 36
    'Schedule your workouts like important appointments.', // 37
    'Vary your workout routine to prevent boredom and plateaus.', // 38
    'Include flexibility and stretching exercises in your routine.', // 39
    'Prioritize rest days to allow your body to recover.', // 40
    'Understand the difference between physical hunger and emotional hunger.', // 41
    'Identify your triggers for emotional eating.', // 42
    'Develop non-food coping mechanisms for stress (e.g., walking, hobbies).', // 43
    'Practice self-compassion; don\'t beat yourself up over slip-ups.', // 44
    'Focus on adding healthy foods, not just restricting unhealthy ones.', // 45
    'Keep healthy snacks readily available (e.g., fruits, nuts, yogurt).', // 46
    'Avoid eating directly from large packages or containers.', // 47
    'Eat at a table, away from distractions like TV or computers.', // 48
    'Be patient; sustainable weight loss takes time.', // 49
    'Review your progress regularly and adjust your plan as needed.', // 50
    'Seek support from friends, family, or a professional if needed.', // 51
    'Learn basic healthy cooking techniques like steaming, grilling, or baking.', // 52
    'Be aware of liquid calories from coffee drinks, juices, and sodas.', // 53
    'Choose water or sparkling water with lemon instead of sugary drinks.', // 54
    'Include legumes (beans, lentils) as a source of protein and fiber.', // 55
    'Eat fish, especially fatty fish like salmon, at least twice a week.', // 56
    'Don\'t shop for groceries when you\'re hungry.', // 57
    'Make a shopping list based on your meal plan.', // 58
    'Read ingredient lists, not just nutrition facts.', // 59
    'Avoid foods with long lists of unpronounceable ingredients.', // 60
    'Experiment with herbs and spices for flavor instead of salt and fat.', // 61
    'Measure oils and dressings instead of pouring freely.', // 62
    'Pack healthy lunches for work or school.', // 63
    'Plan for social events and restaurant meals.', // 64
    'Check menus online before dining out to make healthier choices.', // 65
    'Ask for sauces and dressings on the side.', // 66
    'Share large restaurant portions or take half home.', // 67
    'Start restaurant meals with a salad (light dressing) or broth-based soup.', // 68
    'Focus on progress, not perfection.', // 69
    'Remember your motivation – why did you start this journey?', // 70
    'Visualize yourself achieving your goals.', // 71
    'Break down large goals into smaller, manageable steps.', // 72
    'Reward yourself with non-food treats for milestones achieved.', // 73
    'Get regular health check-ups with your doctor.', // 74
    'Understand that weight can fluctuate daily; focus on the overall trend.', // 75
    'Don\'t compare your journey to others; everyone is different.', // 76
    'Educate yourself about nutrition and fitness basics.', // 77
    'Try incorporating short bursts of activity throughout the day.', // 78
    'Stand up and move around every hour if you have a sedentary job.', // 79
    'Consider using a standing desk.', // 80
    'Improve your sleep hygiene: dark, quiet, cool room, consistent schedule.', // 81
    'Avoid caffeine and heavy meals close to bedtime.', // 82
    'Limit screen time before bed.', // 83
    'Find healthy ways to unwind before sleep (e.g., reading, warm bath).', // 84
    'If you have trouble sleeping, consult a healthcare professional.', // 85
    'Be mindful of portion sizes even with healthy foods.', // 86
    'Track your water intake to ensure you\'re staying hydrated.', // 87
    'Try adding lemon, cucumber, or mint to your water for flavor.', // 88
    'Herbal teas can be a good way to hydrate and relax.', // 89
    'Don\'t mistake thirst for hunger.', // 90
    'Prepare ingredients in advance (e.g., chop vegetables) for easier cooking.', // 91
    'Stock your pantry and fridge with healthy staples.', // 92
    'Remove unhealthy temptations from your home environment.', // 93
    'Learn to say "no" politely to unhealthy food offerings.', // 94
    'Focus on how healthy eating makes you feel (more energy, etc.).', // 95
    'Incorporate resistance bands or bodyweight exercises if you can\'t get to a gym.', // 96
    'Aim for at least 150 minutes of moderate-intensity aerobic activity per week.', // 97
    'Or aim for 75 minutes of vigorous-intensity aerobic activity per week.', // 98
    'Include muscle-strengthening activities at least two days per week.', // 99
    'Listen to your body during exercise; don\'t push through sharp pain.', // 100
    'Warm-up before each workout and cool-down afterward.', // 101
    'Learn proper form for exercises to prevent injuries.', // 102
    'Consider working with a certified personal trainer for guidance.', // 103
    'Find ways to make exercise fun, like dancing or playing sports.', // 104
    'Track your workouts to monitor progress and stay motivated.', // 105
    'Don\'t drastically cut calories; aim for a moderate, sustainable deficit.', // 106
    'Understand that plateaus are normal; analyze your habits and adjust.', // 107
    'Re-evaluate your calorie needs as you lose weight.', // 108
    'Focus on building sustainable habits for long-term success.', // 109
    'Reflect on what worked and what didn\'t in previous attempts.', // 110
    'Be honest with yourself about your eating and activity habits.', // 111
    'Practice gratitude for your body and its capabilities.', // 112
    'Surround yourself with supportive people.', // 113
    'Join a support group or online community for encouragement.', // 114
    'Learn healthy ways to handle setbacks and get back on track quickly.', // 115
    'Don\'t let one "bad" meal derail your entire day or week.', // 116
    'Plan healthy snacks between meals if needed to manage hunger.', // 117
    'Choose snacks with protein and fiber for better satiety.', // 118
    'Avoid mindless snacking while watching TV or working.', // 119
    'Pay attention to serving sizes listed on food packages.', // 120
    'Use measuring cups and spoons, especially when starting out.', // 121
    'Learn to estimate portion sizes visually when eating out.', // 122
    'Fill half your plate with non-starchy vegetables.', // 123
    'Fill one quarter with lean protein.', // 124
    'Fill one quarter with whole grains or starchy vegetables.', // 125
    'Include a small amount of healthy fat with your meals.', // 126
    'Be cautious with "low-fat" or "fat-free" products; they often contain added sugar.', // 127
    'Choose plain yogurt and add your own fruit instead of pre-flavored options.', // 128
    'Opt for whole fruits instead of fruit juice.', // 129
    'Limit dried fruit, as it\'s concentrated in sugar and calories.', // 130
    'Make your own salad dressings using oil, vinegar, and herbs.', // 131
    'Choose broth-based soups over creamy ones.', // 132
    'Swap refined pasta for whole wheat pasta or vegetable noodles.', // 133
    'Try quinoa, brown rice, or farro as whole grain options.', // 134
    'Use herbs, spices, garlic, and onions to flavor food instead of salt.', // 135
    'Limit processed meats like bacon, sausage, and deli meats.', // 136
    'Choose lean cuts of meat and trim visible fat.', // 137
    'Incorporate plant-based protein sources like tofu, tempeh, and edamame.', // 138
    'Have a plan for dealing with cravings.', // 139
    'Try waiting 15-20 minutes when a craving hits; it might pass.', // 140
    'Distract yourself with an activity when cravings occur.', // 141
    'If you indulge a craving, enjoy it mindfully and in moderation.', // 142
    'Don\'t label foods as "good" or "bad"; focus on overall balance.', // 143
    'Be aware of your eating patterns (e.g., late-night snacking).', // 144
    'Try journaling about your food and mood to identify patterns.', // 145
    'Set process goals (e.g., "exercise 3 times this week") not just outcome goals.', // 146
    'Consistency beats intensity in the long run.', // 147
    'Find healthy swaps for your favorite indulgences.', // 148
    'Example: Greek yogurt instead of sour cream.', // 149
    'Example: Baked sweet potato fries instead of regular fries.', // 150
    'Example: Dark chocolate (in moderation) instead of milk chocolate.', // 151
    'Example: Sparkling water with fruit instead of soda.', // 152
    'Stay active on vacation, perhaps by walking or exploring.', // 153
    'Pack healthy snacks when traveling.', // 154
    'Make healthy choices at airports or rest stops.', // 155
    'Don\'t feel obligated to "clean your plate" if you\'re full.', // 156
    'Practice saying "I\'m satisfied" instead of "I\'m stuffed".', // 157
    'Increase your Non-Exercise Activity Thermogenesis (NEAT) - fidget, pace, etc.', // 158
    'Take short walk breaks during your workday.', // 159
    'Do calf raises or squats while waiting for the microwave.', // 160
    'Park further away from entrances.', // 161
    'Choose active social activities (e.g., hiking, bowling) instead of just food-focused ones.', // 162
    'Learn to identify and manage stress triggers.', // 163
    'Try deep breathing exercises or meditation for stress relief.', // 164
    'Engage in hobbies you enjoy to reduce stress.', // 165
    'Ensure adequate intake of vitamins and minerals through a balanced diet.', // 166
    'Consult a doctor or dietitian before taking supplements.', // 167
    'Understand that muscle weighs more than fat by volume; don\'t panic if the scale stalls but clothes fit better.', // 168
    'Focus on improving health markers (blood pressure, cholesterol) along with weight.', // 169
    'Use the app\'s features (like reminders, progress charts) to stay on track.', // 170 **<- CORRECTED**
    'Regularly review your logged data in the app to see trends.', // 171
    'Be patient during plateaus; they are a normal part of the process.', // 172
    'Consider slightly increasing activity or adjusting calories if stuck on a plateau (after review).', // 173
    'Ensure you are tracking accurately; hidden calories can stall progress.', // 174
    'Think of healthy eating and exercise as self-care, not punishment.', // 175
    'Educate yourself on portion distortion in modern food culture.', // 176
    'Order smaller sizes when possible (e.g., coffee, meals).', // 177
    'Drink a glass of water upon waking up.', // 178
    'Prepare healthy breakfast options the night before (e.g., overnight oats).', // 179
    'Include protein at breakfast to stay full longer.', // 180
    'Avoid keeping trigger foods easily accessible at home.', // 181
    'Shop the perimeter of the grocery store where fresh foods usually are.', // 182
    'Limit consumption of highly processed snack foods (chips, crackers).', // 183
    'Read reviews or ask for recommendations for healthy restaurant options.', // 184
    'Don\'t be afraid to customize your order at restaurants (e.g., steamed veggies instead of fries).', // 185
    'Focus on building strength and endurance, not just calorie burn.', // 186
    'Try new vegetables or healthy recipes regularly to keep things interesting.', // 187
    'Batch cook healthy meals on the weekend for easy weekday lunches/dinners.', // 188
    'Freeze portions of healthy meals for later.', // 189
    'Share your goals with supportive friends or family.', // 190
    'Be mindful of "health halos" - just because a food is labeled healthy doesn\'t mean you can eat unlimited amounts.', // 191 **<- CORRECTED**
    'Practice mindful breathing for a few minutes each day.', // 192
    'Connect with nature; spending time outdoors can reduce stress.', // 193
    'Ensure your goals are SMART: Specific, Measurable, Achievable, Relevant, Time-bound.', // 194
    'Reassess and set new goals as you make progress.', // 195
    'Learn from slip-ups instead of dwelling on them.', // 196
    'Focus on long-term lifestyle changes, not temporary diets.', // 197
    'Be proud of the positive changes you are making for your health.', // 198
    'Keep exploring new healthy foods and activities.', // 199
    'Remember that consistency and patience are your greatest allies.', // 200
  ],
  ar: [
    // --- Original & Provided (1-20) ---
    'تناول الخضروات الورقية يساعدك على الشعور بالشبع لفترة أطول.', // 1
    'شرب الماء قبل الوجبات يمكن أن يساعد في فقدان الوزن.', // 2
    'التمرين المنتظم يعزز الأيض لديك.', // 3
    'الحصول على قسط كافٍ من النوم ضروري لإدارة الوزن.', // 4
    'الأكل الواعي يمكن أن يمنع الإفراط في الأكل.', // 5
    'التحكم في حجم الحصص هو مفتاح إدارة السعرات الحرارية.', // 6
    'اختر الحبوب الكاملة بدلاً من الحبوب المكررة.', // 7
    'أدخل البروتين الخالي من الدهون في كل وجبة.', // 8
    'قلل من المشروبات السكرية واختر الماء أو الشاي غير المحلى.', // 9
    'الدهون الصحية (مثل الأفوكادو والمكسرات) مهمة باعتدال.', // 10
    'خطط لوجباتك مسبقًا لتجنب الخيارات غير الصحية المندفعة.', // 11
    'لا تفوت وجبة الإفطار؛ فهي تبدأ عملية الأيض لديك.', // 12
    'اقرأ ملصقات الطعام لفهم المحتوى الغذائي.', // 13
    'ابحث عن صديق للتمرين للحصول على الدافع والمساءلة.', // 14
    'استمع إلى إشارات الجوع والشبع في جسمك.', // 15
    'قلل من استهلاك الأطعمة المصنعة.', // 16
    'حافظ على استمرارية عاداتك الصحية، حتى في عطلات نهاية الأسبوع.', // 17
    'اسمح لنفسك بمكافآت عرضية لمنع الشعور بالحرمان.', // 18
    'تمارين القوة تبني العضلات، التي تحرق المزيد من السعرات الحرارية أثناء الراحة.', // 19
    'تحكم في التوتر، لأنه يمكن أن يؤدي إلى الأكل العاطفي.', // 20

    // --- Added Tips (21-200) --- (Arabic doesn't typically need escaping for this issue) ---
    'تتبع مدخولك الغذائي بصدق ودقة.', // 21
    'زد من تناول الألياف اليومية تدريجياً.', // 22
    'امضغ طعامك ببطء وشكل كامل.', // 23
    'استخدم أطباقًا أصغر للمساعدة في التحكم في أحجام الحصص.', // 24
    'تناول مجموعة متنوعة من الفواكه والخضروات الملونة يوميًا.', // 25
    'قلل من استهلاك الكحول، لأنه يحتوي على سعرات حرارية فارغة.', // 26
    'حافظ على رطوبة جسمك طوال اليوم، وليس فقط في أوقات الوجبات.', // 27
    'أدمج تمارين المراحل عالية الكثافة (HIIT) لحرق السعرات الحرارية بكفاءة.', // 28
    'لا تعتمد فقط على الميزان؛ تتبع قياسات الجسم وكيفية ملاءمة الملابس.', // 29
    'ضع أهدافًا واقعية وقابلة للتحقيق على المدى القصير.', // 30
    'احتفل بالانتصارات غير المتعلقة بالميزان، مثل زيادة الطاقة أو النوم الأفضل.', // 31
    'اطبخ المزيد من الوجبات في المنزل للتحكم في المكونات والحصص.', // 32
    'كن واعيًا للسكريات المخفية في الصلصات والتتبيلات والأطعمة المعلبة.', // 33
    'ابحث عن أنشطة بدنية تستمتع بها حقًا.', // 34
    'استخدم الدرج بدلاً من المصعد كلما أمكن ذلك.', // 35
    'امشِ أو اركب الدراجة للمهام القصيرة بدلاً من القيادة.', // 36
    'حدد مواعيد لتمارينك الرياضية كما لو كانت مواعيد هامة.', // 37
    'نوّع روتين التمرين الخاص بك لمنع الملل وثبات الوزن.', // 38
    'أدرج تمارين المرونة والإطالة في روتينك.', // 39
    'أعطِ الأولوية لأيام الراحة للسماح لجسمك بالتعافي.', // 40
    'افهم الفرق بين الجوع الجسدي والجوع العاطفي.', // 41
    'حدد محفزاتك للأكل العاطفي.', // 42
    'طور آليات تأقلم غير غذائية للتوتر (مثل المشي والهوايات).', // 43
    'مارس التعاطف مع الذات؛ لا تقسو على نفسك بسبب الزلات.', // 44
    'ركز على إضافة الأطعمة الصحية، وليس فقط تقييد الأطعمة غير الصحية.', // 45
    'احتفظ بوجبات خفيفة صحية في متناول اليد (مثل الفواكه والمكسرات والزبادي).', // 46
    'تجنب الأكل مباشرة من العبوات الكبيرة.', // 47
    'تناول الطعام على طاولة، بعيدًا عن المشتتات مثل التلفزيون أو الكمبيوتر.', // 48
    'كن صبوراً؛ فقدان الوزن المستدام يستغرق وقتًا.', // 49
    'راجع تقدمك بانتظام وعدّل خطتك حسب الحاجة.', // 50
    'اطلب الدعم من الأصدقاء أو العائلة أو أخصائي إذا لزم الأمر.', // 51
    'تعلم تقنيات الطهي الصحية الأساسية مثل الطهي بالبخار أو الشوي أو الخبز.', // 52
    'انتبه للسعرات الحرارية السائلة من مشروبات القهوة والعصائر والمشروبات الغازية.', // 53
    'اختر الماء أو الماء الفوار مع الليمون بدلاً من المشروبات السكرية.', // 54
    'أدرج البقوليات (الفول والعدس) كمصدر للبروتين والألياف.', // 55
    'تناول السمك، خاصة الأسماك الدهنية مثل السلمون، مرتين في الأسبوع على الأقل.', // 56
    'لا تتسوق للبقالة وأنت جائع.', // 57
    'ضع قائمة تسوق بناءً على خطة وجباتك.', // 58
    'اقرأ قوائم المكونات، وليس فقط الحقائق الغذائية.', // 59
    'تجنب الأطعمة التي تحتوي على قوائم طويلة من المكونات غير المفهومة.', // 60
    'جرّب الأعشاب والتوابل للنكهة بدلاً من الملح والدهون.', // 61
    'قم بقياس الزيوت والتتبيلات بدلاً من سكبها بحرية.', // 62
    'جهز وجبات غداء صحية للعمل أو المدرسة.', // 63
    'خطط للمناسبات الاجتماعية والوجبات في المطاعم.', // 64
    'تحقق من قوائم الطعام عبر الإنترنت قبل تناول الطعام بالخارج لاتخاذ خيارات صحية.', // 65
    'اطلب الصلصات والتتبيلات جانبًا.', // 66
    'شارك حصص المطاعم الكبيرة أو خذ نصفها للمنزل.', // 67
    'ابدأ وجبات المطعم بسلطة (تتبيلة خفيفة) أو حساء قائم على المرق.', // 68
    'ركز على التقدم، وليس الكمال.', // 69
    'تذكر دافعك - لماذا بدأت هذه الرحلة؟', // 70
    'تخيل نفسك تحقق أهدافك.', // 71
    'قسّم الأهداف الكبيرة إلى خطوات أصغر يمكن إدارتها.', // 72
    'كافئ نفسك بمكافآت غير غذائية عند تحقيق الإنجازات.', // 73
    'احصل على فحوصات صحية منتظمة مع طبيبك.', // 74
    'افهم أن الوزن يمكن أن يتقلب يوميًا؛ ركز على الاتجاه العام.', // 75
    'لا تقارن رحلتك بالآخرين؛ كل شخص مختلف.', // 76
    'ثقف نفسك حول أساسيات التغذية واللياقة البدنية.', // 77
    'حاول دمج دفعات قصيرة من النشاط على مدار اليوم.', // 78
    'قف وتحرك كل ساعة إذا كان لديك عمل يتطلب الجلوس.', // 79
    'فكر في استخدام مكتب واقف.', // 80
    'حسّن عادات نومك: غرفة مظلمة وهادئة وباردة، جدول زمني ثابت.', // 81
    'تجنب الكافيين والوجبات الثقيلة قرب وقت النوم.', // 82
    'قلل من وقت الشاشة قبل النوم.', // 83
    'ابحث عن طرق صحية للاسترخاء قبل النوم (مثل القراءة، حمام دافئ).', // 84
    'إذا كنت تعاني من صعوبة في النوم، استشر أخصائي رعاية صحية.', // 85
    'انتبه لأحجام الحصص حتى مع الأطعمة الصحية.', // 86
    'تتبع كمية الماء التي تتناولها للتأكد من أنك تحافظ على رطوبة جسمك.', // 87
    'جرب إضافة الليمون أو الخيار أو النعناع إلى الماء للنكهة.', // 88
    'يمكن أن تكون شاي الأعشاب طريقة جيدة للترطيب والاسترخاء.', // 89
    'لا تخلط بين العطش والجوع.', // 90
    'حضر المكونات مسبقًا (مثل تقطيع الخضروات) لتسهيل الطهي.', // 91
    'املأ خزانة المؤن والثلاجة بالمواد الغذائية الصحية الأساسية.', // 92
    'أزل الإغراءات غير الصحية من بيئة منزلك.', // 93
    'تعلم أن تقول "لا" بأدب لعروض الطعام غير الصحية.', // 94
    'ركز على كيف يجعلك الأكل الصحي تشعر (المزيد من الطاقة، إلخ).', // 95
    'أدمج أحزمة المقاومة أو تمارين وزن الجسم إذا لم تتمكن من الذهاب إلى صالة الألعاب الرياضية.', // 96
    'استهدف ما لا يقل عن 150 دقيقة من النشاط الهوائي المعتدل الشدة أسبوعيًا.', // 97
    'أو استهدف 75 دقيقة من النشاط الهوائي القوي الشدة أسبوعيًا.', // 98
    'أدرج أنشطة تقوية العضلات مرتين على الأقل في الأسبوع.', // 99
    'استمع إلى جسدك أثناء التمرين؛ لا تتجاهل الألم الحاد.', // 100
    'قم بالإحماء قبل كل تمرين والتهدئة بعده.', // 101
    'تعلم الأداء الصحيح للتمارين لتجنب الإصابات.', // 102
    'فكر في العمل مع مدرب شخصي معتمد للحصول على التوجيه.', // 103
    'ابحث عن طرق لجعل التمرين ممتعًا، مثل الرقص أو ممارسة الرياضة.', // 104
    'تتبع تمارينك لمراقبة التقدم والحفاظ على الدافع.', // 105
    'لا تقلل السعرات الحرارية بشكل كبير؛ استهدف عجزًا معتدلًا ومستدامًا.', // 106
    'افهم أن ثبات الوزن أمر طبيعي؛ حلل عاداتك وقم بالتعديل.', // 107
    'أعد تقييم احتياجاتك من السعرات الحرارية مع فقدان الوزن.', // 108
    'ركز على بناء عادات مستدامة للنجاح على المدى الطويل.', // 109
    'فكر فيما نجح وما لم ينجح في المحاولات السابقة.', // 110
    'كن صريحًا مع نفسك بشأن عادات الأكل والنشاط.', // 111
    'مارس الامتنان لجسدك وقدراته.', // 112
    'أحط نفسك بأشخاص داعمين.', // 113
    'انضم إلى مجموعة دعم أو مجتمع عبر الإنترنت للتشجيع.', // 114
    'تعلم طرقًا صحية للتعامل مع الانتكاسات والعودة إلى المسار الصحيح بسرعة.', // 115
    'لا تدع وجبة واحدة "سيئة" تفسد يومك أو أسبوعك بأكمله.', // 116
    'خطط لوجبات خفيفة صحية بين الوجبات إذا لزم الأمر للتحكم في الجوع.', // 117
    'اختر وجبات خفيفة تحتوي على البروتين والألياف لشعور أفضل بالشبع.', // 118
    'تجنب تناول الوجبات الخفيفة بلا وعي أثناء مشاهدة التلفزيون أو العمل.', // 119
    'انتبه لأحجام الحصص المذكورة على عبوات الطعام.', // 120
    'استخدم أكواب وملاعق القياس، خاصة عند البدء.', // 121
    'تعلم تقدير أحجام الحصص بصريًا عند تناول الطعام بالخارج.', // 122
    'املأ نصف طبقك بالخضروات غير النشوية.', // 123
    'املأ ربع طبقك بالبروتين الخالي من الدهون.', // 124
    'املأ ربع طبقك بالحبوب الكاملة أو الخضروات النشوية.', // 125
    'أضف كمية صغيرة من الدهون الصحية مع وجباتك.', // 126
    'كن حذرًا من المنتجات "قليلة الدسم" أو "خالية الدسم"؛ غالبًا ما تحتوي على سكر مضاف.', // 127
    'اختر الزبادي العادي وأضف الفاكهة الخاصة بك بدلاً من الخيارات المنكهة مسبقًا.', // 128
    'اختر الفاكهة الكاملة بدلاً من عصير الفاكهة.', // 129
    'قلل من الفواكه المجففة، لأنها مركزة بالسكر والسعرات الحرارية.', // 130
    'اصنع تتبيلات السلطة الخاصة بك باستخدام الزيت والخل والأعشاب.', // 131
    'اختر الحساء القائم على المرق بدلاً من الحساء الكريمي.', // 132
    'استبدل المعكرونة المكررة بمعكرونة القمح الكامل أو نودلز الخضار.', // 133
    'جرب الكينوا أو الأرز البني أو الفارو كخيارات للحبوب الكاملة.', // 134
    'استخدم الأعشاب والتوابل والثوم والبصل لتنكيه الطعام بدلاً من الملح.', // 135
    'قلل من اللحوم المصنعة مثل اللحم المقدد والنقانق واللحوم الباردة.', // 136
    'اختر قطع اللحم قليلة الدهن وقم بإزالة الدهون المرئية.', // 137
    'أدمج مصادر البروتين النباتية مثل التوفو والتيمبي وفول الصويا الأخضر (إدامامي).', // 138
    'ضع خطة للتعامل مع الرغبة الشديدة في تناول الطعام.', // 139
    'حاول الانتظار لمدة 15-20 دقيقة عندما تظهر الرغبة الشديدة؛ قد تمر.', // 140
    'شتت انتباهك بنشاط ما عند حدوث الرغبة الشديدة.', // 141
    'إذا استسلمت للرغبة الشديدة، استمتع بها بوعي وباعتدال.', // 142
    'لا تصنف الأطعمة على أنها "جيدة" أو "سيئة"؛ ركز على التوازن العام.', // 143
    'كن واعيًا بأنماط أكلك (مثل تناول الوجبات الخفيفة في وقت متأخر من الليل).', // 144
    'جرب تدوين ملاحظات حول طعامك وحالتك المزاجية لتحديد الأنماط.', // 145
    'ضع أهدافًا للعملية (مثل "ممارسة الرياضة 3 مرات هذا الأسبوع") وليس فقط أهدافًا للنتائج.', // 146
    'الاستمرارية تتفوق على الكثافة على المدى الطويل.', // 147
    'ابحث عن بدائل صحية لأطعمتك المفضلة.', // 148
    'مثال: الزبادي اليوناني بدلاً من الكريمة الحامضة.', // 149
    'مثال: بطاطا حلوة مخبوزة بدلاً من البطاطس المقلية العادية.', // 150
    'مثال: الشوكولاتة الداكنة (باعتدال) بدلاً من شوكولاتة الحليب.', // 151
    'مثال: الماء الفوار مع الفاكهة بدلاً من الصودا.', // 152
    'حافظ على نشاطك في الإجازة، ربما عن طريق المشي أو الاستكشاف.', // 153
    'جهز وجبات خفيفة صحية عند السفر.', // 154
    'اتخذ خيارات صحية في المطارات أو محطات الاستراحة.', // 155
    'لا تشعر بأنك مضطر لـ "إنهاء طبقك" إذا كنت ممتلئًا.', // 156
    'تدرب على قول "أنا راضٍ" بدلاً من "أنا ممتلئ جدًا".', // 157
    'زد من توليد الحرارة من النشاط غير الرياضي (NEAT) - التململ، المشي، إلخ.', // 158
    'خذ استراحات مشي قصيرة خلال يوم عملك.', // 159
    'قم بتمارين رفع الساق أو القرفصاء أثناء انتظار الميكروويف.', // 160
    'اركن سيارتك بعيدًا عن المداخل.', // 161
    'اختر الأنشطة الاجتماعية النشطة (مثل التنزه والبولينج) بدلاً من تلك التي تركز على الطعام فقط.', // 162
    'تعلم كيفية تحديد وإدارة مسببات التوتر.', // 163
    'جرب تمارين التنفس العميق أو التأمل لتخفيف التوتر.', // 164
    'انخرط في الهوايات التي تستمتع بها لتقليل التوتر.', // 165
    'تأكد من تناول كمية كافية من الفيتامينات والمعادن من خلال نظام غذائي متوازن.', // 166
    'استشر طبيبًا أو أخصائي تغذية قبل تناول المكملات الغذائية.', // 167
    'افهم أن العضلات تزن أكثر من الدهون من حيث الحجم؛ لا داعي للذعر إذا توقف الميزان ولكن الملابس أصبحت أفضل.', // 168
    'ركز على تحسين المؤشرات الصحية (ضغط الدم، الكوليسترول) جنبًا إلى جنب مع الوزن.', // 169
    'استخدم ميزات التطبيق (مثل التذكيرات، مخططات التقدم) للبقاء على المسار الصحيح.', // 170
    'راجع بياناتك المسجلة في التطبيق بانتظام لرؤية الاتجاهات.', // 171
    'كن صبورًا خلال فترات ثبات الوزن؛ فهي جزء طبيعي من العملية.', // 172
    'فكر في زيادة النشاط قليلاً أو تعديل السعرات الحرارية إذا واجهت ثباتًا في الوزن (بعد المراجعة).', // 173
    'تأكد من أنك تتتبع بدقة؛ السعرات الحرارية المخفية يمكن أن توقف التقدم.', // 174
    'فكر في الأكل الصحي وممارسة الرياضة كرعاية ذاتية، وليس عقابًا.', // 175
    'ثقف نفسك حول تشويه حجم الحصص في ثقافة الطعام الحديثة.', // 176
    'اطلب أحجامًا أصغر عند الإمكان (مثل القهوة والوجبات).', // 177
    'اشرب كوبًا من الماء عند الاستيقاظ.', // 178
    'حضر خيارات إفطار صحية في الليلة السابقة (مثل الشوفان المنقوع).', // 179
    'أضف البروتين إلى وجبة الإفطار للبقاء ممتلئًا لفترة أطول.', // 180
    'تجنب الاحتفاظ بالأطعمة المحفزة في متناول اليد في المنزل.', // 181
    'تسوق في محيط متجر البقالة حيث توجد الأطعمة الطازجة عادةً.', // 182
    'قلل من استهلاك الأطعمة الخفيفة المصنعة بكثافة (رقائق البطاطس، البسكويت المالح).', // 183
    'اقرأ المراجعات أو اطلب توصيات لخيارات المطاعم الصحية.', // 184
    'لا تخف من تخصيص طلبك في المطاعم (مثل الخضار المطبوخة بالبخار بدلاً من البطاطس المقلية).', // 185
    'ركز على بناء القوة والتحمل، وليس فقط حرق السعرات الحرارية.', // 186
    'جرب خضروات جديدة أو وصفات صحية بانتظام للحفاظ على الاهتمام.', // 187
    'اطبخ كميات كبيرة من الوجبات الصحية في عطلة نهاية الأسبوع لسهولة الغداء/العشاء خلال الأسبوع.', // 188
    'جمد حصصًا من الوجبات الصحية لوقت لاحق.', // 189
    'شارك أهدافك مع الأصدقاء أو العائلة الداعمين.', // 190
    'كن واعيًا بـ "الهالات الصحية" - مجرد تسمية طعام بأنه صحي لا يعني أنه يمكنك تناول كميات غير محدودة منه.', // 191
    'مارس التنفس الواعي لبضع دقائق كل يوم.', // 192
    'تواصل مع الطبيعة؛ قضاء الوقت في الهواء الطلق يمكن أن يقلل من التوتر.', // 193
    'تأكد من أن أهدافك ذكية (SMART): محددة، قابلة للقياس، قابلة للتحقيق، ذات صلة، محددة زمنيًا.', // 194
    'أعد تقييم الأهداف وضع أهدافًا جديدة كلما تقدمت.', // 195
    'تعلم من الزلات بدلاً من التفكير فيها.', // 196
    'ركز على تغييرات نمط الحياة طويلة الأمد، وليس الحميات المؤقتة.', // 197
    'كن فخوراً بالتغييرات الإيجابية التي تقوم بها من أجل صحتك.', // 198
    'استمر في استكشاف الأطعمة والأنشطة الصحية الجديدة.', // 199
    'تذكر أن الاستمرارية والصبر هما أعظم حلفائك.', // 200
  ],
};

export default tips;