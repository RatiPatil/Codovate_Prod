import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle } from 'react-icons/fa';

const AboutSection = () => {
  const { t } = useTranslation();

  return (
    <div id="about" className="py-16 bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          <div className="mb-10 lg:mb-0">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl mb-6">
              {t('about_title')}
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              {t('about_text')}
            </p>
            <ul className="space-y-4">
              {['Fresh Ingredients', 'Hygienic Preparation', 'Authentic Taste', 'Fast Service'].map((feature, idx) => (
                <li key={idx} className="flex items-center text-lg text-gray-700 dark:text-gray-300">
                  <FaCheckCircle className="text-orange-500 mr-3" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="relative rounded-2xl overflow-hidden shadow-2xl">
            {/* Replaced the meat skewers image with a lovely Indian Tea (Chai) image! */}
            <img 
              src="https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80" 
              alt="Authentic Indian Tea" 
              className="w-full h-[400px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent"></div>
            <div className="absolute bottom-6 left-6 text-white">
              <h3 className="text-2xl font-bold">Dhuldev Nashta & Vadapav Center</h3>
              <p className="opacity-90">Special Maharashtrian Chai</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
