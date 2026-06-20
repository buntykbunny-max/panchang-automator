const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const SunCalc = require('suncalc');

// Firebase Initialization
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function updatePanchang() {
  try {
    const today = new Date();
    // Delhi / North India Coordinates
    const lat = 28.6139;
    const lng = 77.2090;

    // 🌟 स्टेप 1: आज के सूर्योदय का समय निकालें
    const times = SunCalc.getTimes(today, lat, lng);
    const sunriseDate = times.sunrise; // पंचांग हमेशा सूर्योदय के समय से गिना जाता है!

    const sunriseStr = times.sunrise.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' 
    }).toLowerCase().replace(/^0/, '');

    const sunsetStr = times.sunset.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' 
    }).toLowerCase().replace(/^0/, '');

    // 🌟 स्टेप 2: सूर्योदय के समय तिथि निकालें (Perfect Math using Moon Phase)
    // phase 0.0 (अमावस्या) से लेकर 1.0 (अगली अमावस्या) तक होता है
    const phase = SunCalc.getMoonIllumination(sunriseDate).phase;
    const tithiIndex = Math.floor(phase * 30) % 30;

    // 🌟 स्टेप 3: सूर्योदय के समय नक्षत्र निकालें (Julian Days & Ayanamsa Math)
    const d = (sunriseDate.getTime() / 86400000) - 10957.5; // Days since J2000
    let L = (218.316 + 13.176396 * d) % 360; // Moon's mean longitude
    if (L < 0) L += 360;
    
    const ayanamsa = 23.85 + (0.01396 * (d / 365.25)); // Lahiri Ayanamsa approximation
    let siderealMoon = (L - ayanamsa) % 360;
    if (siderealMoon < 0) siderealMoon += 360;
    
    const nakshatraIndex = Math.floor(siderealMoon / 13.333333) % 27;

    // 🌟 डेटा सूचियां (Lists)
    const tithiList = [
      "प्रतिपदा (शुक्ल)","द्वितीया (शुक्ल)","तृतीया (शुक्ल)","चतुर्थी (शुक्ल)","पंचमी (शुक्ल)",
      "षष्ठी (शुक्ल)","सप्तमी (शुक्ल)","अष्टमी (शुक्ल)","नवमी (शुक्ल)","दशमी (शुक्ल)",
      "एकादशी (शुक्ल)","द्वादशी (शुक्ल)","त्रयोदशी (शुक्ल)","चतुर्दशी (शुक्ल)","पूर्णिमा",
      "प्रतिपदा (कृष्ण)","द्वितीया (कृष्ण)","तृतीया (कृष्ण)","चतुर्थी (कृष्ण)","पंचमी (कृष्ण)",
      "षष्ठी (कृष्ण)","सप्तमी (कृष्ण)","अष्टमी (कृष्ण)","नवमी (कृष्ण)","दशमी (कृष्ण)",
      "एकादशी (कृष्ण)","द्वादशी (कृष्ण)","त्रयोदशी (कृष्ण)","चतुर्दशी (कृष्ण)","अमावस्या"
    ];

    const nakshatraList = [
      "अश्विनी","भरणी","कृतिका","रोहिणी","मृगशिरा","आर्द्रा","पुनर्वसु","पुष्य","अश्लेषा",
      "मघा","पूर्वा फाल्गुनी","उत्तरा फाल्गुनी","हस्त","चित्रा","स्वाति","विशाखा","अनुराधा",
      "ज्येष्ठा","मूल","पूर्वाषाढ़ा","उत्तराषाढ़ा","श्रवण","धनिष्ठा","शतभिषा","पूर्वा भाद्रपद",
      "उत्तरा भाद्रपद","रेवती"
    ];

    // 🌟 स्टेप 4: डेटाबेस के लिए पेलोड तैयार करें
    const panchangData = {
      date: today.toISOString().split('T')[0],
      location: 'New Delhi',
      sunrise: sunriseStr,
      sunset: sunsetStr,
      tithi_name: tithiList[tithiIndex],
      nakshatra_name: nakshatraList[nakshatraIndex],
      updatedAt: new Date()
    };

    // Firebase में सेव करें
    await db.collection('daily_panchang').doc('today').set(panchangData);
    console.log('✅ Panchang Updated Successfully:', panchangData);

  } catch (error) {
    console.error('❌ Error updating Panchang:', error);
  }
}

updatePanchang();
