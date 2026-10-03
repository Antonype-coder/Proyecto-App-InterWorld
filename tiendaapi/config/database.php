<?php
declare(strict_types=1);

require_once __DIR__ . '/env.php';

if (!class_exists('Database')) {
    class Database
    {
        private static ?PDO $instance = null;

        public static function getConnection(): PDO
        {
            if (self::$instance instanceof PDO) {
                return self::$instance;
            }

            $host    = getenv('DB_HOST') ?: '127.0.0.1';
            $port    = getenv('DB_PORT') ?: '3306';
            $name    = getenv('DB_NAME') ?: 'tienda_db';
            $user    = getenv('DB_USER') ?: 'root';
            $pass    = getenv('DB_PASS') ?: '';
            $charset = getenv('DB_CHARSET') ?: 'utf8mb4';

            $dsn = "mysql:host={$host};port={$port};dbname={$name};charset={$charset}";

            try {
                self::$instance = new PDO($dsn, $user, $pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                    PDO::ATTR_STRINGIFY_FETCHES  => false,
                    PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES {$charset} COLLATE {$charset}_unicode_ci",
                ]);
            } catch (PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
                echo json_encode([
                    'success' => false,
                    'data'    => null,
                    'message' => 'Error de conexión a la base de datos.',
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            return self::$instance;
        }

        public static function reset(): void
        {
            self::$instance = null;
        }
    }
}