<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../services/VentaService.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';

if (!class_exists('VentaController')) {
    class VentaController
    {
        private VentaService $service;

        public function __construct()
        {
            $this->service = new VentaService();
        }

        public function store(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('tipo_pago')->in('tipo_pago', ['contado', 'credito'])
              ->required('items')->arrayField('items');

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            if (empty($data['items']) || !is_array($data['items'])) {
                throw new BusinessException('La venta debe tener al menos un producto.');
            }

            if (array_key_exists('idempotency_key', $data)) {
                $key = $data['idempotency_key'];
                if (
                    !is_string($key)
                    || !preg_match('/\A[A-Za-z0-9_-]{16,64}\z/', $key)
                ) {
                    throw new BusinessException('La clave de venta no es válida.');
                }
            }

            $usuarioId = Auth::id();
            if ($usuarioId === null) {
                Response::unauthorized('No autenticado.');
            }

            $venta = $this->service->crear($data, $usuarioId);
            Response::created($venta, 'Venta registrada correctamente.');
        }

        public function index(Request $request): void
        {
            $filtros = [
                'estado'     => $request->getQuery('estado'),
                'tipo_pago'  => $request->getQuery('tipo_pago'),
                'cliente_id' => $request->getQuery('cliente_id'),
                'desde'      => $request->getQuery('desde'),
                'hasta'      => $request->getQuery('hasta'),
                'busqueda'   => (string) $request->getQuery('busqueda', ''),
            ];

            $limit  = (int) $request->getQuery('limit', 50);
            $offset = (int) $request->getQuery('offset', 0);
            if ($limit <= 0 || $limit > 200) $limit = 50;
            if ($offset < 0) $offset = 0;

            $result = $this->service->listar($filtros, $limit, $offset);

            Response::paginated($result['items'], $result['total'], $limit, $offset, 'Ventas obtenidas correctamente.');
        }

        public function show(Request $request): void
        {
            $id    = (int) $request->param('id');
            $venta = $this->service->obtener($id);

            Response::success($venta, 'Venta obtenida correctamente.');
        }

        public function anular(Request $request): void
        {
            $id = (int) $request->param('id');

            $data = $request->all();
            $v = new Validator($data);
            $v->required('motivo')->minLength('motivo', 3)->maxLength('motivo', 255);

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $usuarioId = Auth::id();
            if ($usuarioId === null) {
                Response::unauthorized('No autenticado.');
            }

            $venta = $this->service->anular(
                $id,
                $usuarioId,
                (string) $data['motivo']
            );

            Response::success($venta, 'Venta anulada correctamente.');
        }
    }
}