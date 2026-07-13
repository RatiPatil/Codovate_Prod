import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaMotorcycle, FaClock, FaMapMarkerAlt, FaPhoneAlt } from 'react-icons/fa';

const DeliveryInfoSection = () => {
  const { t } = useTranslation();

  return (
    <div id="delivery" className="py-16 bg-white dark:bg-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-12">
          <h2 className="text-base text-orange-600 dark:text-orange-400 font-semibold tracking-wide uppercase">
            {t('home_delivery')}
          </h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            {t('delivery_title')}
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-400 lg:mx-auto">
            Fresh and hot snacks delivered right to your door from Dhuldev Nashta & Vadapav Center.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            <div className="relative bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <FaClock className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">Delivery Timings</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                <p className="mb-1 font-semibold">Morning: <span className="font-normal">7:00 AM to 12:00 PM</span></p>
                <p className="font-semibold">Evening: <span className="font-normal">4:00 PM to 9:00 PM</span></p>
              </dd>
            </div>

            <div className="relative bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <FaMapMarkerAlt className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">Delivery Areas</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Sangola City (सांगोला शहर)</li>
                  <li>Aathvda Bajar Area (आठवडा बाजार परिसर)</li>
                  <li>Nearby Locations (जवळील परिसर)</li>
                </ul>
              </dd>
            </div>

            <div className="relative bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <FaMotorcycle className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">Order Details</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{t('min_order')}</p>
                <p className="mt-2">All menu items available for delivery!</p>
              </dd>
            </div>

            <div className="relative bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                  <FaPhoneAlt className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">Contact to Order</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-400">
                <a href="tel:9579734238" className="block text-orange-600 dark:text-orange-400 font-bold hover:underline mb-2">
                  📞 Digvijay Dhatinge - 9579734238
                </a>
                <a href="tel:8623087728" className="block text-orange-600 dark:text-orange-400 font-bold hover:underline">
                  📞 Balkrishna Dhatinge - 8623087728
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfoSection;
