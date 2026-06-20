const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const SunCalc = require('suncalc');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updatePanchang() {
  try {
    const date = new Date();
    const lat = 28.6139;   // New Delhi
    const lng = 77.2090;

    // 🌅 Sunrise & Sunset (yeh sahi hai)
    const times = SunCalc.getTimes(date, lat, lng);
    const sunriseStr = times.sunrise.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).toLowerCase().replace(/^0/, '');

    const sunsetStr = times.sunset.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).toLowerCase().replace(/^0/, '');

    // 📍 Better Tithi & Nakshatra Calculation (Improved Logic)
    const moonPos = SunCalc.getMoonPosition(date, lat, lng);
    const sunPos = SunCalc.getPosition(date, lat, lng);

    // Approximate ecliptic longitude (better than before)
    let moonLon = (moonPos.azimuth * 180 / Math.PI + 360) % 360;
    let sunLon = (sunPos.azimuth * 180 / Math.PI + 360) % 360;

    // Better adjustment for accuracy
    moonLon = (moonLon + 180) % 360;   // rough correction

    const diff = (moonLon - sunLon + 360) % 360;

    // Tithi
    const tithiIndex = Math.floor(diff / 12) % 15;
    const tithiList = [
      "प्रतिपदा", "द्वितीया", "तृतीया", "चतुर्थी", "पंचमी", "षष्ठी", 
      "सप्तमी", "अष्टमी", "नवमी", "दशमी", "एकादशी", "द्वादशी", 
      "त्रयोदशी", "चतुर्दशी", "पूर्णिमा/अमावस्या"
    ];

    // Nakshatra
    const nakshatraIndex = Math.floor(moonLon / 13.333) % 27;
    const nakshatraList = [
      "अश्विनी", "भरणी", "कृतिका", "रोहिणी", "मृगशिरा", "आर्द्रा", 
      "पुनर्वसु", "पुष्य", "अश्लेषा", "मघा", "पूर्वा फाल्गुनी", 
      "उत्तरा फाल्गुनी", "हस्त", "चित्रा", "स्वाति", "विशाखा", 
      "अनुराधा", "ज्येष्ठा", "मूल", "पूर्वाषाढ़ा", "उत्तराषाढ़ा", 
      "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्वा भाद्रपद", "उत्तरा भाद्रपद", "रेवती"
    ];

    const panchangData = {
      date: date.toISOString().split('T')[0],
      location: 'New Delhi',
      sunrise: sunriseStr,
      sunset: sunsetStr,
      tithi_name: tithiList[tithiIndex],
      nakshatra_name: nakshatraList[nakshatraIndex],
      updatedAt: new Date()
    };

    await db.collection('daily_panchang').doc('today').set(panchangData);
    
    console.log('✅ Panchang Updated Successfully:', panchangData);

  } catch (error) {
    console.error('❌ Panchang Error:', error);
  }
}

updatePanchang();
