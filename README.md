# Codovate 🍽️

A modern food ordering web app built with **React**, **Vite**, and **Firebase**.

## Features

- 🛒 Browse local food menu (Bhaji, Vadapav, Pohe, Tea & more)
- 🌐 Multi-language support via eact-i18next
- 🔥 Firebase Firestore backend
- 📦 Firebase Hosting deployment
- ⚡ Fast dev experience with Vite

## Tech Stack

| Tech | Purpose |
|------|---------|
| React | UI Framework |
| Vite | Build Tool |
| Firebase | Backend & Hosting |
| Tailwind CSS | Styling |
| react-i18next | Internationalization |
| Framer Motion | Animations |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx
│   ├── HeroSection.jsx
│   ├── MenuSection.jsx
│   ├── AboutSection.jsx
│   └── DeliveryInfoSection.jsx
├── App.jsx
├── firebase.js
├── i18n.js
└── main.jsx
public/
└── (food images & menu data)
```

## Deployment

This app is deployed via **Firebase Hosting**.

```bash
npm run build
firebase deploy
```

---

Made with ❤️ by [RatiPatil](https://github.com/RatiPatil)
