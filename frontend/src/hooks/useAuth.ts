import { useAuthStore } from '@store/authStore';
import { usePermissions } from './usePermissions';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const permissions = usePermissions();

  return {
    user,
    isAdmin: permissions.isAdmin,
    isVendedor: permissions.isVendedor,
    isLoggedIn: user !== null,
    permissions,
  };
}