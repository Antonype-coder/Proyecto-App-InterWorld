<?php
declare(strict_types=1);

if (!class_exists('Money')) {
    class Money
    {
        public static function toDb(mixed $value): string
        {
            return number_format((float) $value, 2, '.', '');
        }

        public static function toFloat(mixed $value): float
        {
            return round((float) $value, 2);
        }

        public static function add(mixed $a, mixed $b): float
        {
            return round((float) $a + (float) $b, 2);
        }

        public static function sub(mixed $a, mixed $b): float
        {
            return round((float) $a - (float) $b, 2);
        }

        public static function mul(mixed $a, mixed $b): float
        {
            return round((float) $a * (float) $b, 2);
        }

        public static function equals(mixed $a, mixed $b): bool
        {
            return abs((float) $a - (float) $b) < 0.001;
        }

        public static function format(mixed $value, string $symbol = '$'): string
        {
            return $symbol . number_format((float) $value, 2, ',', '.');
        }
    }
}