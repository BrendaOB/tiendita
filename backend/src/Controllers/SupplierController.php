<?php
namespace Src\Controllers;

use Src\Models\Supplier;

class SupplierController {
    private $supplierModel;

    public function __construct($db) {
        $this->supplierModel = new Supplier($db);
    }

    public function processRequest($method, $uri) {
        $parts = explode('/', trim($uri, '/'));
        $target = isset($parts[2]) ? $parts[2] : null;

        try {
            if ($method === 'GET' && !$target) {
                $this->getAll();
            } else if ($method === 'POST' && !$target) {
                $this->create();
            } else if ($method === 'PUT' && is_numeric($target)) {
                $this->update((int)$target);
            } else if ($method === 'DELETE' && is_numeric($target)) {
                $this->delete((int)$target);
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Ruta de proveedores desconocida."]);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error de servidor en Proveedores.", "debug" => $e->getMessage()]);
        }
    }

    private function getAll() {
        $suppliers = $this->supplierModel->fetchAll();
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $suppliers]);
    }

    private function create() {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->name)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Falta el nombre de empresa."]);
            return;
        }
        $this->supplierModel->create($data);
        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Proveedor registrado."]);
    }

    private function update($id) {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->name)) {
            http_response_code(400); return;
        }
        $this->supplierModel->update($id, $data);
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Proveedor modificado."]);
    }

    private function delete($id) {
        $this->supplierModel->delete($id);
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Proveedor eliminado."]);
    }
}
