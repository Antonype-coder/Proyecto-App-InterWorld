<?php
declare(strict_types=1);

require_once __DIR__ . '/../core/Request.php';
require_once __DIR__ . '/../core/Response.php';
require_once __DIR__ . '/../models/Configuracion.php';
require_once __DIR__ . '/../utils/Upload.php';

if (!class_exists('ConfiguracionController')) {
    class ConfiguracionController
    {
        private Configuracion $config;

        // Mapa de prefijo → grupo de la tabla `configuracion`
        private const GRUPO_POR_PREFIJO = [
            'negocio_'      => 'negocio',
            'impuesto_'     => 'impuestos',
            'moneda_'       => 'moneda',
            'notif_'        => 'notificaciones',
            'stock_alerta_' => 'notificaciones',
            'folio_'        => 'folios',
            'tema_'         => 'apariencia',
            'caja_'         => 'caja',
        ];

        public function __construct()
        {
            $this->config = new Configuracion();
        }

        public function index(Request $request): void
        {
            Response::success($this->config->allByGroup(), 'Configuración obtenida.');
        }

        public function update(Request $request): void
        {
            $data = $request->all();
            if (!is_array($data) || empty($data)) {
                Response::badRequest('No enviaste configuración.');
            }

            foreach ($data as $clave => $valor) {
                if (!is_string($clave) || $clave === '') continue;

                // 1. Detectar grupo por prefijo
                $grupo = 'general';
                foreach (self::GRUPO_POR_PREFIJO as $prefijo => $g) {
                    if (str_starts_with($clave, $prefijo)) {
                        $grupo = $g;
                        break;
                    }
                }

                // 2. Detectar tipo y normalizar valor
                $tipo = 'string';

                if (is_bool($valor)) {
                    $tipo = 'boolean';
                    $valor = $valor ? '1' : '0';
                } elseif (is_int($valor)) {
                    $tipo = 'integer';
                } elseif (is_float($valor)) {
                    $tipo = 'decimal';
                } elseif (is_array($valor)) {
                    $tipo = 'json';
                    $valor = json_encode($valor, JSON_UNESCAPED_UNICODE);
                } elseif (is_string($valor)) {
                    // Si viene '0'/'1' desde el frontend, marcamos como boolean
                    if (in_array($clave, ['impuesto_incluido', 'stock_alerta_habilitada', 'notif_stock_bajo', 'notif_ventas_dia', 'notif_deudas_vencidas'], true)) {
                        $tipo = 'boolean';
                    }
                }

                $this->config->set($clave, $valor, $tipo, $grupo);
            }

            Response::success($this->config->allByGroup(), 'Configuración actualizada.');
        }

        public function updateLogo(Request $request): void
        {
            $data = $request->all();
            $path = $data['logo_url'] ?? null;
            if (!is_string($path) || !$this->esLogoValido($path)) {
                Response::badRequest('La ruta del logo no es válida.');
            }

            $previous = $this->config->get('logo_url');
            $this->config->set('logo_url', $path, 'string', 'negocio');

            if (
                is_string($previous)
                && $previous !== ''
                && $previous !== $path
                && $this->esLogoValido($previous)
            ) {
                Upload::delete($previous);
            }

            Response::success($this->config->allByGroup(), 'Logo actualizado.');
        }

        public function deleteLogo(Request $request): void
        {
            $previous = $this->config->get('logo_url');
            $this->config->set('logo_url', '', 'string', 'negocio');

            if (is_string($previous) && $previous !== '' && $this->esLogoValido($previous)) {
                Upload::delete($previous);
            }

            Response::success($this->config->allByGroup(), 'Logo eliminado.');
        }

        private function esLogoValido(string $path): bool
        {
            if (!preg_match('#\Astorage/uploads/logo/[0-9]{14}_[a-f0-9]{12}\.(?:jpe?g|png|webp)\z#i', $path)) {
                return false;
            }

            $logoDirectory = realpath(dirname(__DIR__) . '/storage/uploads/logo');
            $logoPath = realpath(dirname(__DIR__) . '/' . $path);

            return $logoDirectory !== false
                && $logoPath !== false
                && is_file($logoPath)
                && str_starts_with($logoPath, $logoDirectory . DIRECTORY_SEPARATOR);
        }
    }
}