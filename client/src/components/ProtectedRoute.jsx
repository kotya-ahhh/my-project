import { Navigate, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext.jsx';
import { PetHead } from './Pet.jsx';

export default function ProtectedRoute() {
  const { user, checking } = useAuth();

  if (checking) {
    return (
      <div className="state-box" role="status">
        <PetHead face="sleepy" />
        <p className="muted">Загружаем Майнула…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
