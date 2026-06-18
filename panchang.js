const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const Astronomy = require('astronomy-engine');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updatePanchang() {
  try {
    const date = new Date();
    const todayId = date.toISOString().split('T')[0];
    
    // नई दिल्ली कोऑर्डिनेट्स
    const lat = 28.6139;
    const lng = 77.2090;
    
    const sunEcliptic = Astronomy.Ecliptic(Astronomy.Body.Sun, date);
    const moonEcliptic = Astronomy.Ecliptic(Astronomy.Body.Moon, date);
    
    const tithiDiff = (moonEcliptic.elon - sunEcliptic.elon + 360) % 360;
    const tithiNumber = Math.ceil(tithiDiff / 12);
    
    const panchangData = {
      date: todayId,
      tithi: tithiNumber,
      location: 'New Delhi',
      updatedAt: new Date()
    };
    
    await db.collection('daily_panchang').doc('today').set(panchangData);
    console.log('✅ पंचांग सफलतापूर्वक अपडेट हो गया!');
  } catch (error) {
    console.error('❌ पंचांग एरर:', error);
  }
}

updatePanchang();
