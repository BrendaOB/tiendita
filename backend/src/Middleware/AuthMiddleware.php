<?php
namespace Src\Middleware;

use Src\Config\JwtHelper;

class AuthMiddleware {
    public static function authenticate() {
        // Obtener headers dependiendo del servidor
        $headers = apache_request_headers();
        $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

        // Fallback para otros servidores como Nginx o PHP server interno
        if (!$authHeader && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $token = $matches[1];
            $decoded = JwtHelper::decode($token);

            if ($decoded) {
                return $decoded; // Retorna el payload validado del usuario
            }
        }

        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Acceso no autorizado o token expirado. Requiere Bearer Token válido."]);
        exit;
    }
}
