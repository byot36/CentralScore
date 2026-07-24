import { HashRouter, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import { NotificationsProvider } from './context/NotificationsContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import MatchDetail from './pages/MatchDetail';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';

export default function App() {
  return (
    <NotificationsProvider>
      <FavoritesProvider>
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/match/:id" element={<MatchDetail />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </HashRouter>
      </FavoritesProvider>
    </NotificationsProvider>
  );
}
