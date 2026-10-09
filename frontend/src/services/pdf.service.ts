// src/services/pdf.service.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { formatCurrency, formatDateTime } from '@utils/format';
import { APP_NAME } from '@utils/constants';
import { getImageUrl } from '@utils/image';

interface ReporteVentasData {
  desde: string;
  hasta: string;
  totalVentas: number;
  montoTotal: string;
  ticketPromedio: string;
  ventas: Array<{
    id: number;
    numero: string;
    fecha: string;
    cliente: string;
    vendedor: string;
    tipoPago: string;
    total: string;
    estado: string;
  }>;
  negocio: {
    nombre: string;
    nit?: string;
    telefono?: string;
    direccion?: string;
    logo?: string;
  };
}

interface ReporteInventarioData {
  totalProductos: number;
  valorTotal: string;
  productos: Array<{
    codigo: string;
    nombre: string;
    categoria: string;
    stock: number;
    stockMinimo: number;
    precioCompra: string;
    precioVenta: string;
    valorTotal: string;
  }>;
  negocio: {
    nombre: string;
    nit?: string;
    telefono?: string;
    direccion?: string;
    logo?: string;
  };
}

interface ReporteCarteraData {
  totalCartera: string;
  totalClientes: number;
  clientes: Array<{
    nombre: string;
    documento: string;
    telefono: string;
    cupo: string;
    deuda: string;
    disponible: string;
  }>;
  negocio: {
    nombre: string;
    nit?: string;
    telefono?: string;
    direccion?: string;
    logo?: string;
  };
}

