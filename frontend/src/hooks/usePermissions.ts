import { useAuthStore } from '@store/authStore';

export interface Permissions {
  rol: 'admin' | 'vendedor' | null;
  isAdmin: boolean;
  isVendedor: boolean;

  // Módulos admin-only
  puedeVerReportes: boolean;
  puedeVerUsuarios: boolean;
  puedeVerAuditoria: boolean;
  puedeVerConfiguracion: boolean;
  puedeVerLealtadRanking: boolean;

  // Productos
  puedeCrearProductos: boolean;
  puedeEditarProductos: boolean;
  puedeEliminarProductos: boolean;

  // Categorías / Proveedores
  puedeGestionarCategorias: boolean;
  puedeGestionarProveedores: boolean;

  // Caja
  puedeAbrirCaja: boolean;
  puedeCerrarCaja: boolean;

  // Ventas
  puedeAnularVentas: boolean;

  // Clientes
  puedeEliminarClientes: boolean;

  // Promociones / OC / Lealtad admin
  puedeGestionarPromociones: boolean;
  puedeGestionarOrdenesCompra: boolean;
  puedeAjustarPuntos: boolean;
}

export function usePermissions(): Permissions {
  const user = useAuthStore((s) => s.user);
  const rol = (user?.rol ?? null) as 'admin' | 'vendedor' | null;
  const isAdmin = rol === 'admin';
  const isVendedor = rol === 'vendedor';

  return {
    rol,
    isAdmin,
    isVendedor,

    puedeVerReportes: isAdmin,
    puedeVerUsuarios: isAdmin,
    puedeVerAuditoria: isAdmin,
    puedeVerConfiguracion: isAdmin,
    puedeVerLealtadRanking: isAdmin,

    puedeCrearProductos: isAdmin,
    puedeEditarProductos: isAdmin,
    puedeEliminarProductos: isAdmin,

    puedeGestionarCategorias: isAdmin,
    puedeGestionarProveedores: isAdmin,

    puedeAbrirCaja: isAdmin,
    puedeCerrarCaja: isAdmin,

    puedeAnularVentas: isAdmin,

    puedeEliminarClientes: isAdmin,

    puedeGestionarPromociones: isAdmin,
    puedeGestionarOrdenesCompra: isAdmin,
    puedeAjustarPuntos: isAdmin,
  };
}