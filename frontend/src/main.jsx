import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ToastProvider from './components/ui/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <AuthProvider>
        <RoleProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RoleProvider>
      </AuthProvider>
    </ToastProvider>
  </React.StrictMode>,
);