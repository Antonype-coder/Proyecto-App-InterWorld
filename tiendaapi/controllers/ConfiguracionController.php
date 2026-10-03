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
                if (is_array($valor)) {
                    $valor = json_encode($valor, JSON_UNESCAPED_UNICODE);
                } elseif (is_bool($valor)) {
                    $valor = $valor ? '1' : '0';
                }
                $this->config->set($clave, $valor);
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
            $this->config->set('logo_url', $path, 'negocio');
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
            $this->config->set('logo_url', '', 'negocio');
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