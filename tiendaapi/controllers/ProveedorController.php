<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../models/Proveedor.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../utils/Helpers.php';

if (!class_exists('ProveedorController')) {
    class ProveedorController
    {
        private Proveedor $proveedores;

        public function __construct()
        {
            $this->proveedores = new Proveedor();
        }

        public function index(Request $request): void
        {
            $filtros = [];
            if ($request->getQuery('activo') !== null) {
                $filtros['activo'] = (int) $request->getQuery('activo');
            }

            $provs = $this->proveedores->all($filtros, 'nombre ASC');
            Response::success($provs, 'Proveedores obtenidos correctamente.');
        }

        public function show(Request $request): void
        {
            $id = (int) $request->param('id');
            $p  = $this->proveedores->find($id);

            if ($p === null) {
                throw new NotFoundException('Proveedor no encontrado.');
            }

            Response::success($p, 'Proveedor obtenido correctamente.');
        }

        public function store(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('nombre')->minLength('nombre', 2)->maxLength('nombre', 150);
            if (array_key_exists('email', $data) && $data['email'] !== '') {
                $v->email('email');
            }
            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $id = $this->proveedores->create([
                'nombre'    => tienda_sanitize_string((string) $data['nombre']),
                'contacto'  => isset($data['contacto']) ? tienda_sanitize_string((string) $data['contacto']) : null,
                'telefono'  => isset($data['telefono']) ? tienda_sanitize_string((string) $data['telefono']) : null,
                'email'     => isset($data['email']) && $data['email'] !== '' ? strtolower(trim((string) $data['email'])) : null,
                'direccion' => isset($data['direccion']) ? tienda_sanitize_string((string) $data['direccion']) : null,
                'notas'     => isset($data['notas']) ? tienda_sanitize_string((string) $data['notas']) : null,
                'activo'    => isset($data['activo']) ? (int)(bool) $data['activo'] : 1,
            ]);

            Response::created($this->proveedores->find($id), 'Proveedor creado correctamente.');
        }

        public function update(Request $request): void
        {
            $id = (int) $request->param('id');

            if ($this->proveedores->find($id) === null) {
                throw new NotFoundException('Proveedor no encontrado.');
            }

            $data = $request->all();
            $v = new Validator($data);
            if (array_key_exists('nombre', $data)) {
                $v->minLength('nombre', 2)->maxLength('nombre', 150);
            }
            if (array_key_exists('email', $data) && $data['email'] !== '') {
                $v->email('email');
            }
            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $campos = [];
            foreach (['nombre', 'contacto', 'telefono', 'email', 'direccion', 'notas'] as $c) {
                if (array_key_exists($c, $data)) {
                    $campos[$c] = tienda_sanitize_string((string) $data[$c]);
                }
            }
            if (array_key_exists('activo', $data)) {
                $campos['activo'] = (int)(bool) $data['activo'];
            }

            if ($campos === []) {
                throw new BusinessException('No enviaste campos para actualizar.');
            }

            $this->proveedores->update($id, $campos);
            Response::success($this->proveedores->find($id), 'Proveedor actualizado correctamente.');
        }

        public function destroy(Request $request): void
        {
            $id = (int) $request->param('id');

            if ($this->proveedores->find($id) === null) {
                throw new NotFoundException('Proveedor no encontrado.');
            }

            $this->proveedores->update($id, ['activo' => 0]);
            Response::success(null, 'Proveedor desactivado correctamente.');
        }
    }
}