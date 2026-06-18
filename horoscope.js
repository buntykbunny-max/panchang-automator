const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
// अगर API इंग्लिश में है, तो हिंदी करने के लिए:
// const translate = require('google-translate-api-x');

// Firebase सेटअप
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 12 राशियों की लिस्ट
const signs = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// छोटा सा डिले (Delay) फंक्शन ताकि फ्री API ब्लॉक न हो
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchAndSaveHoroscope() {
  const date = new Date();
  const todayId = date.toISOString().split('T')[0]; // Format: 2026-06-18

  for (const sign of signs) {
    try {
      console.log(`Fetching data for: ${sign}...`);

      // 🌟 1. API से Daily राशिफल लाएं
      // नोट: एंडपॉइंट का URL वेबसाइट के डॉक्यूमेंटेशन के हिसाब से थोड़ा बदल लेना
      const dailyRes = await fetch(`https://freehoroscopeapi.com/api/daily?sign=${sign}`);
      const dailyData = await dailyRes.json();

      // 🌟 2. API से Weekly राशिफल लाएं
      const weeklyRes = await fetch(`https://freehoroscopeapi.com/api/weekly?sign=${sign}`);
      const weeklyData = await weeklyRes.json();

      /* 
      💡 अगर डेटा इंग्लिश में है और आपको हिंदी में चाहिए:
      const hindiDaily = await translate(dailyData.data, { to: 'hi' });
      const hindiWeekly = await translate(weeklyData.data, { to: 'hi' });
      */

      // 🌟 3. Firebase में Daily सेव करें
      await db.collection('daily_rashifal').doc(sign).set({
        sign: sign,
        date: todayId,
        prediction: dailyData.data, // API के JSON स्ट्रक्चर के हिसाब से 'data' या 'horoscope' लिखें
        updatedAt: new Date()
      }, { merge: true });

      // 🌟 4. Firebase में Weekly सेव करें
      await db.collection('weekly_rashifal').doc(sign).set({
        sign: sign,
        prediction: weeklyData.data, 
        updatedAt: new Date()
      }, { merge: true });

      console.log(`✅ ${sign} saved successfully!`);
      
      // फ्री API को ओवरलोड से बचाने के लिए 2 सेकंड का ब्रेक
      await delay(2000); 

    } catch (error) {
      console.error(`❌ Error fetching ${sign}:`, error);
    }
  }
  
  console.log("🎉 सारा डेली और वीकली राशिफल Firebase में अपडेट हो गया!");
}

fetchAndSaveHoroscope();
