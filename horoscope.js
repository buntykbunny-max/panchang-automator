const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Firestore में undefined वैल्यूज़ को इग्नोर करने की सेटिंग
db.settings({ ignoreUndefinedProperties: true });

async function fetchAndSaveHoroscope() {
  const date = new Date();
  const todayId = date.toISOString().split('T')[0];

  for (const sign of signs) {
    try {
      console.log(`Fetching data for: ${sign}...`);

      const dailyRes = await fetch(`https://freehoroscopeapi.com/api/daily?sign=${sign}`);
      const dailyData = await dailyRes.json();
      
      const weeklyRes = await fetch(`https://freehoroscopeapi.com/api/weekly?sign=${sign}`);
      const weeklyData = await weeklyRes.json();

      // डेटा स्ट्रक्चर को कंसोल में प्रिंट करना ताकि असली Key का पता चल सके
      console.log(`Raw Daily Data for ${sign}:`, JSON.stringify(dailyData));

      // डायनामिक की-चेक (API के स्ट्रक्चर के हिसाब से)
      const dailyText = dailyData?.data?.horoscope_data || dailyData?.horoscope || dailyData?.data || "Data missing";
      const weeklyText = weeklyData?.data?.horoscope_data || weeklyData?.horoscope || weeklyData?.data || "Data missing";

      await db.collection('daily_rashifal').doc(sign).set({
        sign: sign,
        date: todayId,
        prediction: dailyText,
        updatedAt: new Date()
      }, { merge: true });

      await db.collection('weekly_rashifal').doc(sign).set({
        sign: sign,
        prediction: weeklyText,
        updatedAt: new Date()
      }, { merge: true });

      console.log(`✅ ${sign} saved successfully!`);
      await delay(2000); 

    } catch (error) {
      console.error(`❌ Error fetching ${sign}:`, error.message);
    }
  }
}

fetchAndSaveHoroscope();
