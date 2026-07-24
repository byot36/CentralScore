import { HashRouter, Routes, Route } from 'react-router-dom';
import { FavoritesProvider } from './context/FavoritesContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import MatchDetail from './pages/MatchDetail';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';

export default function App() {
  return (
    <FavoritesProvider>
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/match/:id" element={<MatchDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </HashRouter>
    </FavoritesProvider>
  );
}
