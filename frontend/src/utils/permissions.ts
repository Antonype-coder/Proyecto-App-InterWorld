import type { Rol } from '@tipos/index';

export const isAdmin = (rol: Rol | null | undefined): boolean => rol === 'admin';
export const isVendedor = (rol: Rol | null | undefined): boolean => rol === 'vendedor';

export const canCreateProductos = (rol: Rol | null | undefined): boolean => isAdmin(rol);
export const canDeleteProductos = (rol: Rol | null | undefined): boolean => isAdmin(rol);
export const canManageUsuarios = (rol: Rol | null | undefined): boolean => isAdmin(rol);
export const canViewReportes = (rol: Rol | null | undefined): boolean => isAdmin(rol);
export const canAnularVentas = (rol: Rol | null | undefined): boolean => isAdmin(rol);
export const canManageConfiguracion = (rol: Rol | null | undefined): boolean => isAdmin(rol);
export const canViewAuditoria = (rol: Rol | null | undefined): boolean => isAdmin(rol);