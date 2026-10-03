<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../services/PromocionService.php';

if (!class_exists('PromocionController')) {
    class PromocionController
    {
        private PromocionService $service;

        public function __construct()
        {
            $this->service = new PromocionService();
        }

        public function index(Request $request): void
        {
            $filtros = [];
            if ($request->getQuery('activo') !== null) {
                $filtros['activo'] = (int)$request->getQuery('activo');
            }
            if ($request->getQuery('vigentes') !== null) {
                $filtros['vigentes'] = true;
            }
            Response::success($this->service->listar($filtros), 'Promociones obtenidas.');
        }

        public function show(Request $request): void
        {
            $id = (int)$request->param('id');
            Response::success($this->service->obtener($id), 'Promoción obtenida.');
        }

        public function store(Request $request): void
        {
            $data = $request->all();
            $v = new Validator($data);
            $v->required('nombre')->minLength('nombre', 3)->maxLength('nombre', 150)
              ->required('tipo')->in('tipo', ['porcentaje','monto_fijo','precio_especial','2x1','3x2'])
              ->required('fecha_inicio')->date('fecha_inicio')
              ->required('fecha_fin')->date('fecha_fin');
            if ($v->fails()) Response::validationError($v->errors());

            $promo = $this->service->crear($data);
            Response::created($promo, 'Promoción creada.');
        }

        public function update(Request $request): void
        {
            $id = (int)$request->param('id');
            $data = $request->all();
            $promo = $this->service->actualizar($id, $data);
            Response::success($promo, 'Promoción actualizada.');
        }

        public function destroy(Request $request): void
        {
            $id = (int)$request->param('id');
            $this->service->eliminar($id);
            Response::success(null, 'Promoción desactivada.');
        }

        public function paraProducto(Request $request): void
        {
            $productoId = (int)$request->getQuery('producto_id', 0);
            $categoriaId = (int)$request->getQuery('categoria_id', 0);
            if ($productoId <= 0) {
                Response::success([], 'Sin promociones.');
            }
            $promos = $this->service->vigentesParaProducto($productoId, $categoriaId);
            Response::success($promos, 'Promociones vigentes.');
        }
    }
}