<?php
namespace Src\Controllers;

use Src\Models\Category;

class CategoryController {
    private $categoryModel;

    public function __construct($db) {
        $this->categoryModel = new Category($db);
    }

    public function processRequest($method, $uri) {
        // Enrutamiento RESTful (/api/categories/1)
        $parts = explode('/', trim($uri, '/'));
        $id = isset($parts[2]) ? (int)$parts[2] : null;

        try {
            switch ($method) {
                case 'GET':
                    $this->getAll();
                    break;
                case 'POST':
                    $this->create();
                    break;
                case 'PUT':
                    if ($id) $this->update($id);
                    else $this->badRequest();
                    break;
                case 'DELETE':
                    if ($id) $this->delete($id);
                    else $this->badRequest();
                    break;
                default:
                    http_response_code(405);
                    echo json_encode(["status" => "error", "message" => "Método no permitido"]);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error de BD en Category", "debug" => $e->getMessage()]);
        }
    }

    private function getAll() {
        $result = $this->categoryModel->fetchAll();
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $result]);
    }

    private function create() {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->name)) {
            $this->badRequest(); return;
        }
        $this->categoryModel->create($data->name, $data->description ?? '');
        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Categoría creada correctamente"]);
    }

    private function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->name)) {
            $this->badRequest(); return;
        }
        $this->categoryModel->update($id, $data->name, $data->description ?? '');
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Categoría actualizada correctamente"]);
    }

    private function delete($id) {
        $this->categoryModel->delete($id);
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Categoría eliminada correctamente"]);
    }

    private function badRequest() {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Petición inválida. Faltan datos obligatorios."]);
    }
}
