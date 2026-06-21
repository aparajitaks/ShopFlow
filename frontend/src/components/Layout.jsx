import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, LayoutDashboard, Shield, ChevronRight } from 'lucide-react';

function NavLink({ to, icon: Icon, children }) {
  const { pathname } = useLocation();
  const active = pathname === to || (to !== '/' && pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-600 text-white'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={15} aria-hidden="true" />
      {children}
    </Link>
  );
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Top navigation ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo + product name */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
                <ShoppingBag size={14} className="text-white" aria-hidden="true" />
              </div>
              <div className="leading-none">
                <span className="text-sm font-black text-gray-900 tracking-tight">ShopFlow</span>
                <span className="ml-2 text-xs font-medium text-gray-400">Trust & Risk Console</span>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="flex items-center gap-1" aria-label="Main navigation">
              <NavLink to="/" icon={LayoutDashboard}>Dashboard</NavLink>
              <NavLink to="/watchlist" icon={Shield}>Watchlist</NavLink>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-xs text-gray-400 text-center">
            ShopFlow Trust & Risk Console · Internal Tool · Not for public access
          </p>
        </div>
      </footer>
    </div>
  );
}
