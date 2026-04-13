<?php

namespace Src\Config;

use PDO;
use PDOException;

class Database
{
    // Configuración para XAMPP / MySQL Workbench Local
    private $host = "localhost";
    private $db_name = "tienda_paul_db";
    private $username = "root";
    private $password = "1234"; // En XAMPP suele ser vacío
    public $conn;

    public function getConnection()
    {
        $this->conn = null;

        try {
            // Creamos la conexión usando UTF8 para evitar problemas con tildes o la letra Ñ
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4",
                $this->username,
                $this->password
            );

            // Configuramos PDO para que lance excepciones en caso de error
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Configuramos para que los resultados sean arreglos asociativos por defecto
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch (PDOException $exception) {
            // Si hay un error, enviamos un código 500 y el mensaje en JSON
            http_response_code(500);
            header('Content-Type: application/json');
            echo json_encode([
                "status" => "error",
                "message" => "No se pudo conectar a la base de datos local.",
                "error" => $exception->getMessage()
            ]);
            exit;
        }

        return $this->conn;
    }
}