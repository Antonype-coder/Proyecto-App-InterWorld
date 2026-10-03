<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../core/Exceptions/NotFoundException.php';
require_once __DIR__ . '/../core/Exceptions/ConflictException.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';

if (!class_exists('UsuarioController')) {
    class UsuarioController
    {
        private Usuario $usuarios;

        public function __construct()
        {
            $this->usuarios = new Usuario();
        }

        public function index(Request $request): void
        {
            $filtros = [];

            if ($request->getQuery('activo') !== null) {
                $filtros['activo'] = (int) $request->getQuery('activo');
            }
            if ($request->getQuery('rol') !== null) {
                $rol = (string) $request->getQuery('rol');
                if (in_array($rol, ['admin', 'vendedor'], true)) {
                    $filtros['rol'] = $rol;
                }
            }

            $usuarios = $this->usuarios->allSafe($filtros, 'id ASC');
            Response::success($usuarios, 'Usuarios obtenidos correctamente.');
        }

        public function show(Request $request): void
        {
            $id = (int) $request->param('id');
            $u = $this->usuarios->find($id);

            if ($u === null) {
                throw new NotFoundException('Usuario no encontrado.');
            }

            Response::success($this->usuarios->hidePassword($u), 'Usuario obtenido correctamente.');
        }

        public function store(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('nombre')->minLength('nombre', 3)->maxLength('nombre', 120)
              ->required('email')->email('email')
              ->required('password')->minLength('password', 6)
              ->required('rol')->in('rol', ['admin', 'vendedor']);

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $email = strtolower(trim((string) $data['email']));

            if ($this->usuarios->findByEmail($email) !== null) {
                throw new ConflictException('Ese correo ya está registrado.');
            }

            $id = $this->usuarios->create([
                'nombre'        => trim((string) $data['nombre']),
                'email'         => $email,
                'password_hash' => password_hash((string) $data['password'], PASSWORD_BCRYPT),
                'rol'           => (string) $data['rol'],
                'activo'        => isset($data['activo']) ? (int)(bool) $data['activo'] : 1,
            ]);

            $creado = $this->usuarios->find($id);
            Response::created($creado, 'Usuario creado correctamente.');
        }

        public function update(Request $request): void
        {
            $id = (int) $request->param('id');
            $u  = $this->usuarios->find($id);

            if ($u === null) {
                throw new NotFoundException('Usuario no encontrado.');
            }

            $data = $request->all();

            $v = new Validator($data);
            if (array_key_exists('nombre', $data)) {
                $v->minLength('nombre', 3)->maxLength('nombre', 120);
            }
            if (array_key_exists('email', $data) && $data['email'] !== '') {
                $v->email('email');
            }
            if (array_key_exists('rol', $data)) {
                $v->in('rol', ['admin', 'vendedor']);
            }
            if (array_key_exists('password', $data) && $data['password'] !== '') {
                $v->minLength('password', 6);
            }

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $campos = [];

            if (array_key_exists('nombre', $data)) {
                $campos['nombre'] = trim((string) $data['nombre']);
            }

            if (array_key_exists('email', $data)) {
                $email = strtolower(trim((string) $data['email']));
                $existente = $this->usuarios->findByEmail($email);

                if ($existente !== null && (int) $existente['id'] !== $id) {
                    throw new ConflictException('Ese correo ya está en uso.');
                }

                $campos['email'] = $email;
            }

            if (array_key_exists('password', $data) && (string) $data['password'] !== '') {
                $campos['password_hash'] = password_hash((string) $data['password'], PASSWORD_BCRYPT);
            }

            if (array_key_exists('rol', $data)) {
                $campos['rol'] = (string) $data['rol'];
            }

            if (array_key_exists('activo', $data)) {
                $campos['activo'] = (int)(bool) $data['activo'];
            }

            if ($campos === []) {
                throw new BusinessException('No enviaste campos para actualizar.');
            }

            $this->usuarios->update($id, $campos);

            Response::success(
                $this->usuarios->find($id),
                'Usuario actualizado correctamente.'
            );
        }

        public function destroy(Request $request): void
        {
            $id = (int) $request->param('id');
            $u  = $this->usuarios->find($id);

            if ($u === null) {
                throw new NotFoundException('Usuario no encontrado.');
            }

            if (Auth::id() === $id) {
                throw new BusinessException('No puedes desactivar tu propia cuenta.');
            }

            $this->usuarios->update($id, ['activo' => 0]);
            Response::success(null, 'Usuario desactivado correctamente.');
        }
    }
}