import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import WatchlistPage from './pages/WatchlistPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/customer/:customerId" element={<CustomerProfilePage />} />
      <Route path="/watchlist" element={<WatchlistPage />} />
      {/* Catch-all → redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
