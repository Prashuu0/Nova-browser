import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import BrowserWindow from './components/BrowserWindow/BrowserWindow';
import WebLandingPage from './components/Landing/WebLandingPage';
import SplashScreen from './components/common/SplashScreen';
import { fetchSettings } from './store/slices/settingsSlice';
import { fetchBookmarks } from './store/slices/bookmarksSlice';
import { fetchDownloads } from './store/slices/downloadsSlice';
import { setOffline } from './store/slices/uiSlice';

const isElectron = typeof window !== 'undefined' && !!window.novaAPI;

function App() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.settings.data.theme);
  const [showSplash, setShowSplash] = useState(isElectron);

  useEffect(() => {
    if (!isElectron) return;

    dispatch(fetchSettings());
    dispatch(fetchBookmarks());
    dispatch(fetchDownloads());

    const handleOnline = () => dispatch(setOffline(false));
    const handleOffline = () => dispatch(setOffline(true));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  if (!isElectron) {
    return <WebLandingPage />;
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
      <BrowserWindow />
    </>
  );
}

export default App;
