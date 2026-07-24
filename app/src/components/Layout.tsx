import { Link, Outlet } from 'react-router-dom';
import { isLiveApiConfigured } from '../api/client';

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[#0f172a]/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#00c853]" />
            Central<span className="text-[#00c853]">Score</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-300">
            <Link to="/" className="hover:text-white">Meciuri</Link>
            <Link to="/favorites" className="hover:text-white">Favorite</Link>
          </nav>
        </div>
        {!isLiveApiConfigured && (
          <div className="bg-amber-500/10 text-amber-300 text-xs text-center py-1 px-4">
            Mod demo — date de exemplu. Conectează Worker-ul Sportmonks pentru date live.
          </div>
        )}
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-white/10 text-center text-xs text-gray-500 py-4">
        CentralScore · date furnizate de Sportmonks
      </footer>
    </div>
  );
}
