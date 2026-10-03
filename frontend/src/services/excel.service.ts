// src/services/excel.service.ts
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { formatDateTime } from '@utils/format';

interface ExcelRow { [key: string]: string | number; }

export const excelService = {
  async generarExcel(
    nombreArchivo: string,
    hoja: string,
    columnas: string[],
    filas: ExcelRow[],
  ): Promise<void> {
    const data: (string | number)[][] = [columnas];

    for (const fila of filas) {
      data.push(columnas.map((col) => fila[col] ?? ''));
    }

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, hoja);

    const colWidths = columnas.map((col) => {
      const maxLen = Math.max(
        col.length,
        ...filas.map((f) => String(f[col] ?? '').length),
      );
      return { wch: Math.min(maxLen + 2, 40) };
    });
    worksheet['!cols'] = colWidths;

    const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
    const uri = `${FileSystem.cacheDirectory}${nombreArchivo}-${Date.now()}.xlsx`;

    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      throw new Error('Compartir no está disponible');
    }

    await Sharing.shareAsync(uri, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Compartir ${nombreArchivo}`,
      UTI: 'com.microsoft.excel.xlsx',
    });
  },

  async generarReporteVentas(
    ventas: Array<{
      numero: string;
      fecha: string;
      cliente: string;
      vendedor: string;
      tipoPago: string;
      total: string;
      estado: string;
    }>,
  ): Promise<void> {
    const filas = ventas.map((v) => ({
      Folio: v.numero,
      Fecha: formatDateTime(v.fecha),
      Cliente: v.cliente,
      Vendedor: v.vendedor,
      'Tipo de pago': v.tipoPago,
      Total: parseFloat(v.total),
      Estado: v.estado,
    }));

    await this.generarExcel(
      'reporte-ventas',
      'Ventas',
      ['Folio', 'Fecha', 'Cliente', 'Vendedor', 'Tipo de pago', 'Total', 'Estado'],
      filas,
    );
  },

  async generarReporteInventario(
    productos: Array<{
      codigo: string;
      nombre: string;
      categoria: string;
      stock: number;
      stockMinimo: number;
      precioCompra: string;
      precioVenta: string;
    }>,
  ): Promise<void> {
    const filas = productos.map((p) => ({
      'Código': p.codigo,
      'Producto': p.nombre,
      'Categoría': p.categoria,
      'Stock': p.stock,
      'Stock mínimo': p.stockMinimo,
      'Precio compra': parseFloat(p.precioCompra),
      'Precio venta': parseFloat(p.precioVenta),
      'Valor inventario': p.stock * parseFloat(p.precioCompra),
    }));

    await this.generarExcel(
      'reporte-inventario',
      'Inventario',
      ['Código', 'Producto', 'Categoría', 'Stock', 'Stock mínimo', 'Precio compra', 'Precio venta', 'Valor inventario'],
      filas,
    );
  },

  async generarReporteCartera(
    clientes: Array<{
      nombre: string;
      documento: string;
      telefono: string;
      cupo: string;
      deuda: string;
      disponible: string;
    }>,
  ): Promise<void> {
    const filas = clientes.map((c) => ({
      'Cliente': c.nombre,
      'Documento': c.documento,
      'Teléfono': c.telefono,
      'Cupo': parseFloat(c.cupo),
      'Deuda': parseFloat(c.deuda),
      'Disponible': parseFloat(c.disponible),
    }));

    await this.generarExcel(
      'reporte-cartera',
      'Cartera',
      ['Cliente', 'Documento', 'Teléfono', 'Cupo', 'Deuda', 'Disponible'],
      filas,
    );
  },
};