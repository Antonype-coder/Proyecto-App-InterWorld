import type { Producto } from './producto';

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: undefined;
};

export type DashboardStackParamList = {
  Dashboard: undefined;
};

export type ProductosStackParamList = {
  ProductosList: undefined;
  ProductoForm:
    | { productId?: number; codigoEscaneado?: string }
    | undefined;
  ProductoDetalle: { productId: number };
  ProductoScanner: { origen: 'pos' | 'formulario' };
};

export type VentasStackParamList = {
  VentasList: undefined;
  VentaDetalle: { ventaId: number };
  DevolucionForm: { ventaId: number };
  DevolucionDetalle: { devolucionId: number };
};

export type ClientesStackParamList = {
  ClientesList: undefined;
  ClienteForm: { clienteId?: number } | undefined;
  ClienteDetalle: { clienteId: number };
  ClienteEstadoCuenta: { clienteId: number };
};

export type CategoriasStackParamList = {
  CategoriasList: undefined;
  CategoriaForm: { categoriaId?: number } | undefined;
};

export type ProveedoresStackParamList = {
  ProveedoresList: undefined;
  ProveedorForm: { proveedorId?: number } | undefined;
  ProveedorDetalle: { proveedorId: number };
};

export type InventarioStackParamList = {
  InventarioList: undefined;
  MovimientoForm: { productoId?: number } | undefined;
};

export type CajaStackParamList = {
  CajaHome: undefined;
  AbrirCaja: undefined;
  CerrarCaja: { sesionId: number };
  CajaHistorial: undefined;
  CajaMovimientoForm: { sesionId: number };
};

export type ReportesStackParamList = {
  ReportesHome: undefined;
};

export type UsuariosStackParamList = {
  UsuariosList: undefined;
  UsuarioForm: { usuarioId?: number } | undefined;
};

export type MasStackParamList = {
  MasHome: undefined;
  Perfil: undefined;
  EditarPerfil: undefined;
  CambiarPassword: undefined;
  Configuracion: undefined;
  Notificaciones: undefined;
  Auditoria: undefined;
  CentroAyuda: undefined;
  AcercaDe: undefined;
  Clientes: undefined;
  ClienteForm: { clienteId?: number } | undefined;
  ClienteEstadoCuenta: { clienteId: number };
  ClienteLealtad: { clienteId: number };
  Inventario: undefined;
  MovimientoForm: { productoId?: number } | undefined;
  Caja: undefined;
  AbrirCaja: undefined;
  CerrarCaja: { sesionId: number };
  CajaHistorial: undefined;
  CajaMovimientoForm: { sesionId: number };
  Reportes: undefined;
  Usuarios: undefined;
  Devoluciones: undefined;
  DevolucionDetalle: { devolucionId: number };
  Promociones: undefined;
  PromocionForm: { promocionId?: number } | undefined;
  OrdenesCompra: undefined;
  OrdenCompraForm: undefined;
  OrdenCompraDetalle: { ocId: number };
  LealtadRanking: undefined;
  Categorias: undefined;
  CategoriaForm: { categoriaId?: number } | undefined;
  Proveedores: undefined;
  ProveedorForm: { proveedorId?: number } | undefined;
  ProveedorDetalle: { proveedorId: number };
};

export type AppTabsParamList = {
  Inicio: undefined;
  Productos: undefined;
  Vender: { productoEscaneado?: Producto } | undefined;
  Ventas: undefined;
  Mas: undefined;
  ProductoScanner: { origen: 'pos' | 'formulario' };
  BusquedaGlobal: undefined;
};