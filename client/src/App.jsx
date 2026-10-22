import { BrowserRouter, Route, Routes } from 'react-router';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';
import AuthPage from './pages/AuthPage.jsx';
import HomePage from './pages/HomePage.jsx';
import ShopPage from './pages/ShopPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import GamePage from './pages/GamePage.jsx';
import { Navigate } from 'react-router';

function Root() {
  // Гость на "/" видит форму входа; вошедший на "/login" — сразу дом (сама AuthPage это тоже делает).
  const { user, checking } = useAuth();
  if (checking) return null;
  return user ? <Navigate to="/" replace /> : <AuthPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/game" element={<GamePage />} />
              </Route>
            </Route>
            <Route path="*" element={<Root />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
