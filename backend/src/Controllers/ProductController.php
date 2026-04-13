<?php
namespace Src\Controllers;

use Src\Models\Product;
use Src\Models\Kardex;

class ProductController {
    private $productModel;
    private $kardexModel;

    public function __construct($db) {
        $this->productModel = new Product($db);
        $this->kardexModel = new Kardex($db);
    }

    public function processRequest($method, $uri, $user = null) {
        $parts = explode('/', trim($uri, '/'));
        $target = isset($parts[2]) ? $parts[2] : null;

        // Si $user es nulo es porque probablemente el index viejo no lo pasa
        // Aseguramos que tengamos el token decodificado
        if (!$user) {
            $user = \Src\Middleware\AuthMiddleware::authenticate();
        }

        try {
            if ($method === 'GET' && !$target) {
                $this->getAll();
            } else if ($method === 'POST' && $target === 'import') {
                $this->importExcel($user);
            } else if ($method === 'POST' && !$target) {
                $this->create($user);
            } else if ($method === 'PUT' && is_numeric($target)) {
                $this->update((int)$target, $user);
            } else if ($method === 'DELETE' && is_numeric($target)) {
                $this->delete((int)$target);
            } else if ($method === 'POST' && $target === 'upload-images') {
                $this->uploadImages();
            } else {
                http_response_code(404);
                echo json_encode(["status" => "error", "message" => "Ruta de productos desconocida."]);
            }
        } catch (\Exception $e) {
            $msg = $e->getMessage();
            if (strpos($msg, '1062 Duplicate entry') !== false) {
                $custom_msg = strpos($msg, 'barcode') !== false ? "El código de barras ya le pertenece a otro producto activo." : "El nombre de esta entidad ya está registrado.";
                http_response_code(409);
                echo json_encode(["status" => "error", "message" => $custom_msg]);
                return;
            }
            http_response_code(500);
            echo json_encode([
                "status" => "error", 
                "message" => "Error interno PDO: " . $e->getMessage(), 
                "debug" => $e->getMessage(),
                "error" => $e->getMessage()
            ]);
        }
    }

    private function getAll() {
        $products = $this->productModel->fetchAll();
        http_response_code(200);
        echo json_encode(["status" => "success", "data" => $products]);
    }

    private function create($user) {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->name) || !isset($data->price) || !isset($data->cost)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Faltan parámetros de negocio (Nombre, precio, costo)."]);
            return;
        }
        
        // Auto-generación de Barcode Único si el string está vacío
        if (empty(trim($data->barcode))) {
            $data->barcode = "GEN-" . strtoupper(bin2hex(random_bytes(3))) . mt_rand(10, 99);
        } else {
            $data->barcode = trim($data->barcode);
        }
        
        $productId = $this->productModel->create($data);
        
        // Registrar en Kardex el alta de la primera cantidad
        if (isset($data->stock) && $data->stock > 0) {
            $currentUserId = is_array($user) ? ($user['user_id'] ?? null) : ($user->user_id ?? null);
            if ($currentUserId) {
                $this->kardexModel->generateEntry($productId, $currentUserId, 'entrada', $data->stock, "Creación Inicial");
            }
        }

        http_response_code(201);
        echo json_encode(["status" => "success", "message" => "Producto registrado."]);
    }

    private function update($id, $user) {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->name)) {
            http_response_code(400); return;
        }
        
        // Averiguar el stock ANTES de modificar para saber el delta
        $pdo = new \PDO("mysql:host=srv1529.hstgr.io;dbname=u218565341_tienda_paul_db", "u218565341_tienda_paul_db", "vUxyyqiH@0");
        $stmt = $pdo->prepare("SELECT stock FROM products WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        $old_stock = $row ? (int)$row['stock'] : 0;

        $this->productModel->update($id, $data);
        
        // Si el stock enviado es diferente al stock actual, registrar en Kardex
        if (isset($data->stock)) {
            $new_stock = (int)$data->stock;
            if ($new_stock !== $old_stock) {
                $diff = $new_stock - $old_stock;
                $tipo = $diff > 0 ? 'entrada' : 'ajuste';
                $currentUserId = is_array($user) ? ($user['user_id'] ?? null) : ($user->user_id ?? null);
                if ($currentUserId) {
                   $this->kardexModel->generateEntry($id, $currentUserId, $tipo, abs($diff), "Edición Manual Inventario");
                }
            }
        }

        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Producto modificado."]);
    }

    private function delete($id) {
        $this->productModel->delete($id);
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Producto retirado del catálogo."]);
    }

    private function importExcel($user) {
        if (!isset($_FILES['file'])) {
            http_response_code(400); return;
        }
        $tmpName = $_FILES['file']['tmp_name'];
        $userId = is_array($user) ? ($user['user_id'] ?? null) : ($user->user_id ?? null);
        
        try {
            $count = $this->productModel->importCSV($tmpName, $userId, $this->kardexModel);
            if ($count !== false) {
                http_response_code(201);
                echo json_encode(["status" => "success", "message" => "Importación terminada.", "inserted_rows" => $count]);
            } else {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "No se pudo leer el archivo."]);
            }
        } catch (\Exception $e) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        }
    }

    private function uploadImages() {
        if (!isset($_FILES['images'])) {
            http_response_code(400); return;
        }

        $uploadDir = dirname(__DIR__, 3) . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $files = $_FILES['images'];
        $uploadedUrls = [];
        $domain = isset($_SERVER['HTTP_HOST']) ? "http://".$_SERVER['HTTP_HOST'] : "http://localhost:8000";

        foreach ($files['tmp_name'] as $key => $tmpName) {
            if ($files['error'][$key] === UPLOAD_ERR_OK) {
                // IMG_YYYYMMDD_TIMESTAMP_RANDOMID.jpg
                $ext = pathinfo($files['name'][$key], PATHINFO_EXTENSION);
                $ext = $ext ? $ext : 'jpg';
                $filename = 'IMG_' . date('Ymd') . '_' . time() . '_' . mt_rand(1000, 9999) . '.' . $ext;
                $targetFile = $uploadDir . $filename;
                
                if (move_uploaded_file($tmpName, $targetFile)) {
                    $uploadedUrls[] = $domain . '/images/' . $filename;
                }
            }
        }
        
        http_response_code(201);
        echo json_encode(["status" => "success", "urls" => $uploadedUrls]);
    }
}
