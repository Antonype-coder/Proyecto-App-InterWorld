import { useAuthStore } from '@store/authStore';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin());

  return {
    user,
    isAdmin,
    isVendedor: user?.rol === 'vendedor',
    isLoggedIn: user !== null,
  };
}