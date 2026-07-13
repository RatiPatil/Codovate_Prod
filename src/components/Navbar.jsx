import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSun as Sun, FiMoon as Moon, FiMenu as Menu, FiX as Close } from 'react-icons/fi';

const Navbar = ({ toggleTheme, isDarkMode }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo / Brand */}
          <div className="flex-shrink-0 flex items-center">
            <span className="font-bold text-xl text-orange-600 dark:text-orange-500">
              {t('hero_title').split(' ')[0]} {/* Dhuldev or धुळदेव */}
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#menu" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors">{t('menu_title')}</a>
            <a href="#delivery" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors">{t('delivery_title')}</a>
            <a href="#about" className="text-gray-700 dark:text-gray-300 hover:text-orange-500 transition-colors">{t('about_title')}</a>
            
            <div className="flex items-center space-x-4 border-l border-gray-300 dark:border-gray-700 pl-4">
              {/* Language Selector */}
              <select 
                onChange={handleLanguageChange} 
                value={i18n.language}
                className="bg-transparent text-gray-700 dark:text-gray-300 text-sm focus:outline-none cursor-pointer"
              >
                <option value="mr" className="text-black">मराठी</option>
                <option value="hi" className="text-black">हिन्दी</option>
                <option value="en" className="text-black">English</option>
              </select>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {/* Call Now Button */}
              <a href="tel:9579734238" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-medium transition-colors shadow-md">
                {t('call_now')}
              </a>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button onClick={toggleTheme} className="p-2 text-gray-700 dark:text-gray-300">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700 dark:text-gray-300">
              {isOpen ? <Close size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#menu" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-800 rounded-md">{t('menu_title')}</a>
            <a href="#delivery" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-800 rounded-md">{t('delivery_title')}</a>
            <a href="#about" className="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-800 rounded-md">{t('about_title')}</a>
            <div className="px-3 py-2 flex items-center justify-between">
              <select 
                onChange={handleLanguageChange} 
                value={i18n.language}
                className="bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
              >
                <option value="mr" className="text-black">मराठी</option>
                <option value="hi" className="text-black">हिन्दी</option>
                <option value="en" className="text-black">English</option>
              </select>
            </div>
            <a href="tel:9579734238" className="block text-center mt-4 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-full font-medium">
              {t('call_now')}
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
