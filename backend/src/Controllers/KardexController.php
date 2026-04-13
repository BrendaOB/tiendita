<?php
namespace Src\Controllers;

use Src\Models\Kardex;

class KardexController {
    private $kardexModel;

    public function __construct($db) {
        $this->kardexModel = new Kardex($db);
    }

    public function processRequest($method, $uri) {
        $parts = explode('/', trim($uri, '/'));
        
        try {
            if ($method === 'GET') {
                $productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : null;
                $this->getAll($productId);
            } else {
                http_response_code(405);
                echo json_encode(["status" => "error", "message" => "Método no soportado en Kardex. El Kardex es de Sólo Lectura API."]);
            }
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error de servidor en Kardex.", "debug" => $e->getMessage()]);
        }
    }

    private function getAll($productId) {
        $entries = $this->kardexModel->fetchAll($productId);
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $entries]);
    }
}
