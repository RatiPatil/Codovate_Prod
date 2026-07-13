import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaWhatsapp, FaPhoneAlt } from 'react-icons/fa';

const HeroSection = () => {
  const { t } = useTranslation();
  
  // Slider images
  const images = [
    '/vadapav.png',
    '/puribhaji.png'
  ];
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev === 0 ? 1 : 0));
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative bg-gray-900 overflow-hidden min-h-[80vh] flex items-center">
      {/* Background Image Slider with Overlay */}
      {images.map((img, index) => (
        <div
          key={img}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentImage ? 'opacity-100' : 'opacity-0'}`}
        >
          <img
            className="w-full h-full object-cover"
            src={img}
            alt="Delicious food"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-black/60 mix-blend-multiply z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent dark:from-gray-900 z-10" />

      {/* Content */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center sm:text-left md:max-w-2xl">
          <h1 className="text-4xl tracking-tight font-extrabold text-white sm:text-5xl md:text-6xl drop-shadow-lg">
            <span className="block">{t('hero_title').split(' ').slice(0, 2).join(' ')}</span>
            <span className="block text-orange-500">{t('hero_title').split(' ').slice(2).join(' ')}</span>
          </h1>
          <p className="mt-3 text-base text-gray-200 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0 drop-shadow-md">
            {t('hero_tagline')}
          </p>
          <div className="mt-8 sm:mt-10 sm:flex sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="rounded-md shadow">
              <a
                href="https://wa.me/919579734238?text=Hello,%20I%20would%20like%20to%20order"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-green-500 hover:bg-green-600 transition-colors md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <FaWhatsapp className="mr-2 text-xl" />
                {t('order_now')} (WhatsApp)
              </a>
            </div>
            <div className="rounded-md shadow">
              <a
                href="tel:9579734238"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-orange-600 bg-white hover:bg-gray-50 transition-colors md:py-4 md:text-lg md:px-10 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <FaPhoneAlt className="mr-2" />
                {t('call_now')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
