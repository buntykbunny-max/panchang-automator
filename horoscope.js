const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const translate = require('google-translate-api-x');

// 1. फंक्शन डिफाइन करें
async function runHoroscopeUpdater() {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(serviceAccount) });
        const db = getFirestore();

        const signTranslation = {
            'aries': 'मेष', 'taurus': 'वृषभ', 'gemini': 'मिथुन', 'cancer': 'कर्क',
            'leo': 'सिंह', 'virgo': 'कन्या', 'libra': 'तुला', 'scorpio': 'वृश्चिक',
            'sagittarius': 'धनु', 'capricorn': 'मकर', 'aquarius': 'कुंभ', 'pisces': 'मीन'
        };

        const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        db.settings({ ignoreUndefinedProperties: true });

        const date = new Date();
        const todayId = date.toISOString().split('T')[0];

        for (const sign of signs) {
            console.log(`\n--- Fetching data for: ${sign} ---`);
            const dailyRes = await fetch(`https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${sign}`);
            const dailyData = await dailyRes.json();
            
            const weeklyRes = await fetch(`https://freehoroscopeapi.com/api/v1/get-horoscope/weekly?sign=${sign}`);
            const weeklyData = await weeklyRes.json();

            const dailyEnglishText = dailyData?.data?.horoscope || dailyData?.horoscope;
            const weeklyEnglishText = weeklyData?.data?.horoscope || weeklyData?.horoscope;

            if (!dailyEnglishText) {
                console.log(`❌ API ने ${sign} का डेटा नहीं दिया। स्किपिंग...`);
                continue; 
            }

            const dailyHindi = await translate(dailyEnglishText, { to: 'hi' });
            const weeklyHindi = await translate(weeklyEnglishText, { to: 'hi' });

            const dbSign = sign.toLowerCase();
            const hindiSignName = signTranslation[dbSign] || sign;

            await db.collection('daily_rashifal').doc(dbSign).set({
                sign: hindiSignName,
                english_sign: dbSign,
                date: todayId,
                prediction: dailyHindi.text,
                updatedAt: new Date()
            }, { merge: true });

            await db.collection('weekly_rashifal').doc(dbSign).set({
                sign: hindiSignName,
                english_sign: dbSign,
                prediction: weeklyHindi.text,
                updatedAt: new Date()
            }, { merge: true });

            console.log(`✅ ${sign} (${hindiSignName}) saved successfully!`);
            await delay(2000);
        }
        console.log("\n🎉 सारा डेटा अपडेट हो गया!");
    } catch (err) {
        console.error("❌ Fatal Error:", err);
        process.exit(1);
    }
}

// 2. यहाँ फंक्शन को कॉल करें
runHoroscopeUpdater();
