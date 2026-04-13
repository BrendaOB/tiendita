<?php
namespace Src\Controllers;

use PDO;
use PDOException;

class UserController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function processRequest($method, $uri, $user) {
        switch ($method) {
            case 'GET':
                $this->getUsers();
                break;
            case 'POST':
                $this->createUser();
                break;
            case 'PUT':
                $this->updateUser($user);
                break;
            case 'DELETE':
                $this->deleteUser($user);
                break;
            default:
                http_response_code(405);
                echo json_encode(["status" => "error", "message" => "Método no permitido."]);
                break;
        }
    }

    private function getUsers() {
        try {
            $stmt = $this->db->query("SELECT id, name, email, role, status FROM users ORDER BY created_at DESC");
            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(["status" => "success", "data" => $users]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error al obtener usuarios."]);
        }
    }

    private function createUser() {
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['name']) || empty($data['email']) || empty($data['password']) || empty($data['role'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Faltan campos obligatorios."]);
            return;
        }

        $hash = password_hash($data['password'], PASSWORD_BCRYPT);
        try {
            $stmt = $this->db->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (:name, :email, :password, :role)");
            $stmt->execute([
                ':name' => $data['name'],
                ':email' => $data['email'],
                ':password' => $hash,
                ':role' => $data['role']
            ]);
            echo json_encode(["status" => "success", "message" => "Usuario creado exitosamente", "id" => $this->db->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(409);
            echo json_encode(["status" => "error", "message" => "Error al crear: El correo podría estar en uso."]);
        }
    }

    private function updateUser($currentUser) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (empty($data['id'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Se requiere el ID del usuario."]);
            return;
        }

        // Evitar que el usuario admin actual se quite el rol de admin a sí mismo
        if ($data['id'] == $currentUser['id'] && isset($data['role']) && $data['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "No puedes quitarte el rol de admin a ti mismo."]);
            return;
        }

        $query = "UPDATE users SET name = :name, email = :email, role = :role";
        $params = [
            ':name' => $data['name'],
            ':email' => $data['email'],
            ':role' => $data['role'],
            ':id' => $data['id']
        ];

        if (!empty($data['password'])) {
            $query .= ", password_hash = :password";
            $params[':password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }
        $query .= " WHERE id = :id";

        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            echo json_encode(["status" => "success", "message" => "Usuario actualizado."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error al actualizar."]);
        }
    }

    private function deleteUser($currentUser) {
        $id_to_delete = $_GET['id'] ?? null;
        if (!$id_to_delete) {
            $data = json_decode(file_get_contents("php://input"), true);
            $id_to_delete = $data['id'] ?? null;
        }

        if (!$id_to_delete) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "ID no proporcionado."]);
            return;
        }

        if ($id_to_delete == $currentUser['id']) {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "No puedes eliminar tu propia cuenta."]);
            return;
        }

        try {
            $stmt = $this->db->prepare("DELETE FROM users WHERE id = :id");
            $stmt->execute([':id' => $id_to_delete]);
            echo json_encode(["status" => "success", "message" => "Usuario eliminado."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "No se pudo eliminar el usuario."]);
        }
    }
}
