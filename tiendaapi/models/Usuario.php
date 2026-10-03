<?php
declare(strict_types=1);

require_once __DIR__ . '/BaseModel.php';

if (!class_exists('Usuario')) {
    class Usuario extends BaseModel
    {
        protected string $table = 'usuarios';
        protected string $primaryKey = 'id';
        protected array $fillable = ['nombre', 'email', 'password_hash', 'rol', 'activo'];
        protected array $hidden = ['password_hash'];

        public function findByEmail(string $email): ?array
        {
            return $this->rawFirst(
                "SELECT * FROM {$this->table} WHERE email = :email LIMIT 1",
                ['email' => $email]
            );
        }

        public function verifyPassword(array $usuario, string $plain): bool
        {
            $hash = $usuario['password_hash'] ?? null;
            if (!is_string($hash) || $hash === '') {
                return false;
            }
            return password_verify($plain, $hash);
        }

        public function setPassword(int $id, string $plain): bool
        {
            $hash = password_hash($plain, PASSWORD_BCRYPT);
            return $this->update($id, ['password_hash' => $hash]);
        }

        public function registroLogin(int $id): void
        {
            $this->db->prepare(
                "UPDATE {$this->table} SET ultimo_login = NOW(), intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = :id"
            )->execute(['id' => $id]);
        }

        public function registrarIntentoFallido(int $id): void
        {
            $this->db->prepare(
                "UPDATE {$this->table} SET intentos_fallidos = intentos_fallidos + 1 WHERE id = :id"
            )->execute(['id' => $id]);
        }

        public function allSafe(array $conditions = [], string $orderBy = 'id ASC'): array
        {
            return $this->all($conditions, $orderBy);
        }

        public function hidePassword(array $row): array
        {
            unset($row['password_hash']);
            return $row;
        }
    }
}