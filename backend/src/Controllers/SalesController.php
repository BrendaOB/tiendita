<?php
namespace Src\Controllers;

use Src\Models\Sale;

class SalesController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function processRequest($method, $uri, $user_payload) {
        $parts = explode('/', trim($uri, '/'));
        $resourceId = isset($parts[2]) ? $parts[2] : null;
        $subResource = isset($parts[3]) ? $parts[3] : null;

        if ($method === 'POST' && !$resourceId) {
            $this->registerSale($user_payload);
        } else if ($method === 'GET' && !$resourceId) {
            $this->getSalesHistory($user_payload);
        } else if ($method === 'GET' && is_numeric($resourceId) && $subResource === 'details') {
            $this->getSaleDetails((int)$resourceId);
        } else {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Ruta de Ventas desconocida."]);
        }
    }

    public function getSalesHistory($user_payload) {
        if ($user_payload['role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Acceso al historial remoto de ventas prohibido para Cajeros."]);
            return;
        }

        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        $dateFilter = isset($_GET['date_filter']) ? $_GET['date_filter'] : 'today';

        try {
            $saleModel = new Sale($this->db);
            $result = $saleModel->fetchSales($limit, $offset, $dateFilter);
            
            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $result['data'], "total" => $result['total'], "totalsByMethod" => $result['totalsByMethod']]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Fallo SQL: " . $e->getMessage()]);
        }
    }

    public function getSaleDetails($sale_id) {
        try {
            $saleModel = new Sale($this->db);
            $details = $saleModel->fetchSaleDetails($sale_id);
            http_response_code(200);
            echo json_encode(["status" => "success", "data" => $details]);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error detallando recibo: " . $e->getMessage()]);
        }
    }

    private function registerSale($user_payload) {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->total) || empty($data->payments) || empty($data->details)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "El payload de venta está incompleto (faltan detalles o pagos)."]);
            return;
        }

        try {
            $saleModel = new Sale($this->db);
            
            // Extrayendo el Cajero seguro validado desde AuthMiddleware (JWT)
            $user_id = $user_payload['user_id'];
            
            // Intentar registrar la transacción atómica
            $sale_id = $saleModel->createSale(
                $user_id, 
                $data->total, 
                $data->payments, 
                $data->details
            );

            http_response_code(201); // Resource Created
            echo json_encode([
                "status" => "success", 
                "message" => "Venta procesada y stock descontado exitosamente.", 
                "sale_id" => $sale_id
            ]);

        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                "status" => "error", 
                "message" => "Error crítico: Transacción MySQL fallida. Todo fue revertido.", 
                "debug" => $e->getMessage()
            ]);
        }
    }
}
