import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaFire, FaWhatsapp } from 'react-icons/fa';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

// Fallback data if Firebase fails
const initialData = [
  { id: 1, nameKey: "Puri Bhaji", nameMr: "पुरी भाजी", nameHi: "पूरी भाजी", price: 40, image: "/puribhaji.png", popular: true },
  { id: 2, nameKey: "Pohe", nameMr: "पोहे", nameHi: "पोहे", price: 30, image: "/pohe.png" },
  { id: 3, nameKey: "Vada Pav", nameMr: "वडापाव", nameHi: "वडा पाव", price: 10, image: "/vadapav.png", popular: true },
  { id: 4, nameKey: "Special Tea", nameMr: "चहा", nameHi: "चाय", price: 10, image: "/tea.jpg" },
  { id: 5, nameKey: "Mirchi Bhaji", nameMr: "मिरची भजी", nameHi: "मिर्ची भजी", price: 30, image: "/gol_mirchi_bhaji.png" },
  { id: 6, nameKey: "Gol Kanda Bhaji", nameMr: "गोल कांदा भजी", nameHi: "गोल प्याज भजी", price: 30, image: "/gol_kanda_bhaji.png" },
  { id: 7, nameKey: "Batata Bhaji", nameMr: "बटाटा भाजी प्लेट", nameHi: "आलू भाजी प्लेट", price: 30, image: "/batata_bhaji.png" }
];

const MenuSection = () => {
  const { t, i18n } = useTranslation();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // WhatsApp order message based on selected language
  const getWhatsAppMessage = (item) => {
    const lang = i18n.language;
    const itemName = lang === 'mr' ? item.nameMr : lang === 'hi' ? item.nameHi : item.nameKey;
    if (lang === 'mr') {
      return `नमस्कार, मला ${itemName} ऑर्डर करायचे आहे.`;
    } else if (lang === 'hi') {
      return `नमस्ते, मुझे ${itemName} ऑर्डर करना है।`;
    } else {
      return `Hello, I would like to order ${itemName}.`;
    }
  };

  // Button text based on language
  const getButtonText = () => {
    const lang = i18n.language;
    if (lang === 'mr') return 'ऑर्डर करा';
    if (lang === 'hi') return 'ऑर्डर करें';
    return 'Add to Order';
  };

  // Item name based on language
  const getItemName = (item) => {
    const lang = i18n.language;
    if (lang === 'mr') return item.nameMr;
    if (lang === 'hi') return item.nameHi;
    return item.nameKey;
  };

  // Loading text based on language
  const getLoadingText = () => {
    const lang = i18n.language;
    if (lang === 'mr') return 'मेनू लोड होत आहे...';
    if (lang === 'hi') return 'मेनू लोड हो रहा है...';
    return 'Loading fresh menu...';
  };

  // Best Seller badge text
  const getBestSeller = () => {
    const lang = i18n.language;
    if (lang === 'mr') return 'बेस्ट सेलर';
    if (lang === 'hi') return 'बेस्ट सेलर';
    return 'Best Seller';
  };

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const menuCollection = collection(db, 'menu');
        const menuSnapshot = await getDocs(menuCollection);
        setMenuItems(initialData);
      } catch (err) {
        console.error("Error connecting to Firebase:", err);
        setMenuItems(initialData);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  return (
    <div id="menu" className="py-16 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            {t('menu_title')}
          </h2>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 mx-auto">
            {t('hero_tagline')}
          </p>
        </div>

        {loading ? (
          <div className="mt-12 text-center text-gray-500 dark:text-gray-400">
            <p>{getLoadingText()}</p>
          </div>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {menuItems.map((item) => (
              <div
                key={item.id || item.dbId}
                className="bg-white dark:bg-gray-800 overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group flex flex-col"
              >
                <div className="relative h-48 w-full overflow-hidden flex-shrink-0">
                  <img
                    src={item.image}
                    alt={getItemName(item)}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {item.popular && (
                    <div className="absolute top-4 right-4 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-md">
                      <FaFire className="mr-1" /> {getBestSeller()}
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1 pr-4">
                      <span className="block text-2xl mb-1 text-orange-600 dark:text-orange-400">{getItemName(item)}</span>
                    </h3>
                    <span className="text-2xl font-black text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-lg shrink-0">
                      ₹{item.price}
                    </span>
                  </div>

                  <div className="mt-auto pt-4">
                    <a
                      href={`https://wa.me/919579734238?text=${encodeURIComponent(getWhatsAppMessage(item))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-green-500 hover:text-white dark:hover:bg-green-500 text-gray-800 dark:text-gray-200 py-3 rounded-xl font-semibold transition-colors flex justify-center items-center gap-2"
                    >
                      <FaWhatsapp className="text-green-500 group-hover:text-white text-lg" />
                      {getButtonText()}
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuSection;
