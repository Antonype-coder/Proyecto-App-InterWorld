<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../models/Categoria.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';
require_once __DIR__ . '/../core/Exceptions/ConflictException.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';
require_once __DIR__ . '/../utils/Helpers.php';

if (!class_exists('CategoriaController')) {
    class CategoriaController
    {
        private Categoria $categorias;

        public function __construct()
        {
            $this->categorias = new Categoria();
        }

        public function index(Request $request): void
        {
            $filtros = [];
            if ($request->getQuery('activo') !== null) {
                $filtros['activo'] = (int) $request->getQuery('activo');
            }

            $categorias = $this->categorias->all($filtros, 'nombre ASC');
            Response::success($categorias, 'Categorías obtenidas correctamente.');
        }

        public function show(Request $request): void
        {
            $id  = (int) $request->param('id');
            $cat = $this->categorias->find($id);

            if ($cat === null) {
                throw new NotFoundException('Categoría no encontrada.');
            }

            Response::success($cat, 'Categoría obtenida correctamente.');
        }

        public function store(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('nombre')->minLength('nombre', 2)->maxLength('nombre', 100);
            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $nombre = tienda_sanitize_string((string) $data['nombre']);

            if ($this->categorias->findBy(['nombre' => $nombre]) !== null) {
                throw new ConflictException('Ya existe una categoría con ese nombre.');
            }

            $id = $this->categorias->create([
                'nombre'      => $nombre,
                'descripcion' => isset($data['descripcion'])
                    ? tienda_sanitize_string((string) $data['descripcion'])
                    : null,
                'activo' => isset($data['activo']) ? (int)(bool) $data['activo'] : 1,
            ]);

            Response::created($this->categorias->find($id), 'Categoría creada correctamente.');
        }

        public function update(Request $request): void
        {
            $id = (int) $request->param('id');

            if ($this->categorias->find($id) === null) {
                throw new NotFoundException('Categoría no encontrada.');
            }

            $data = $request->all();
            $v = new Validator($data);
            if (array_key_exists('nombre', $data)) {
                $v->minLength('nombre', 2)->maxLength('nombre', 100);
            }
            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $campos = [];

            if (array_key_exists('nombre', $data)) {
                $nombre = tienda_sanitize_string((string) $data['nombre']);
                $existente = $this->categorias->findBy(['nombre' => $nombre]);

                if ($existente !== null && (int) $existente['id'] !== $id) {
                    throw new ConflictException('Ya existe otra categoría con ese nombre.');
                }
                $campos['nombre'] = $nombre;
            }

            if (array_key_exists('descripcion', $data)) {
                $campos['descripcion'] = tienda_sanitize_string((string) $data['descripcion']);
            }

            if (array_key_exists('activo', $data)) {
                $campos['activo'] = (int)(bool) $data['activo'];
            }

            if ($campos === []) {
                throw new BusinessException('No enviaste campos para actualizar.');
            }

            $this->categorias->update($id, $campos);
            Response::success($this->categorias->find($id), 'Categoría actualizada correctamente.');
        }

        public function destroy(Request $request): void
        {
            $id = (int) $request->param('id');

            if ($this->categorias->find($id) === null) {
                throw new NotFoundException('Categoría no encontrada.');
            }

            $this->categorias->update($id, ['activo' => 0]);
            Response::success(null, 'Categoría desactivada correctamente.');
        }
    }
}