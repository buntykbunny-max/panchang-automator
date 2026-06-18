const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const SunCalc = require('suncalc'); 

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updatePanchang() {
  try {
    const date = new Date();
    const lat = 28.6139; // नई दिल्ली
    const lng = 77.2090;
    
    // 🌟 1. सूर्योदय और सूर्यास्त का कैलकुलेशन (यह सबसे सटीक है)
    const times = SunCalc.getTimes(date, lat, lng);
    
    // टाइम को भारत के टाइमज़ोन (IST) में फॉर्मेट करना
    const sunriseStr = times.sunrise.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
    const sunsetStr = times.sunset.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });

    // 🌟 2. तिथि और नक्षत्र कैलकुलेशन (जो पहले चल रहा था)
    const moonPos = SunCalc.getMoonPosition(date, lat, lng);
    const sunPos = SunCalc.getPosition(date, lat, lng);
    const moonLon = (moonPos.azimuth * 180 / Math.PI + 360) % 360;
    const sunLon = (sunPos.azimuth * 180 / Math.PI + 360) % 360;
    const diff = (moonLon - sunLon + 360) % 360;
    const tithi = Math.floor(diff / 12) + 1;
    const nakshatra = Math.floor(moonLon / 13.33) + 1;

    const panchangData = {
      date: date.toISOString().split('T')[0],
      sunrise: sunriseStr, // 🌟 अब सूर्योदय आएगा
      sunset: sunsetStr,   // 🌟 अब सूर्यास्त आएगा
      tithi: tithi,
      nakshatra: nakshatra,
      location: 'New Delhi',
      updatedAt: new Date()
    };
    
    await db.collection('daily_panchang').doc('today').set(panchangData);
    console.log('✅ पंचांग + सूर्योदय/सूर्यास्त अपडेट हो गया!', panchangData);
  } catch (error) {
    console.error('❌ पंचांग एरर:', error);
  }
}

updatePanchang();
