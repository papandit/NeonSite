import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import App from './App.jsx';
import { store } from './store/index.js';
import { SiteSettingsProvider } from './context/SiteSettings.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <Provider store={store}>
        <SiteSettingsProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SiteSettingsProvider>
      </Provider>
    </HelmetProvider>
  </StrictMode>
);
