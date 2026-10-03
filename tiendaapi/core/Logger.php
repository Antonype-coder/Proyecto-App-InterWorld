<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/env.php';

if (!class_exists('Logger')) {
    class Logger
    {
        private static ?Monolog\Logger $instance = null;
        private static ?Monolog\Handler\StreamHandler $handler = null;

        private static function boot(): Monolog\Logger
        {
            if (self::$instance instanceof Monolog\Logger) {
                return self::$instance;
            }

            $logDir = dirname(__DIR__) . '/storage/logs';
            if (!is_dir($logDir)) {
                @mkdir($logDir, 0775, true);
            }

            $logger = new Monolog\Logger('tiendaadmin');
            self::$handler = new Monolog\Handler\StreamHandler(
                $logDir . '/app-' . date('Y-m-d') . '.log',
                Monolog\Logger::DEBUG
            );
            self::$handler->setFormatter(new Monolog\Formatter\LineFormatter(
                "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
                'Y-m-d H:i:s',
                true,
                true
            ));
            $logger->pushHandler(self::$handler);

            self::$instance = $logger;
            return $logger;
        }

        public static function debug(string $message, array $context = []): void
        {
            self::boot()->debug($message, $context);
        }

        public static function info(string $message, array $context = []): void
        {
            self::boot()->info($message, $context);
        }

        public static function warning(string $message, array $context = []): void
        {
            self::boot()->warning($message, $context);
        }

        public static function error(string $message, array $context = []): void
        {
            self::boot()->error($message, $context);
        }

        public static function critical(string $message, array $context = []): void
        {
            self::boot()->critical($message, $context);
        }
    }
}