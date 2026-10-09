<?php
declare(strict_types=1);

require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Jwt.php';
require_once __DIR__ . '/../core/Logger.php';
require_once __DIR__ . '/../core/Auth.php';
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

            $negocioId = (int) ($usuario['negocio_id'] ?? 0);
            if ($negocioId <= 0) {
                throw new UnauthorizedException('Usuario sin negocio asignado.');
            }

            $token = Jwt::encode([
                'sub'        => (int) $usuario['id'],
                'negocio_id' => $negocioId,
                'email'      => $usuario['email'],
                'nombre'     => $usuario['nombre'],
                'rol'        => $usuario['rol'],
            ]);

            Logger::info('Login exitoso', ['user_id' => $usuario['id']]);

            return [
                'token' => $token,
                'user'  => [
                    'id'         => (int) $usuario['id'],
                    'negocio_id' => $negocioId,
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
                // 1. Negocio
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

                // 2. Admin
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

                // 3. Configuración por defecto de ESTE negocio
                $this->crearConfiguracionDefault($negocioId, [
                    'nombre'   => $negocioNombre,
                    'nit'      => $nit,
                    'telefono' => $telefono,
                    'email'    => $email,
                ]);

                $this->db->commit();
            } catch (Throwable $e) {
                if ($this->db->inTransaction()) {
                    $this->db->rollBack();
                }
                throw $e;
            }

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

            $negocioId = Auth::negocioId();
            if ($negocioId === null) {
                throw new ForbiddenException('No se pudo determinar el negocio.');
            }

            $id = $this->usuarios->create([
                'negocio_id'    => $negocioId,
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

        public function changePassword(int $userId, string $passwordActual, string $passwordNueva): array
        {
            $stmt = $this->db->prepare(
                "SELECT id, password_hash FROM usuarios WHERE id = :id LIMIT 1"
            );
            $stmt->execute(['id' => $userId]);
            $usuario = $stmt->fetch();

            if ($usuario === false) {
                throw new UnauthorizedException('Usuario no encontrado.');
            }

            if (!password_verify($passwordActual, (string) $usuario['password_hash'])) {
                throw new BusinessException('La contraseña actual es incorrecta.');
            }

            if ($passwordActual === $passwordNueva) {
                throw new BusinessException('La nueva contraseña debe ser distinta a la actual.');
            }

            if (mb_strlen($passwordNueva) < 8) {
                throw new BusinessException('La nueva contraseña debe tener al menos 8 caracteres.');
            }

            $nuevoHash = password_hash($passwordNueva, PASSWORD_BCRYPT);

            $upd = $this->db->prepare(
                "UPDATE usuarios SET password_hash = :hash WHERE id = :id"
            );
            $upd->execute([
                'hash' => $nuevoHash,
                'id'   => $userId,
            ]);

            Logger::info('Contraseña cambiada', ['user_id' => $userId]);

            return ['changed' => true];
        }

        private function crearConfiguracionDefault(int $negocioId, array $negocio): void
        {
            $defaults = [
                ['negocio_nombre',            $negocio['nombre']   ?? 'Mi Tienda', 'string',  'negocio'],
                ['negocio_nit',               $negocio['nit']      ?? '',          'string',  'negocio'],
                ['negocio_direccion',         '',                                  'string',  'negocio'],
                ['negocio_telefono',          $negocio['telefono'] ?? '',          'string',  'negocio'],
                ['negocio_email',             $negocio['email']    ?? '',          'string',  'negocio'],
                ['moneda_simbolo',            '$',                                 'string',  'moneda'],
                ['moneda_codigo',             'COP',                               'string',  'moneda'],
                ['impuesto_porcentaje',       '0',                                 'decimal', 'impuestos'],
                ['impuesto_incluido',         '1',                                 'boolean', 'impuestos'],
                ['folio_prefijo_venta',       'V',                                 'string',  'folios'],
                ['folio_prefijo_devolucion',  'D',                                 'string',  'folios'],
                ['folio_prefijo_orden_compra','OC',                                'string',  'folios'],
                ['stock_alerta_habilitada',   '1',                                 'boolean', 'notificaciones'],
                ['notif_stock_bajo',          '1',                                 'boolean', 'notificaciones'],
                ['notif_ventas_dia',          '1',                                 'boolean', 'notificaciones'],
                ['notif_deudas_vencidas',     '1',                                 'boolean', 'notificaciones'],
                ['tema_modo',                 'light',                             'string',  'apariencia'],
                ['tema_color_primario',       '#111827',                           'string',  'apariencia'],
                ['caja_monto_apertura_defecto','0',                                'decimal', 'caja'],
            ];

            $stmt = $this->db->prepare(
                "INSERT INTO configuracion (negocio_id, clave, valor, tipo, grupo)
                 VALUES (:nid, :clave, :valor, :tipo, :grupo)"
            );

            foreach ($defaults as [$clave, $valor, $tipo, $grupo]) {
                try {
                    $stmt->execute([
                        'nid'   => $negocioId,
                        'clave' => $clave,
                        'valor' => (string) $valor,
                        'tipo'  => $tipo,
                        'grupo' => $grupo,
                    ]);
                } catch (Throwable $e) {
                    // Ignorar duplicados
                }
            }
        }
    }
}