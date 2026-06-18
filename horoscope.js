const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const translate = require('google-translate-api-x'); // 🌟 ट्रांसलेशन पैकेज

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

db.settings({ ignoreUndefinedProperties: true });

async function fetchAndSaveHoroscope() {
  const date = new Date();
  const todayId = date.toISOString().split('T')[0];

  for (const sign of signs) {
    try {
      console.log(`Fetching & Translating data for: ${sign}...`);

      // 1. API से डेटा लाएं
      const dailyRes = await fetch(`https://freehoroscopeapi.com/api/daily?sign=${sign}`);
      const dailyData = await dailyRes.json();
      
      const weeklyRes = await fetch(`https://freehoroscopeapi.com/api/weekly?sign=${sign}`);
      const weeklyData = await weeklyRes.json();

      // 2. सही JSON पथ (Path) से इंग्लिश टेक्स्ट निकालें
      const dailyEnglishText = dailyData?.data?.horoscope || "डेटा उपलब्ध नहीं है";
      const weeklyEnglishText = weeklyData?.data?.horoscope || "डेटा उपलब्ध नहीं है";

      // 3. इंग्लिश से हिंदी में ट्रांसलेट करें
      const dailyHindi = await translate(dailyEnglishText, { to: 'hi' });
      const weeklyHindi = await translate(weeklyEnglishText, { to: 'hi' });

      // 4. Firebase में हिंदी डेटा सेव करें
      await db.collection('daily_rashifal').doc(sign).set({
        sign: sign,
        date: todayId,
        prediction: dailyHindi.text, // 🌟 ट्रांसलेटेड हिंदी टेक्स्ट 
        updatedAt: new Date()
      }, { merge: true });

      await db.collection('weekly_rashifal').doc(sign).set({
        sign: sign,
        prediction: weeklyHindi.text, // 🌟 ट्रांसलेटेड हिंदी टेक्स्ट
        updatedAt: new Date()
      }, { merge: true });

      console.log(`✅ ${sign} saved successfully in Hindi!`);
      await delay(2000); // API को ओवरलोड से बचाने के लिए ब्रेक

    } catch (error) {
      console.error(`❌ Error processing ${sign}:`, error.message);
    }
  }
  console.log("🎉 सारा राशिफल हिंदी में अनुवादित होकर Firebase में सेव हो गया!");
}

fetchAndSaveHoroscope();
