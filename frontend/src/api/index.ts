export { default as api, http, setUnauthorizedHandler } from './client';
export { authApi } from './auth.api';
export { usuariosApi } from './usuarios.api';
export { categoriasApi } from './categorias.api';
export { proveedoresApi } from './proveedores.api';
export { productosApi } from './productos.api';
export { openFoodFactsApi } from './openfoodfacts.api';
export { upcitemdbApi } from './upcitemdb.api';
export {
	buscarEnCatalogosPublicos,
	catalogoPublicoLabel,
} from './catalogos-publicos.api';
export type {
	FuenteCatalogoPublico,
	ProductoCatalogoPublico,
} from './catalogos-publicos.api';
export { clientesApi } from './clientes.api';
export { inventarioApi } from './inventario.api';
export { ventasApi } from './ventas.api';
export { cajaApi } from './caja.api';
export { reportesApi } from './reportes.api';
export { dashboardApi } from './dashboard.api';
export { notificacionesApi } from './notificaciones.api';
export { auditoriaApi } from './auditoria.api';
export { configuracionApi } from './configuracion.api';
export { uploadsApi } from './uploads.api';
export { busquedaApi } from './busqueda.api';
export type { BusquedaResultado } from './busqueda.api';
export { devolucionesApi } from './devoluciones.api';
export { promocionesApi } from './promociones.api';
export { ordenesCompraApi } from './ordenes-compra.api';
export { lealtadApi } from './lealtad.api';
export * from './productos.api';
export type { ProductoEstadisticas } from './productos.api';