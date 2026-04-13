<?php
namespace Src\Controllers;

use Src\Models\User;
use Src\Config\JwtHelper;

class AuthController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function login() {
        $data = json_decode(file_get_contents("php://input"));

        if (!isset($data->email) || !isset($data->password)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Email y password son requeridos."]);
            return;
        }

        try {
            $userModel = new User($this->db);
            $user = $userModel->findByEmail($data->email);

            if (!$user || !password_verify($data->password, $user['password_hash'])) {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Credenciales inválidas."]);
                return;
            }

            if (!$user['status']) {
                http_response_code(403);
                echo json_encode(["status" => "error", "message" => "Usuario bloqueado o inactivo."]);
                return;
            }

            // Payload para Frontend
            $tokenData = [
                "user_id" => $user['id'],
                "email" => $user['email'],
                "role" => $user['role'],
                "name" => $user['name']
            ];
            
            $token = JwtHelper::encode($tokenData);

            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "token" => $token,
                "user" => $tokenData
            ]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error interno en Auth.", "debug" => $e->getMessage()]);
        }
    }
}
