export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost/tiendaapi/api';

export const APP_NAME = 'Interworld';
export const APP_VERSION = '2.0.0';

// Storage keys
export const STORAGE_TOKEN_KEY = '@tiendaadmin:token';
export const STORAGE_USER_KEY  = '@tiendaadmin:user';
export const STORAGE_SETTINGS_KEY = '@tiendaadmin:settings';

// Paginación
export const PAGE_SIZE = 50;

// Etiquetas
export const ROL_LABEL = {
  admin:    'Administrador',
  vendedor: 'Vendedor',
} as const;

export const TIPO_PAGO_LABEL = {
  contado: 'Contado',
  credito: 'Crédito',
} as const;

export const ESTADO_VENTA_LABEL = {
  completada: 'Completada',
  anulada:    'Anulada',
} as const;

export const TIPO_MOVIMIENTO_LABEL = {
  entrada: 'Entrada',
  salida:  'Salida',
  ajuste:  'Ajuste',
} as const;

export const METODO_PAGO_LABEL = {
  efectivo:      'Efectivo',
  transferencia: 'Transferencia',
  tarjeta:       'Tarjeta',
} as const;

export const STOCK_BADGE = {
  ok: {
    bg:    '#D1FAE5',
    text:  '#065F46',
    label: 'Disponible',
  },
  bajo: {
    bg:    '#FEF3C7',
    text:  '#92400E',
    label: 'Stock bajo',
  },
  agotado: {
    bg:    '#FEE2E2',
    text:  '#991B1B',
    label: 'Agotado',
  },
} as const;

export const QUERY_KEYS = {
  productos:     'productos',
  categorias:    'categorias',
  proveedores:   'proveedores',
  clientes:      'clientes',
  ventas:        'ventas',
  inventario:    'inventario',
  reportes:      'reportes',
  usuarios:      'usuarios',
  notificaciones: 'notificaciones',
  auditoria:     'auditoria',
  configuracion: 'configuracion',
} as const;