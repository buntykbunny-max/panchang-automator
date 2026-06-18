// 1. हिंदी नामों की डिक्शनरी बनाएँ
const signTranslation = {
  'aries': 'मेष',
  'taurus': 'वृषभ',
  'gemini': 'मिथुन',
  'cancer': 'कर्क',
  'leo': 'सिंह',
  'virgo': 'कन्या',
  'libra': 'तुला',
  'scorpio': 'वृश्चिक',
  'sagittarius': 'धनु',
  'capricorn': 'मकर',
  'aquarius': 'कुंभ',
  'pisces': 'मीन'
};

// ... (fetchAndSaveHoroscope फंक्शन के अंदर)

for (const sign of signs) {
  // ... (बाकी कोड वैसे ही रहेगा)

  const dbSign = sign.toLowerCase();
  const hindiSignName = signTranslation[dbSign] || sign; // 🌟 अगर नाम मिल जाए तो हिंदी, नहीं तो इंग्लिश

  await db.collection('daily_rashifal').doc(dbSign).set({
    sign: hindiSignName, // 🌟 यहाँ हिंदी नाम सेव होगा (जैसे 'मेष')
    english_sign: dbSign, // 🌟 काम आसान रखने के लिए एक इंग्लिश की भी रख लें
    date: todayId,
    prediction: dailyHindi.text,
    updatedAt: new Date()
  }, { merge: true });

  await db.collection('weekly_rashifal').doc(dbSign).set({
    sign: hindiSignName, // 🌟 यहाँ भी हिंदी नाम
    english_sign: dbSign,
    prediction: weeklyHindi.text,
    updatedAt: new Date()
  }, { merge: true });
}
