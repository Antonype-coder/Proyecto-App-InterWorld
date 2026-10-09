<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../models/Producto.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';
require_once __DIR__ . '/../core/Exceptions/ConflictException.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../utils/Helpers.php';
require_once __DIR__ . '/../utils/Money.php';

if (!class_exists('ProductoController')) {
    class ProductoController
    {
        private Producto $productos;

        public function __construct()
        {
            $this->productos = new Producto();
        }

        public function index(Request $request): void
        {
            $filtros = [
                'busqueda'     => (string) $request->getQuery('busqueda', ''),
                'categoria_id' => $request->getQuery('categoria_id') !== null
                    ? (int) $request->getQuery('categoria_id')
                    : null,
                'activo'       => $request->getQuery('activo') !== null
                    ? (int) $request->getQuery('activo')
                    : 1,
                'stock_bajo'   => (int) $request->getQuery('stock_bajo', 0),
            ];

            $limit  = (int) $request->getQuery('limit', 100);
            $offset = (int) $request->getQuery('offset', 0);
            if ($limit <= 0 || $limit > 500) $limit = 100;
            if ($offset < 0) $offset = 0;

            $items = $this->productos->allWithRelations($filtros, 'p.nombre ASC', $limit, $offset);
            $total = $this->productos->countWithFilters($filtros);

            Response::paginated($items, $total, $limit, $offset, 'Productos obtenidos correctamente.');
        }

        public function show(Request $request): void
        {
            $id = (int) $request->param('id');
            $p  = $this->productos->find($id);

            if ($p === null) {
                throw new NotFoundException('Producto no encontrado.');
            }

            Response::success($p, 'Producto obtenido correctamente.');
        }

        public function findByBarcode(Request $request): void
        {
            $codigo = (string) $request->param('codigo');

            if ($codigo === '') {
                throw new BusinessException('Código de barras requerido.');
            }

            $p = $this->productos->findByBarcode($codigo);
            if ($p === null) {
                throw new NotFoundException('Producto no encontrado con ese código.');
            }

            Response::success($p, 'Producto obtenido correctamente.');
        }

        public function stockBajo(Request $request): void
        {
            Response::success($this->productos->stockBajo(), 'Productos con stock bajo.');
        }

        /**
         * Estadísticas reales de ventas del producto (con descuentos aplicados).
         */
        public function estadisticas(Request $request): void
        {
            $id = (int) $request->param('id');

            $p = $this->productos->find($id);
            if ($p === null) {
                throw new NotFoundException('Producto no encontrado.');
            }

            $stats = $this->productos->estadisticas($id);

            Response::success($stats, 'Estadísticas obtenidas correctamente.');
        }

        public function store(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('codigo_barras')->maxLength('codigo_barras', 64)
              ->required('nombre')->minLength('nombre', 2)->maxLength('nombre', 150)
              ->required('precio_venta')->numeric('precio_venta')->min('precio_venta', 0);

            if (array_key_exists('precio_compra', $data)) {
                $v->numeric('precio_compra')->min('precio_compra', 0);
            }
            if (array_key_exists('stock', $data)) {
                $v->integer('stock')->min('stock', 0);
            }
            if (array_key_exists('stock_minimo', $data)) {
                $v->integer('stock_minimo')->min('stock_minimo', 0);
            }

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $codigo = tienda_sanitize_string((string) $data['codigo_barras']);

            if ($this->productos->barcodeExists($codigo)) {
                throw new ConflictException('Ya existe un producto con ese código de barras.');
            }

            $imagenes = $this->validarImagenes(
                $data['imagenes'] ?? null,
                $data['imagen'] ?? null
            );

            $id = $this->productos->createWithImages([
                'codigo_barras' => $codigo,
                'nombre'        => tienda_sanitize_string((string) $data['nombre']),
                'descripcion'   => isset($data['descripcion']) ? tienda_sanitize_string((string) $data['descripcion']) : null,
                'categoria_id'  => isset($data['categoria_id']) && $data['categoria_id'] !== '' ? (int) $data['categoria_id'] : null,
                'proveedor_id'  => isset($data['proveedor_id']) && $data['proveedor_id'] !== '' ? (int) $data['proveedor_id'] : null,
                'precio_compra' => isset($data['precio_compra']) ? Money::toDb($data['precio_compra']) : '0.00',
                'precio_venta'  => Money::toDb($data['precio_venta']),
                'stock'         => isset($data['stock']) ? tienda_to_int($data['stock']) : 0,
                'stock_minimo'  => isset($data['stock_minimo']) ? tienda_to_int($data['stock_minimo']) : 5,
                'activo'        => isset($data['activo']) ? (int)(bool) $data['activo'] : 1,
            ], $imagenes);

            Response::created($this->productos->find($id), 'Producto creado correctamente.');
        }

        public function update(Request $request): void
        {
            $id = (int) $request->param('id');

            if ($this->productos->find($id) === null) {
                throw new NotFoundException('Producto no encontrado.');
            }

            $data = $request->all();
            $v = new Validator($data);

            if (array_key_exists('nombre', $data)) {
                $v->minLength('nombre', 2)->maxLength('nombre', 150);
            }
            if (array_key_exists('precio_venta', $data)) {
                $v->numeric('precio_venta')->min('precio_venta', 0);
            }
            if (array_key_exists('precio_compra', $data)) {
                $v->numeric('precio_compra')->min('precio_compra', 0);
            }
            if (array_key_exists('stock_minimo', $data)) {
                $v->integer('stock_minimo')->min('stock_minimo', 0);
            }

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $campos = [];
            $imagenesActualizadas = array_key_exists('imagenes', $data)
                || array_key_exists('imagen', $data);
            $imagenes = [];

            if ($imagenesActualizadas) {
                $imagenes = $this->validarImagenes(
                    $data['imagenes'] ?? null,
                    $data['imagen'] ?? null
                );
                $campos['imagen'] = $imagenes[0] ?? null;
            }

            if (array_key_exists('codigo_barras', $data)) {
                $codigo = tienda_sanitize_string((string) $data['codigo_barras']);
                if ($this->productos->barcodeExists($codigo, $id)) {
                    throw new ConflictException('Ese código de barras ya lo usa otro producto.');
                }
                $campos['codigo_barras'] = $codigo;
            }

            if (array_key_exists('nombre', $data)) {
                $campos['nombre'] = tienda_sanitize_string((string) $data['nombre']);
            }
            if (array_key_exists('descripcion', $data)) {
                $campos['descripcion'] = tienda_sanitize_string((string) $data['descripcion']);
            }
            if (array_key_exists('categoria_id', $data)) {
                $campos['categoria_id'] = ($data['categoria_id'] === null || $data['categoria_id'] === '')
                    ? null : (int) $data['categoria_id'];
            }
            if (array_key_exists('proveedor_id', $data)) {
                $campos['proveedor_id'] = ($data['proveedor_id'] === null || $data['proveedor_id'] === '')
                    ? null : (int) $data['proveedor_id'];
            }
            if (array_key_exists('precio_compra', $data)) {
                $campos['precio_compra'] = Money::toDb($data['precio_compra']);
            }
            if (array_key_exists('precio_venta', $data)) {
                $campos['precio_venta'] = Money::toDb($data['precio_venta']);
            }
            if (array_key_exists('stock_minimo', $data)) {
                $campos['stock_minimo'] = tienda_to_int($data['stock_minimo']);
            }
            if (array_key_exists('activo', $data)) {
                $campos['activo'] = (int)(bool) $data['activo'];
            }

            if ($campos === []) {
                throw new BusinessException('No enviaste campos para actualizar.');
            }

            if ($imagenesActualizadas) {
                $this->productos->updateWithImages($id, $campos, $imagenes);
            } else {
                $this->productos->update($id, $campos);
            }
            Response::success($this->productos->find($id), 'Producto actualizado correctamente.');
        }

        private function validarImagenes(mixed $imagenes, mixed $imagenPrincipal): array
        {
            if ($imagenes === null) $imagenes = [];
            if (!is_array($imagenes) || count($imagenes) > 8) {
                throw new BusinessException('Un producto puede tener hasta 8 imágenes.');
            }

            $rutas = [];
            foreach ($imagenes as $imagen) {
                $ruta = $this->validarImagen($imagen);
                if ($ruta === null) {
                    throw new BusinessException('La lista contiene una imagen vacía.');
                }
                if (!in_array($ruta, $rutas, true)) $rutas[] = $ruta;
            }

            if ($rutas === [] && $imagenPrincipal !== null && $imagenPrincipal !== '') {
                $ruta = $this->validarImagen($imagenPrincipal);
                if ($ruta !== null) $rutas[] = $ruta;
            }

            return $rutas;
        }

        private function validarImagen(mixed $imagen): ?string
        {
            if ($imagen === null || $imagen === '') {
                return null;
            }

            if (
                !is_string($imagen)
                || strlen($imagen) > 255
                || !preg_match('#\Astorage/uploads/productos/[0-9]{14}_[a-f0-9]{12}\.(?:jpe?g|png|webp)\z#i', $imagen)
            ) {
                throw new BusinessException('La ruta de imagen del producto no es válida.');
            }

            $storageDir = realpath(dirname(__DIR__) . '/storage/uploads/productos');
            $imagePath = realpath(dirname(__DIR__) . '/' . $imagen);

            if (
                $storageDir === false
                || $imagePath === false
                || !is_file($imagePath)
                || strpos($imagePath, $storageDir . DIRECTORY_SEPARATOR) !== 0
            ) {
                throw new BusinessException('La imagen no existe en el almacenamiento del servidor.');
            }

            return $imagen;
        }

        public function destroy(Request $request): void
        {
            $id = (int) $request->param('id');

            if ($this->productos->find($id) === null) {
                throw new NotFoundException('Producto no encontrado.');
            }

            $this->productos->update($id, ['activo' => 0]);
            Response::success(null, 'Producto desactivado correctamente.');
        }
    }
}