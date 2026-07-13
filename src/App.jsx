import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import MenuSection from './components/MenuSection';
import DeliveryInfoSection from './components/DeliveryInfoSection';
import AboutSection from './components/AboutSection';
import { FaWhatsapp } from 'react-icons/fa';
import './i18n';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 text-gray-900 dark:text-gray-100 font-sans relative">
      <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      
      <main>
        <HeroSection />
        <MenuSection />
        <DeliveryInfoSection />
        <AboutSection />
      </main>
      
      {/* Footer with Google Map */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-orange-500 mb-4">Dhuldev Nashta & Vadapav Center</h3>
            <p className="text-gray-400 max-w-md">
              Sangar Galli, Kacheri Road, Sangola, Solapur, Maharashtra, India.
            </p>
            <div className="mt-4 space-y-2 text-gray-400 mb-6">
              <p>📞 Digvijay Dhatinge - 9579734238</p>
              <p>📞 Balkrishna Dhatinge - 8623087728</p>
            </div>
            <a 
              href="https://wa.me/919579734238" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center text-green-500 hover:text-green-400 text-lg font-bold"
            >
              <FaWhatsapp className="mr-2 text-2xl" /> WhatsApp Us
            </a>
          </div>
          
          <div className="w-full h-64 rounded-xl overflow-hidden shadow-lg border border-gray-700">
            {/* Google Maps Embed for Sangar Galli, Kacheri Road, Sangola */}
            <iframe 
              width="100%" 
              height="100%" 
              title="Google Map Location"
              src="https://maps.google.com/maps?q=sangar%20galli%20kacheri%20road%20sangola&t=&z=15&ie=UTF8&iwloc=&output=embed" 
              frameBorder="0" 
              scrolling="no" 
              marginHeight="0" 
              marginWidth="0"
            ></iframe>
          </div>
        </div>
        <div className="text-center mt-12 pt-8 border-t border-gray-800 text-gray-500">
          <p>&copy; {new Date().getFullYear()} Dhuldev Nashta & Vadapav Center. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/919579734238?text=Hello,%20I%20would%20like%20to%20order" 
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-all hover:scale-110 z-50 flex items-center justify-center"
      >
        <FaWhatsapp size={32} />
      </a>
    </div>
  );
}

export default App;
