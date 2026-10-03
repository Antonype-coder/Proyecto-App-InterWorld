<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../core/Validator.php';
require_once __DIR__ . '/../core/Auth.php';
require_once __DIR__ . '/../core/Exceptions/ValidationException.php';
require_once __DIR__ . '/../services/AuthService.php';

if (!class_exists('AuthController')) {
    class AuthController
    {
        private AuthService $service;

        public function __construct()
        {
            $this->service = new AuthService();
        }

        public function login(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('email', 'El correo es obligatorio.')
              ->email('email')
              ->required('password', 'La contraseña es obligatoria.');

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $result = $this->service->login(
                (string) $data['email'],
                (string) $data['password']
            );

            Response::success($result, 'Sesión iniciada correctamente.');
        }

        public function registrarNegocio(Request $request): void
        {
            $data = $request->all();

            $v = new Validator($data);
            $v->required('negocio_nombre')->minLength('negocio_nombre', 2)->maxLength('negocio_nombre', 150)
              ->required('nombre')->minLength('nombre', 3)->maxLength('nombre', 120)
              ->required('email')->email('email')
              ->required('password')->minLength('password', 6);

            if ($v->fails()) {
                Response::validationError($v->errors());
            }

            $result = $this->service->registrarNegocio($data);

            Response::created($result, 'Negocio creado correctamente.');
        }

        public function register(Request $request): void
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

            $usuario = $this->service->register($data, Auth::id() ?? 0);

            Response::created($usuario, 'Usuario creado correctamente.');
        }

        public function me(Request $request): void
        {
            $id = Auth::id();
            if ($id === null) {
                Response::unauthorized('No autenticado.');
            }

            $usuario = $this->service->me($id);
            Response::success($usuario, 'Usuario obtenido correctamente.');
        }

        public function logout(Request $request): void
        {
            Response::success(null, 'Sesión cerrada correctamente.');
        }
    }
}