// ============================================================================
// Convierte una URL de imagen a data URI (base64)
// Necesario porque expo-print NO carga imágenes http://
// ============================================================================
async function imagenABase64(url: string): Promise<string | null> {
  try {
    const extension = url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
    const localUri = `${FileSystem.cacheDirectory}logo-report-${Date.now()}.${extension}`;

    const download = await FileSystem.downloadAsync(url, localUri);
    if (download.status !== 200) return null;

    const base64 = await FileSystem.readAsStringAsync(download.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const mime =
      extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : extension === 'gif'
            ? 'image/gif'
            : 'image/jpeg';

    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

export const pdfService = {
  async generarReporteVentas(data: ReporteVentasData): Promise<void> {
    const html = await buildVentasHTML(data);
    await generarYCompartirPDF(html, `reporte-ventas-${data.desde}-${data.hasta}`);
  },

  async generarReporteInventario(data: ReporteInventarioData): Promise<void> {
    const html = await buildInventarioHTML(data);
    await generarYCompartirPDF(html, `reporte-inventario`);
  },

  async generarReporteCartera(data: ReporteCarteraData): Promise<void> {
    const html = await buildCarteraHTML(data);
    await generarYCompartirPDF(html, `reporte-cartera`);
  },
};

async function generarYCompartirPDF(html: string, filename: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('Compartir no está disponible en este dispositivo');
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: `Compartir ${filename}`,
    UTI: 'com.adobe.pdf',
  });
}

async function buildHeader(
  negocio: {
    nombre: string;
    nit?: string;
    telefono?: string;
    direccion?: string;
    logo?: string;
  },
  titulo: string,
): Promise<string> {
  let logoHtml = '';

  const logoPath = negocio.logo?.trim();
  if (logoPath) {
    const logoUrl = getImageUrl(logoPath);
    if (logoUrl) {
      // Intentar convertir a base64 (lo que realmente funciona en expo-print)
      const dataUri = await imagenABase64(logoUrl);
      const finalSrc = dataUri ?? logoUrl;

      logoHtml = `<img src="${escapeHtml(finalSrc)}" style="display:block;max-width:180px;max-height:72px;object-fit:contain;margin:0 auto 12px;" />`;
    }
  }

  return `
    <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #111827; padding-bottom: 20px;">
      ${logoHtml}
      <h1 style="margin: 0; color: #111827; font-size: 24px;">${escapeHtml(negocio.nombre || APP_NAME)}</h1>
      ${negocio.nit ? `<p style="margin: 5px 0; color: #4B5563; font-size: 12px;">NIT: ${escapeHtml(negocio.nit)}</p>` : ''}
      ${negocio.direccion ? `<p style="margin: 5px 0; color: #4B5563; font-size: 12px;">${escapeHtml(negocio.direccion)}</p>` : ''}
      ${negocio.telefono ? `<p style="margin: 5px 0; color: #4B5563; font-size: 12px;">Tel: ${escapeHtml(negocio.telefono)}</p>` : ''}
      <h2 style="margin: 20px 0 0 0; color: #111827; font-size: 18px;">${titulo}</h2>
      <p style="margin: 5px 0 0 0; color: #6B7280; font-size: 11px;">Generado el ${formatDateTime(new Date().toISOString())}</p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function buildFooter(): string {
  return `
    <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #E5E7EB; text-align: center; color: #9CA3AF; font-size: 10px;">
      <p>Generado por ${APP_NAME} v2.0.0</p>
    </div>
  `;
}

const TABLE_STYLES = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background: #F3F4F6; text-align: left; padding: 10px 8px; font-size: 11px; font-weight: 600; color: #374151; border-bottom: 2px solid #E5E7EB; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 10px 8px; font-size: 12px; color: #111827; border-bottom: 1px solid #F3F4F6; }
    tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }
    .text-center { text-align: center; }
    .summary { background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .summary-item { flex: 1; }
    .summary-label { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-value { font-size: 20px; font-weight: 700; color: #111827; margin-top: 5px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .badge-success { background: #ECFDF5; color: #065F46; }
    .badge-danger { background: #FEF2F2; color: #991B1B; }
    .badge-warning { background: #FFFBEB; color: #92400E; }
  </style>
`;

async function buildVentasHTML(data: ReporteVentasData): Promise<string> {
  const rows = data.ventas
    .map(
      (v) => `
    <tr>
      <td>${escapeHtml(v.numero)}</td>
      <td>${formatDateTime(v.fecha)}</td>
      <td>${escapeHtml(v.cliente)}</td>
      <td>${escapeHtml(v.vendedor)}</td>
      <td class="text-center">${escapeHtml(v.tipoPago)}</td>
      <td class="text-right">${formatCurrency(v.total)}</td>
      <td class="text-center">
        <span class="badge ${v.estado === 'anulada' ? 'badge-danger' : 'badge-success'}">
          ${v.estado === 'anulada' ? 'ANULADA' : 'OK'}
        </span>
      </td>
    </tr>
  `,
    )
    .join('');

  const header = await buildHeader(data.negocio, 'REPORTE DE VENTAS');

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8">${TABLE_STYLES}</head>
      <body>
        ${header}
        <p style="text-align: center; color: #6B7280; font-size: 12px; margin-bottom: 20px;">
          Del ${escapeHtml(data.desde)} al ${escapeHtml(data.hasta)}
        </p>
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Total ventas</div>
            <div class="summary-value">${data.totalVentas}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Monto total</div>
            <div class="summary-value">${formatCurrency(data.montoTotal)}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Ticket promedio</div>
            <div class="summary-value">${formatCurrency(data.ticketPromedio)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Folio</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th class="text-center">Pago</th>
              <th class="text-right">Total</th>
              <th class="text-center">Estado</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7" class="text-center" style="padding: 40px; color: #9CA3AF;">Sin ventas en este período</td></tr>'}</tbody>
        </table>
        ${buildFooter()}
      </body>
    </html>
  `;
}

async function buildInventarioHTML(data: ReporteInventarioData): Promise<string> {
  const rows = data.productos
    .map(
      (p) => `
    <tr>
      <td>${escapeHtml(p.codigo)}</td>
      <td>${escapeHtml(p.nombre)}</td>
      <td>${escapeHtml(p.categoria)}</td>
      <td class="text-center">${p.stock}</td>
      <td class="text-center">${p.stockMinimo}</td>
      <td class="text-right">${formatCurrency(p.precioCompra)}</td>
      <td class="text-right">${formatCurrency(p.precioVenta)}</td>
      <td class="text-right"><strong>${formatCurrency(p.valorTotal)}</strong></td>
    </tr>
  `,
    )
    .join('');

  const header = await buildHeader(data.negocio, 'REPORTE DE INVENTARIO');

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8">${TABLE_STYLES}</head>
      <body>
        ${header}
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Productos activos</div>
            <div class="summary-value">${data.totalProductos}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Valor total del inventario</div>
            <div class="summary-value">${formatCurrency(data.valorTotal)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th class="text-center">Stock</th>
              <th class="text-center">Mín.</th>
              <th class="text-right">Compra</th>
              <th class="text-right">Venta</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="8" class="text-center" style="padding: 40px;">Sin productos</td></tr>'}</tbody>
        </table>
        ${buildFooter()}
      </body>
    </html>
  `;
}

async function buildCarteraHTML(data: ReporteCarteraData): Promise<string> {
  const rows = data.clientes
    .map(
      (c) => `
    <tr>
      <td>${escapeHtml(c.nombre)}</td>
      <td>${escapeHtml(c.documento)}</td>
      <td>${escapeHtml(c.telefono)}</td>
      <td class="text-right">${formatCurrency(c.cupo)}</td>
      <td class="text-right"><strong style="color: #DC2626;">${formatCurrency(c.deuda)}</strong></td>
      <td class="text-right">${formatCurrency(c.disponible)}</td>
    </tr>
  `,
    )
    .join('');

  const header = await buildHeader(data.negocio, 'REPORTE DE CARTERA');

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8">${TABLE_STYLES}</head>
      <body>
        ${header}
        <div class="summary">
          <div class="summary-item">
            <div class="summary-label">Clientes con deuda</div>
            <div class="summary-value">${data.totalClientes}</div>
          </div>
          <div class="summary-item">
            <div class="summary-label">Total por cobrar</div>
            <div class="summary-value" style="color: #DC2626;">${formatCurrency(data.totalCartera)}</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Documento</th>
              <th>Teléfono</th>
              <th class="text-right">Cupo</th>
              <th class="text-right">Deuda</th>
              <th class="text-right">Disponible</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6" class="text-center" style="padding: 40px;">Sin deudas pendientes</td></tr>'}</tbody>
        </table>
        ${buildFooter()}
      </body>
    </html>
  `;
}