const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const SunCalc = require('suncalc'); // सिर्फ SunCalc का इस्तेमाल करेंगे

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updatePanchang() {
  try {
    const date = new Date();
    // 🌟 SunCalc से सूर्य और चंद्रमा की पोजीशन निकालें
    const lat = 28.6139;
    const lng = 77.2090;
    
    // SunCalc का मून पोजीशन (Radians में होता है, डिग्री में कन्वर्ट करेंगे)
    const moonPos = SunCalc.getMoonPosition(date, lat, lng);
    const sunPos = SunCalc.getPosition(date, lat, lng);

    // Radians to Degrees conversion
    const moonLon = (moonPos.azimuth * 180 / Math.PI + 360) % 360;
    const sunLon = (sunPos.azimuth * 180 / Math.PI + 360) % 360;

    // तिथि (Tithi) कैलकुलेशन: (Moon - Sun) / 12
    const diff = (moonLon - sunLon + 360) % 360;
    const tithi = Math.floor(diff / 12) + 1;

    // नक्षत्र (Nakshatra) कैलकुलेशन: Moon / 13.33
    const nakshatra = Math.floor(moonLon / 13.33) + 1;

    const panchangData = {
      date: date.toISOString().split('T')[0],
      tithi: tithi,
      nakshatra: nakshatra,
      location: 'New Delhi',
      updatedAt: new Date()
    };
    
    await db.collection('daily_panchang').doc('today').set(panchangData);
    console.log('✅ पंचांग सफलतापूर्वक अपडेट हो गया!', panchangData);
  } catch (error) {
    console.error('❌ पंचांग एरर:', error);
  }
}

updatePanchang();
