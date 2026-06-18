const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const translate = require('google-translate-api-x');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// 🌟 बदलाव 1: API के लिए राशियों का पहला अक्षर बड़ा कर दिया गया है
const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

db.settings({ ignoreUndefinedProperties: true });

async function fetchAndSaveHoroscope() {
  const date = new Date();
  const todayId = date.toISOString().split('T')[0];

  for (const sign of signs) {
    try {
      console.log(`\n--- Fetching data for: ${sign} ---`);

     const dailyRes = await fetch(`https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${sign}`);
      const dailyData = await dailyRes.json();
      
      const weeklyRes = await fetch(`https://freehoroscopeapi.com/api/v1/get-horoscope/weekly?sign=${sign}`);
      const weeklyData = await weeklyRes.json();

      // 🌟 लॉग्स चेक करें कि वीकली डेटा का स्ट्रक्चर क्या है
      console.log(`Raw Weekly Response:`, JSON.stringify(weeklyData));

      const dailyEnglishText = dailyData?.data?.horoscope || dailyData?.horoscope;
      
      // 🌟 यहाँ पर हो सकता है API वीकली के लिए अलग की (Key) दे रही हो
      // अगर API वीकली का रिस्पॉन्स 'data' के अंदर नहीं दे रही, तो यह लाइन उसे पकड़ेगी:
      const weeklyEnglishText = weeklyData?.data?.horoscope || weeklyData?.horoscope || weeklyData?.weekly_horoscope || weeklyData?.prediction;

      // अगर API ने डेटा नहीं दिया, तो Firebase में कचरा सेव करने के बजाय उसे स्किप (Skip) कर दें
      if (!dailyEnglishText) {
         console.log(`❌ API ने ${sign} का डेटा नहीं दिया। स्किपिंग...`);
         continue; 
      }

      console.log(`Translating ${sign} to Hindi...`);
      const dailyHindi = await translate(dailyEnglishText, { to: 'hi' });
      const weeklyHindi = await translate(weeklyEnglishText, { to: 'hi' });

      // Firebase में सेव करते समय राशि का नाम वापस छोटा (lowercase) कर दें ताकि आपकी ऐप का डिज़ाइन न बिगड़े
      const dbSign = sign.toLowerCase();

      await db.collection('daily_rashifal').doc(dbSign).set({
        sign: dbSign,
        date: todayId,
        prediction: dailyHindi.text,
        updatedAt: new Date()
      }, { merge: true });

      await db.collection('weekly_rashifal').doc(dbSign).set({
        sign: dbSign,
        prediction: weeklyHindi.text,
        updatedAt: new Date()
      }, { merge: true });

      console.log(`✅ ${sign} saved successfully in Hindi!`);
      await delay(2000); 

    } catch (error) {
      console.error(`❌ Error processing ${sign}:`, error.message);
    }
  }
  console.log("\n🎉 सारा डेटा प्रोसेस हो गया!");
}

fetchAndSaveHoroscope();
