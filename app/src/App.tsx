import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { MatchesProvider } from './context/MatchesContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import Home from './pages/Home';
import MatchDetail from './pages/MatchDetail';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Standings from './pages/Standings';

const ONBOARDING_KEY = 'centralscore-onboarding-seen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_KEY));

  function finishOnboarding() {
    localStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  }

  return (
    <LanguageProvider>
      <NotificationsProvider>
        <FavoritesProvider>
          <MatchesProvider>
            {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
            {!showSplash && showOnboarding && <Onboarding onDone={finishOnboarding} />}
            <HashRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/match/:id" element={<MatchDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/standings/:compId" element={<Standings />} />
                </Route>
              </Routes>
            </HashRouter>
          </MatchesProvider>
        </FavoritesProvider>
      </NotificationsProvider>
    </LanguageProvider>
  );
}
