const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const Panchangam = require('@ishubhamx/panchangam-js');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updatePanchang() {
  try {
    const date = new Date();
    const location = { lat: 28.6139, lon: 77.2090, name: 'New Delhi' };

    // Library se accurate calculation
    const panchang = new Panchangam(date, location);

    const sunrise = panchang.sunrise.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' 
    }).toLowerCase().replace(/^0/, '');

    const sunset = panchang.sunset.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' 
    }).toLowerCase().replace(/^0/, '');

    const panchangData = {
      date: date.toISOString().split('T')[0],
      location: 'New Delhi',
      sunrise: sunrise,
      sunset: sunset,
      tithi_name: panchang.tithi.name,           // Accurate
      nakshatra_name: panchang.nakshatra.name,   // Accurate
      updatedAt: new Date()
    };

    await db.collection('daily_panchang').doc('today').set(panchangData);
    
    console.log('✅ Panchang Updated:', panchangData);

  } catch (error) {
    console.error('❌ Panchang Error:', error);
  }
}

updatePanchang();
