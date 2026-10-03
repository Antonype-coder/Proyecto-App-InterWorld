<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Jwt.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Exceptions/UnauthorizedException.php';
require_once __DIR__ . '/../core/Exceptions/ForbiddenException.php';
require_once __DIR__ . '/../core/Exceptions/ConflictException.php';
require_once __DIR__ . '/../core/Exceptions/BusinessException.php';

if (!class_exists('AuthService')) {
    class AuthService
    {
        private Usuario $usuarios;
        private PDO $db;

        public function __construct()
        {
            $this->usuarios = new Usuario();
            $this->db = Database::getConnection();
        }

        public function login(string $email, string $password): array
        {
            $email = strtolower(trim($email));
            $usuario = $this->usuarios->findByEmail($email);

            if ($usuario === null) {
                throw new UnauthorizedException('Credenciales inválidas.');
            }
            if ((int) $usuario['activo'] !== 1) {
                throw new ForbiddenException('La cuenta está desactivada.');
            }
            if (!$this->usuarios->verifyPassword($usuario, $password)) {
                $this->usuarios->registrarIntentoFallido((int) $usuario['id']);
                throw new UnauthorizedException('Credenciales inválidas.');
            }

            $this->usuarios->registroLogin((int) $usuario['id']);

            $token = Jwt::encode([
                'sub'        => (int) $usuario['id'],
                'negocio_id' => (int) ($usuario['negocio_id'] ?? 1),
                'email'      => $usuario['email'],
                'nombre'     => $usuario['nombre'],
                'rol'        => $usuario['rol'],
            ]);

            Logger::info('Login exitoso', ['user_id' => $usuario['id']]);

            return [
                'token' => $token,
                'user'  => [
                    'id'         => (int) $usuario['id'],
                    'negocio_id' => (int) ($usuario['negocio_id'] ?? 1),
                    'nombre'     => $usuario['nombre'],
                    'email'      => $usuario['email'],
                    'rol'        => $usuario['rol'],
                ],
            ];
        }

        public function registrarNegocio(array $data): array
        {
            $negocioNombre = trim((string)($data['negocio_nombre'] ?? ''));
            $nit           = trim((string)($data['nit'] ?? ''));
            $telefono      = trim((string)($data['telefono'] ?? ''));
            $nombre        = trim((string)($data['nombre'] ?? ''));
            $email         = strtolower(trim((string)($data['email'] ?? '')));
            $password      = (string)($data['password'] ?? '');

            if ($negocioNombre === '' || $nombre === '' || $email === '' || $password === '') {
                throw new BusinessException('Todos los campos obligatorios deben estar llenos.');
            }
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new BusinessException('El correo no es válido.');
            }
            if (mb_strlen($password) < 6) {
                throw new BusinessException('La contraseña debe tener al menos 6 caracteres.');
            }
            if ($this->usuarios->findByEmail($email) !== null) {
                throw new ConflictException('Ese correo ya está registrado.');
            }

            $this->db->beginTransaction();
            try {
                // 1. Crear el negocio
                $stmt = $this->db->prepare(
                    "INSERT INTO negocios (nombre, nit, telefono, email, plan, activo)
                     VALUES (:n, :nit, :tel, :email, 'free', 1)"
                );
                $stmt->execute([
                    'n'     => $negocioNombre,
                    'nit'   => $nit ?: null,
                    'tel'   => $telefono ?: null,
                    'email' => $email,
                ]);
                $negocioId = (int)$this->db->lastInsertId();

                // 2. Crear admin
                $stmt = $this->db->prepare(
                    "INSERT INTO usuarios (negocio_id, nombre, email, password_hash, rol, activo)
                     VALUES (:nid, :nom, :email, :pass, 'admin', 1)"
                );
                $stmt->execute([
                    'nid'   => $negocioId,
                    'nom'   => $nombre,
                    'email' => $email,
                    'pass'  => password_hash($password, PASSWORD_BCRYPT),
                ]);
                $userId = (int)$this->db->lastInsertId();

                $this->db->commit();
            } catch (Throwable $e) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                throw $e;
            }

            // 3. Generar token
            $token = Jwt::encode([
                'sub'        => $userId,
                'negocio_id' => $negocioId,
                'email'      => $email,
                'nombre'     => $nombre,
                'rol'        => 'admin',
            ]);

            Logger::info('Negocio registrado', [
                'negocio_id' => $negocioId,
                'user_id'    => $userId,
            ]);

            return [
                'token' => $token,
                'user'  => [
                    'id'         => $userId,
                    'negocio_id' => $negocioId,
                    'nombre'     => $nombre,
                    'email'      => $email,
                    'rol'        => 'admin',
                ],
            ];
        }

        public function register(array $data, int $actorId): array
        {
            $email = strtolower(trim($data['email']));

            if ($this->usuarios->findByEmail($email) !== null) {
                throw new ConflictException('Ya existe un usuario con ese correo.');
            }

            $id = $this->usuarios->create([
                'nombre'        => trim($data['nombre']),
                'email'         => $email,
                'password_hash' => password_hash($data['password'], PASSWORD_BCRYPT),
                'rol'           => $data['rol'],
                'activo'        => 1,
            ]);

            Logger::info('Usuario creado', ['id' => $id, 'por' => $actorId]);

            return $this->usuarios->find($id) ?? [];
        }

        public function me(int $userId): array
        {
            $usuario = $this->usuarios->find($userId);
            if ($usuario === null) {
                throw new UnauthorizedException('Usuario no encontrado.');
            }
            return $usuario;
        }
    }
}