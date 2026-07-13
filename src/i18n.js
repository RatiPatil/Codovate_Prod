import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "hero_title": "Dhuldev Nashta & Vadapav Center",
      "hero_tagline": "Delicious Breakfast • Fresh Ingredients • Reasonable Prices",
      "menu_title": "Our Menu",
      "about_title": "About Us",
      "about_text": "At Dhuldev Nashta & Vadapav Center, you get fresh, delicious, and hygienically prepared breakfast items. Customer satisfaction and excellent taste are our main goals.",
      "delivery_title": "Delivery Details",
      "contact_title": "Contact Us",
      "order_now": "Order Now",
      "call_now": "Call Now",
      "home_delivery": "Home Delivery Available",
      "min_order": "Minimum Order: ₹50"
    }
  },
  mr: {
    translation: {
      "hero_title": "धुळदेव नाश्ता आणि वडापाव सेंटर",
      "hero_tagline": "चविष्ट नाश्ता • ताजे पदार्थ • वाजवी दर",
      "menu_title": "आमचा मेनू",
      "about_title": "आमच्याबद्दल",
      "about_text": "धुळदेव नाश्ता आणि वडापाव सेंटर येथे ताजे, स्वादिष्ट आणि स्वच्छतेची काळजी घेऊन बनवलेले नाश्त्याचे पदार्थ मिळतात. ग्राहकांचे समाधान आणि उत्कृष्ट चव हेच आमचे ध्येय आहे.",
      "delivery_title": "डिलिव्हरी तपशील",
      "contact_title": "संपर्क",
      "order_now": "ऑर्डर करा",
      "call_now": "कॉल करा",
      "home_delivery": "होम डिलिव्हरी उपलब्ध",
      "min_order": "किमान ऑर्डर: ₹50"
    }
  },
  hi: {
    translation: {
      "hero_title": "धुलदेव नाश्ता और वड़ापाव सेंटर",
      "hero_tagline": "स्वादिष्ट नाश्ता • ताज़ा सामग्री • उचित मूल्य",
      "menu_title": "हमारा मेनू",
      "about_title": "हमारे बारे में",
      "about_text": "धुलदेव नाश्ता और वड़ापाव सेंटर में ताज़ा, स्वादिष्ट और स्वच्छता से तैयार किया गया नाश्ता मिलता है। ग्राहकों की संतुष्टि और बेहतरीन स्वाद ही हमारा लक्ष्य है।",
      "delivery_title": "डिलीवरी विवरण",
      "contact_title": "संपर्क करें",
      "order_now": "ऑर्डर करें",
      "call_now": "कॉल करें",
      "home_delivery": "होम डिलीवरी उपलब्ध",
      "min_order": "न्यूनतम ऑर्डर: ₹50"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'mr', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
