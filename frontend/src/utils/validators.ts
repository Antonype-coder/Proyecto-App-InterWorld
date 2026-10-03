import { z } from 'zod';

// ========================================================================
// Auth
// ========================================================================
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo es obligatorio')
    .email('Correo inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ========================================================================
// Producto
// ========================================================================
export const productoSchema = z.object({
  codigo_barras: z
    .string()
    .min(1, 'El código de barras es obligatorio')
    .max(64, 'Máximo 64 caracteres'),
  nombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().optional(),
  categoria_id: z.coerce.number().int().positive().nullable().optional(),
  proveedor_id: z.coerce.number().int().positive().nullable().optional(),
  precio_compra: z.coerce
    .number({ message: 'Debe ser un número' })
    .min(0, 'No puede ser negativo'),
  precio_venta: z.coerce
    .number({ message: 'Debe ser un número' })
    .min(0, 'No puede ser negativo'),
  stock: z.coerce.number().int().min(0).optional(),
  stock_minimo: z.coerce.number().int().min(0).optional(),
});

export type ProductoFormData = z.infer<typeof productoSchema>;

// ========================================================================
// Cliente
// ========================================================================
export const clienteSchema = z.object({
  nombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  documento: z.string().optional(),
  telefono: z.string().optional(),
  email: z
    .union([z.string().email('Correo inválido'), z.literal('')])
    .optional(),
  direccion: z.string().optional(),
  cupo_credito: z.coerce.number().min(0, 'No puede ser negativo').optional(),
});

export type ClienteFormData = z.infer<typeof clienteSchema>;

// ========================================================================
// Movimiento de inventario
// ========================================================================
export const movimientoSchema = z.object({
  producto_id: z.coerce.number().int().positive('Selecciona un producto'),
  tipo: z.enum(['entrada', 'salida', 'ajuste']),
  cantidad: z.coerce
    .number({ message: 'Debe ser un número' })
    .int('Debe ser entero')
    .min(1, 'Debe ser mayor a cero'),
  motivo: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(255, 'Máximo 255 caracteres'),
});

export type MovimientoFormData = z.infer<typeof movimientoSchema>;

// ========================================================================
// Pago de crédito
// ========================================================================
export const pagoSchema = z.object({
  monto: z.coerce
    .number({ message: 'Debe ser un número' })
    .positive('Debe ser mayor a cero'),
  metodo_pago: z.enum(['efectivo', 'transferencia', 'tarjeta']),
  notas: z.string().optional(),
});

export type PagoFormData = z.infer<typeof pagoSchema>;

// ========================================================================
// Anular venta
// ========================================================================
export const anularVentaSchema = z.object({
  motivo: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(255, 'Máximo 255 caracteres'),
});

export type AnularVentaFormData = z.infer<typeof anularVentaSchema>;

// ========================================================================
// Usuario
// ========================================================================
export const usuarioSchema = z.object({
  nombre: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(120, 'Máximo 120 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
  rol: z.enum(['admin', 'vendedor']),
  activo: z.boolean().optional(),
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;

// ========================================================================
// Categoría
// ========================================================================
export const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: z.string().optional(),
  activo: z.boolean().optional(),
});

export type CategoriaFormData = z.infer<typeof categoriaSchema>;

// ========================================================================
// Proveedor
// ========================================================================
export const proveedorSchema = z.object({
  nombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(150, 'Máximo 150 caracteres'),
  contacto: z.string().optional(),
  telefono: z.string().optional(),
  email: z
    .union([z.string().email('Correo inválido'), z.literal('')])
    .optional(),
  direccion: z.string().optional(),
  notas: z.string().optional(),
  activo: z.boolean().optional(),
});

export type ProveedorFormData = z.infer<typeof proveedorSchema>;