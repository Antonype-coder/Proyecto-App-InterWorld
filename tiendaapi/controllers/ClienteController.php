<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../models/Cliente.php';
require_once __DIR__ . '/../services/CreditoService.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';
require_once __DIR__ . '/../core/Exceptions/ConflictException.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../utils/Helpers.php';
require_once __DIR__ . '/../utils/Money.php';

if (!class_exists('ClienteController')) {
    class ClienteController
    {
        private Cliente $clientes;
        private CreditoService $creditoService;

        public function __construct()
        {
            $this->clientes       = new Cliente();
            $this->creditoService = new CreditoService();
        }

        public function index(Request $request): void
        {
            $filtros = [];
            if ($request->getQuery('activo') !== null) {
                $filtros['activo'] = (int) $request->getQuery('activo');
            }

            $clientes = $this->clientes->all($filtros, 'nombre ASC');

            $busqueda = trim((string) $request->getQuery('busqueda', ''));
            if ($busqueda !== '') {
                $q = mb_strtolower($busqueda);
                $clientes = array_values(array_filter($clientes, function (array $c) use ($q): bool {
                    $nombre = mb_strtolower((string) ($c['nombre'] ?? ''));
                    $doc    = mb_strtolower((string) ($c['documento'] ?? ''));
                    return str_contains($nombre, $q) || str_contains($doc, $q);
                }));
            }

            Response::success($clientes, 'Clientes obtenidos correctamente.');
        }

        public function show(Request $request): void
        {
            $id = (int) $request->param('id');
            $c  = $this->clientes->find($id);

            if ($c === null) {
                throw new NotFoundException('Cliente no encontrado.');
            }

            Response::success($c, 'Cliente obtenido correctamente.');
        }

        public function store(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('nombre')->minLength('nombre', 2)->maxLength('nombre', 150);

            if (array_key_exists('email', $data) && $data['email'] !== '') {
                $v->email('email');
            }
            if (array_key_exists('cupo_credito', $data)) {
                $v->numeric('cupo_credito')->min('cupo_credito', 0);
            }

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $documento = isset($data['documento']) && $data['documento'] !== ''
                ? tienda_sanitize_string((string) $data['documento'])
                : null;

            if ($documento !== null && $this->clientes->documentoExists($documento)) {
                throw new ConflictException('Ese documento ya está registrado.');
            }

            $id = $this->clientes->create([
                'nombre'       => tienda_sanitize_string((string) $data['nombre']),
                'documento'    => $documento,
                'telefono'     => isset($data['telefono']) ? tienda_sanitize_string((string) $data['telefono']) : null,
                'email'        => isset($data['email']) && $data['email'] !== '' ? strtolower(trim((string) $data['email'])) : null,
                'direccion'    => isset($data['direccion']) ? tienda_sanitize_string((string) $data['direccion']) : null,
                'cupo_credito' => isset($data['cupo_credito']) ? Money::toDb($data['cupo_credito']) : '0.00',
                'saldo_deuda'  => '0.00',
                'notas'        => isset($data['notas']) ? tienda_sanitize_string((string) $data['notas']) : null,
                'activo'       => isset($data['activo']) ? (int)(bool) $data['activo'] : 1,
            ]);

            Response::created($this->clientes->find($id), 'Cliente creado correctamente.');
        }

        public function update(Request $request): void
        {
            $id = (int) $request->param('id');

            if ($this->clientes->find($id) === null) {
                throw new NotFoundException('Cliente no encontrado.');
            }

            $data = $request->all();
            $v = new Validator($data);
            if (array_key_exists('nombre', $data)) {
                $v->minLength('nombre', 2)->maxLength('nombre', 150);
            }
            if (array_key_exists('email', $data) && $data['email'] !== '') {
                $v->email('email');
            }
            if (array_key_exists('cupo_credito', $data)) {
                $v->numeric('cupo_credito')->min('cupo_credito', 0);
            }
            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $campos = [];
            foreach (['nombre', 'telefono', 'email', 'direccion', 'notas'] as $c) {
                if (array_key_exists($c, $data)) {
                    $campos[$c] = tienda_sanitize_string((string) $data[$c]);
                }
            }

            if (array_key_exists('documento', $data)) {
                $doc = $data['documento'] !== '' ? tienda_sanitize_string((string) $data['documento']) : null;
                if ($doc !== null && $this->clientes->documentoExists($doc, $id)) {
                    throw new ConflictException('Ese documento ya lo usa otro cliente.');
                }
                $campos['documento'] = $doc;
            }

            if (array_key_exists('cupo_credito', $data)) {
                $campos['cupo_credito'] = Money::toDb($data['cupo_credito']);
            }
            if (array_key_exists('activo', $data)) {
                $campos['activo'] = (int)(bool) $data['activo'];
            }

            if ($campos === []) {
                throw new BusinessException('No enviaste campos para actualizar.');
            }

            $this->clientes->update($id, $campos);
            Response::success($this->clientes->find($id), 'Cliente actualizado correctamente.');
        }

        public function destroy(Request $request): void
        {
            $id = (int) $request->param('id');

            if ($this->clientes->find($id) === null) {
                throw new NotFoundException('Cliente no encontrado.');
            }

            $this->clientes->update($id, ['activo' => 0]);
            Response::success(null, 'Cliente desactivado correctamente.');
        }

        public function estadoCuenta(Request $request): void
        {
            $id = (int) $request->param('id');
            $estado = $this->creditoService->estadoCuenta($id);
            Response::success($estado, 'Estado de cuenta obtenido correctamente.');
        }

        public function registrarPago(Request $request): void
        {
            $id = (int) $request->param('id');

            $data = $request->all();
            $v = new Validator($data);
            $v->required('monto')->numeric('monto')->min('monto', 0.01)
              ->required('metodo_pago')->in('metodo_pago', ['efectivo', 'transferencia', 'tarjeta']);

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $usuarioId = Auth::id();
            if ($usuarioId === null) {
                Response::unauthorized('No autenticado.');
            }

            $result = $this->creditoService->registrarPago($id, $usuarioId, $data);

            Response::created($result, 'Pago registrado correctamente.');
        }
    }
}