<?php
ob_start();

// === GLOBAL HEADERS ===
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Respuesta rápida al Preflight de los navegadores (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// === AUTOLOADER NATIVO ===
spl_autoload_register(function ($class_name) {
    // Separamos el prefijo base del namespace del resto
    $prefix = 'Src\\';
    
    // Ruta base absoluta, asociando el prefijo "Src" a la carpeta "src" explícitamente y usando DIRECTORY_SEPARATOR
    $base_dir = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'src' . DIRECTORY_SEPARATOR;

    // Verificamos si la clase utiliza el namespace esperado
    $len = strlen($prefix);
    if (strncmp($prefix, $class_name, $len) !== 0) {
        return; // Pasar al siguiente autoloader si no es el dominio 'Src\'
    }

    // Obtenemos la clase relativa excluyendo el namespace principal
    $relative_class = substr($class_name, $len);

    // Reemplazamos contrabarras con DIRECTORY_SEPARATOR y agregamos '.php' al final obligatorio
    $file = $base_dir . str_replace('\\', DIRECTORY_SEPARATOR, $relative_class) . '.php';

    // Verificamos si existe en el disco duro antes de requerirlo
    if (file_exists($file)) {
        require_once $file;
    } else {
        ob_clean(); // Evita imprimir errores de PHP feos que rompan el JSON
        http_response_code(500);
        echo json_encode([
            "status" => "error", 
            "message" => "Autoload fallido: El archivo no existe.", 
            "clase" => $class_name,
            "ruta_buscada" => $file
        ]);
        exit;
    }
});

// === IMPORTS ===
use Src\Config\Database;
use Src\Controllers\AuthController;
use Src\Controllers\ProductController;
use Src\Controllers\SalesController;
use Src\Middleware\AuthMiddleware;

// Inicialización de la BD global para proveer a los controladores
$database = new Database();
$db = $database->getConnection();

// Parsear URL ignorando variables GET
$raw_uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];

// Para funcionar independiente del subdirectorio (Hostinger, XAMPP, etc)
// Extraemos solo desde la palabra '/api' en adelante para que los Controllers
// sigan asumiendo $parts[0] = 'api', $parts[1] = 'products', $parts[2] = 'ID'.
$apiPos = strpos($raw_uri, '/api');
if ($apiPos !== false) {
    $uri = substr($raw_uri, $apiPos);
} else {
    $uri = $raw_uri;
}

$apiPrefix = '/api';

// === FRONT CONTROLLER / ROUTER ===

// Ruta Pública: Login
if (strpos($uri, $apiPrefix . '/login') !== false && $method === 'POST') {
    $controller = new AuthController($db);
    $controller->login();
    exit;
}

// === SERVIDOR VIRTUAL DE IMÁGENES ===
if (strpos($uri, '/images/') === 0 && $method === 'GET') {
    $filename = basename($uri);
    $path = dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . 'images' . DIRECTORY_SEPARATOR . $filename;
    ob_end_clean(); // Limpiar buffers
    if (file_exists($path)) {
        $mime = mime_content_type($path);
        header('Content-Type: ' . $mime);
        readfile($path);
    } else {
        http_response_code(404);
        echo "404 Image Not Found";
    }
    exit;
}

// Ruta Privada: Ventas e Históricos (Transaccional y Reportes)
if (strpos($uri, $apiPrefix . '/sales') !== false) {
    $user_payload = AuthMiddleware::authenticate();
    $controller = new SalesController($db);
    $controller->processRequest($method, $uri, $user_payload);
    exit;
}

// Ruta Privada Dinámica: Dashboard Stats (GET)
if (strpos($uri, $apiPrefix . '/dashboard/stats') !== false && $method === 'GET') {
    $user_payload = AuthMiddleware::authenticate();
    if ($user_payload['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Acceso al Dashboard reservado para Administradores."]);
        exit;
    }
    $controller = new \Src\Controllers\DashboardController($db);
    $controller->getStats();
    exit;
}

// Ruta Privada Dinámica: Categorías (GET, POST, PUT, DELETE)
if (strpos($uri, $apiPrefix . '/categories') !== false) {
    $user = AuthMiddleware::authenticate();
    if ($method === 'DELETE' && $user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Solo los administradores pueden borrar registros."]);
        exit;
    }
    $controller = new \Src\Controllers\CategoryController($db);
    $controller->processRequest($method, $uri);
    exit;
}

// Ruta Privada Dinámica: Productos e Inventario (GET, POST, PUT, DELETE, Importación CSV)
if (strpos($uri, $apiPrefix . '/products') !== false) {
    $user = AuthMiddleware::authenticate();
    if ($method === 'DELETE' && $user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Solo los administradores pueden borrar registros."]);
        exit;
    }
    $controller = new ProductController($db);
    $controller->processRequest($method, $uri);
    exit;
}

// Ruta Privada Dinámica: Usuarios (Solo Admin)
if (strpos($uri, $apiPrefix . '/users') !== false) {
    $user = AuthMiddleware::authenticate();
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Acceso restringido a administradores."]);
        exit;
    }
    $controller = new \Src\Controllers\UserController($db);
    $controller->processRequest($method, $uri, $user);
    exit;
}

// Ruta Privada Dinámica: Proveedores
if (strpos($uri, $apiPrefix . '/suppliers') !== false) {
    $user = AuthMiddleware::authenticate();
    $controller = new \Src\Controllers\SupplierController($db);
    $controller->processRequest($method, $uri);
    exit;
}

// Ruta Privada Dinámica: Kardex
if (strpos($uri, $apiPrefix . '/kardex') !== false) {
    $user = AuthMiddleware::authenticate();
    $controller = new \Src\Controllers\KardexController($db);
    $controller->processRequest($method, $uri);
    exit;
}

// Default 404 Fallback
http_response_code(404);
echo json_encode(["status" => "error", "message" => "Endpoint API no encontrado", "ruta" => $uri]);

// Limpiamos el buffer output al final para que solo envíe puros Json limpios.
ob_end_flush();
