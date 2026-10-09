// API
export type { ApiResponse, ApiError, PaginatedResponse } from './api';

// Auth
export type { LoginRequest, LoginResponse } from './auth';

// Usuario
export type { Usuario, UsuarioInput, Rol } from './usuario';

// Categoría
export type { Categoria, CategoriaInput } from './categoria';

// Proveedor
export type { Proveedor, ProveedorInput } from './proveedor';

// Producto
export type { Producto, ProductoInput } from './producto';

export type { RegisterNegocioRequest } from './auth';

// Cliente
export type {
  Cliente,
  ClienteInput,
  PagoCredito,
  EstadoCuenta,
  PagoInput,
  VentaCreditoResumen,
} from './cliente';

export type {
  DashboardPeriodo,
  DashboardAvanzado,
  VentaPorHora,
  MetodoPagoDist,
  CajaAbierta,
  TopProducto,
  VentaPorDiaDetalle,
} from './dashboard';

// Venta
export type {
  TipoPago,
  EstadoVenta,
  VentaResumen,
  VentaDetalleItem,
  Venta,
  VentaItemInput,
  VentaInput,
  CarritoItem,
} from './venta';

// Inventario
export type {
  TipoMovimiento,
  MovimientoInventario,
  MovimientoInput,
} from './inventario';

// Caja
export type {
  CajaSesion,
  CajaMovimiento,
  AbrirCajaInput,
  CerrarCajaInput,
  MovimientoCajaInput,
} from './caja';

// Reporte
export type {
  ReporteResumen,
  VentaPorDia,
  ProductoMasVendido,
  CarteraItem,
  ReporteCartera,
  ProductoStockBajo,
} from './reporte';

// Notificación
export type { Notificacion, NotificacionesResponse } from './notificacion';

// Auditoría
export type { AuditoriaLog } from './auditoria';

// Configuración
export type { ConfiguracionData, ConfiguracionGrupo } from './configuracion';

// UI
export type {
  ToastVariant,
  ToastState,
  BadgeVariant,
  ButtonVariant,
  ButtonSize,
} from './ui';

// Navigation
export type {
  RootStackParamList,
  AuthStackParamList,
  DashboardStackParamList,
  ProductosStackParamList,
  VentasStackParamList,
  ClientesStackParamList,
  CategoriasStackParamList,
  ProveedoresStackParamList,
  InventarioStackParamList,
  CajaStackParamList,
  ReportesStackParamList,
  UsuariosStackParamList,
  MasStackParamList,
  AppTabsParamList,
} from './navigation';

export type {
  TipoDevolucion,
  EstadoDevolucion,
  MetodoDevolucion,
  Devolucion,
  DevolucionResumen,
  DevolucionDetalleItem,
  DevolucionInput,
} from './devolucion';

export type {
  TipoPromocion,
  AplicaA,
  Promocion,
  PromocionInput,
} from './promocion';

export type {
  EstadoOC,
  OrdenCompra,
  OrdenCompraResumen,
  OrdenCompraDetalleItem,
  OrdenCompraInput,
  RecepcionItem,
} from './orden-compra';

export type {
  NivelLealtad,
  LealtadInfo,
  PuntoHistorial,
  ClienteRanking,
} from './lealtad';