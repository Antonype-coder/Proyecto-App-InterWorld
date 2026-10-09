import type { Promocion } from '@tipos/index';

export interface PromoContexto {
  productoId: number;
  categoriaId?: number | null;
}

function aplicaAProducto(promo: Promocion, ctx?: PromoContexto): boolean {
  if (!ctx) return true;
  if (promo.aplica_a === 'global') return true;
  if (promo.aplica_a === 'producto') {
    return Number(promo.producto_id) === Number(ctx.productoId);
  }
  if (promo.aplica_a === 'categoria') {
    if (ctx.categoriaId == null) return false;
    return Number(promo.categoria_id) === Number(ctx.categoriaId);
  }
  return false;
}

export function descuentoDePromocion(
  promo: Promocion,
  precioUnitario: number,
  cantidad: number,
  ctx?: PromoContexto,
): number {
  if (!aplicaAProducto(promo, ctx)) return 0;

  const valor = parseFloat(String(promo.valor)) || 0;
  const minimo = Number(promo.cantidad_minima) || 1;

  if (cantidad < minimo) return 0;
  if (precioUnitario <= 0 || cantidad <= 0) return 0;

  switch (promo.tipo) {
    case 'porcentaje': {
      const pct = Math.min(Math.max(valor, 0), 100);
      return precioUnitario * cantidad * (pct / 100);
    }
    case 'monto_fijo':
      return Math.min(valor, precioUnitario * cantidad);
    case 'precio_especial': {
      const ahorroUnit = Math.max(0, precioUnitario - valor);
      return ahorroUnit * cantidad;
    }
    case '2x1': {
      const gratis = Math.floor(cantidad / 2);
      return gratis * precioUnitario;
    }
    case '3x2': {
      const gratis = Math.floor(cantidad / 3);
      return gratis * precioUnitario;
    }
    default:
      return 0;
  }
}

export function mejorDescuento(
  promociones: Promocion[] | undefined,
  precioUnitario: number,
  cantidad: number,
  ctx?: PromoContexto,
): { descuento: number; promo: Promocion | null } {
  if (!promociones || promociones.length === 0) {
    return { descuento: 0, promo: null };
  }

  let mejorDesc = 0;
  let mejorPromo: Promocion | null = null;

  for (const p of promociones) {
    const d = descuentoDePromocion(p, precioUnitario, cantidad, ctx);
    if (d > mejorDesc + 0.001) {
      mejorDesc = d;
      mejorPromo = p;
    }
  }

  return { descuento: mejorDesc, promo: mejorPromo };
}

export function labelDePromocion(promo: Promocion): string {
  const valor = parseFloat(String(promo.valor)) || 0;
  switch (promo.tipo) {
    case 'porcentaje':
      return `${valor}% dcto`;
    case 'monto_fijo':
      return `-$${valor}`;
    case 'precio_especial':
      return `Precio $${valor}`;
    case '2x1':
      return '2x1';
    case '3x2':
      return '3x2';
    default:
      return promo.nombre;
  }
}

// ============================================================================
// ANÁLISIS DE PROMOCIÓN — para el detalle del producto
// ============================================================================

export interface AnalisisPromo {
  promo: Promocion;
  /** Cantidad usada para el cálculo (mínimo para activar la promo) */
  cantidadReferencia: number;
  /** Total si no hubiera promo */
  totalBruto: number;
  /** Total cobrado con promo */
  totalNeto: number;
  /** Cuánto se descontó */
  descuento: number;
  /** Precio efectivo por unidad con promo */
  precioUnitarioConPromo: number;
  /** Costo total (precio_compra × cantidad) */
  costoTotal: number;
  /** Ganancia SIN promo */
  gananciaSinPromo: number;
  /** Ganancia CON promo */
  gananciaConPromo: number;
  /** Diferencia de ganancia (negativo = pierde, positivo = gana) */
  diferencia: number;
  /** Margen % sin promo */
  margenSinPromo: number;
  /** Margen % con promo */
  margenConPromo: number;
}

/**
 * Analiza qué pasa con la ganancia si se aplica la promo.
 * Usa cantidad mínima para activar la promo, o 2 para 2x1, o 3 para 3x2.
 */
export function analizarPromocion(
  promo: Promocion,
  precioVenta: number,
  precioCompra: number,
): AnalisisPromo {
  // Determinar cantidad de referencia
  let cantidadRef = Number(promo.cantidad_minima) || 1;
  if (promo.tipo === '2x1' && cantidadRef < 2) cantidadRef = 2;
  if (promo.tipo === '3x2' && cantidadRef < 3) cantidadRef = 3;
  if (cantidadRef < 1) cantidadRef = 1;

  const descuento = descuentoDePromocion(promo, precioVenta, cantidadRef);
  const totalBruto = precioVenta * cantidadRef;
  const totalNeto = Math.max(0, totalBruto - descuento);
  const costoTotal = precioCompra * cantidadRef;
  const gananciaSinPromo = totalBruto - costoTotal;
  const gananciaConPromo = totalNeto - costoTotal;
  const diferencia = gananciaConPromo - gananciaSinPromo;

  const margenSinPromo =
    totalBruto > 0 ? (gananciaSinPromo / totalBruto) * 100 : 0;
  const margenConPromo =
    totalNeto > 0 ? (gananciaConPromo / totalNeto) * 100 : 0;

  return {
    promo,
    cantidadReferencia: cantidadRef,
    totalBruto,
    totalNeto,
    descuento,
    precioUnitarioConPromo: cantidadRef > 0 ? totalNeto / cantidadRef : precioVenta,
    costoTotal,
    gananciaSinPromo,
    gananciaConPromo,
    diferencia,
    margenSinPromo,
    margenConPromo,
  };
}