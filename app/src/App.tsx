import { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { MatchesProvider } from './context/MatchesContext';
import { LanguageProvider } from './context/LanguageContext';
import Layout from './components/Layout';
import SplashScreen from './components/SplashScreen';
import Home from './pages/Home';
import MatchDetail from './pages/MatchDetail';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Standings from './pages/Standings';
import Transfers from './pages/Transfers';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <LanguageProvider>
      <NotificationsProvider>
        <FavoritesProvider>
          <MatchesProvider>
            {showSplash && <SplashScreen onDone={() => setShowSplash(false)} />}
            <HashRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/match/:id" element={<MatchDetail />} />
                  <Route path="/favorites" element={<Favorites />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/standings/:compId" element={<Standings />} />
                  <Route path="/transfers" element={<Transfers />} />
                </Route>
              </Routes>
            </HashRouter>
          </MatchesProvider>
        </FavoritesProvider>
      </NotificationsProvider>
    </LanguageProvider>
  );
}
