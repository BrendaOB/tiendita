<?php
namespace Src\Models;

class Kardex {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function fetchAll($product_id = null) {
        $sql = "SELECT k.*, p.name as product_name, u.name as user_name 
                FROM kardex k 
                JOIN products p ON k.product_id = p.id 
                JOIN users u ON k.user_id = u.id ";
        if ($product_id) {
            $sql .= "WHERE k.product_id = :pid ";
        }
        $sql .= "ORDER BY k.id DESC";

        $stmt = $this->db->prepare($sql);
        if ($product_id) {
            $stmt->execute([':pid' => $product_id]);
        } else {
            $stmt->execute();
        }
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function generateEntry($product_id, $user_id, $tipo, $cantidad, $motivo) {
        // Obtenemos el stock actual para calcular resultante
        $stmtStock = $this->db->prepare("SELECT stock FROM products WHERE id = :id FOR UPDATE");
        $stmtStock->execute([':id' => $product_id]);
        $row = $stmtStock->fetch(\PDO::FETCH_ASSOC);
        
        if (!$row) return false;

        $stock_actual = (int)$row['stock'];
        $stock_resultante = $stock_actual;

        // El stock en la tabla products YA SE DEBE HABER ACTUALIZADO por el ProductController o SalesController.
        // Aquí decidimos no re-actualizar el stock de `products`, sino registrar cómo quedó.
        // Sin embargo, para mayor seguridad, Kardex solo será el notario.
        // Asumimos que la cantidad ya fue sumada o restada del producto base al momento de llamar esto, 
        // así que el resultante DEBE coincidir con el stock_actual.
        $stock_resultante = $stock_actual;

        $query = "INSERT INTO kardex (product_id, user_id, tipo_movimiento, cantidad, stock_resultante, motivo) 
                  VALUES (:pid, :uid, :tipo, :cant, :res, :motivo)";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':pid' => $product_id,
            ':uid' => $user_id,
            ':tipo' => $tipo,
            ':cant' => $cantidad,
            ':res' => $stock_resultante,
            ':motivo' => $motivo
        ]);

        return $this->db->lastInsertId();
    }
}
