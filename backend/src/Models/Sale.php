<?php
namespace Src\Models;

use PDO;
use Exception;

class Sale {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function createSale($user_id, $total, $payments, $details) {
        try {
            // Empezar transacción MySQL
            $this->conn->beginTransaction();

            // 1. Insertar Encabezado
            $querySale = "INSERT INTO sales (user_id, total) VALUES (:user_id, :total)";
            $stmtSale = $this->conn->prepare($querySale);
            $stmtSale->bindParam(':user_id', $user_id);
            $stmtSale->bindParam(':total', $total);
            $stmtSale->execute();
            
            $sale_id = $this->conn->lastInsertId();

            // 1.5 Insertar Líneas de Pago
            $queryPayment = "INSERT INTO sale_payments (sale_id, method, amount, reference_code) VALUES (:sale_id, :method, :amount, :ref)";
            $stmtPayment = $this->conn->prepare($queryPayment);
            foreach ($payments as $pay) {
                $m = $pay->method;
                $a = $pay->amount;
                $r = isset($pay->reference) ? $pay->reference : null;
                $stmtPayment->execute([
                    ':sale_id' => $sale_id,
                    ':method' => $m,
                    ':amount' => $a,
                    ':ref' => $r
                ]);
            }

            // 2. Preparar queries repetitivas
            $queryDetail = "INSERT INTO sale_details (sale_id, product_id, quantity, unit_price, subtotal) 
                            VALUES (:sale_id, :product_id, :qty, :price, :subtotal)";
            $stmtDetail = $this->conn->prepare($queryDetail);

            $queryStock = "UPDATE products SET stock = stock - :qty WHERE id = :product_id";
            $stmtStock = $this->conn->prepare($queryStock);

            // 3. Iterar cada detalle del recibo
            foreach ($details as $item) {
                // Validación básica de estructura de objeto proviniendo del frontend
                $qty = isset($item->quantity) ? $item->quantity : 0;
                $price = isset($item->unit_price) ? $item->unit_price : 0;
                $product_id = isset($item->product_id) ? $item->product_id : 0;
                $sub = $qty * $price;
                
                // Insertar Fila Detalle
                $stmtDetail->bindValue(':sale_id', $sale_id, PDO::PARAM_INT);
                $stmtDetail->bindValue(':product_id', $product_id, PDO::PARAM_INT);
                $stmtDetail->bindValue(':qty', $qty, PDO::PARAM_INT);
                $stmtDetail->bindValue(':price', $price);
                $stmtDetail->bindValue(':subtotal', $sub);
                $stmtDetail->execute();

                // Actualizar Stock del Producto Atómicamente
                $stmtStock->bindValue(':qty', $qty, PDO::PARAM_INT);
                $stmtStock->bindValue(':product_id', $product_id, PDO::PARAM_INT);
                $stmtStock->execute();

                // Interceptar trazabilidad KARDEX (En la misma transaccion atómica)
                $stmtKardexStock = $this->conn->prepare("SELECT stock FROM products WHERE id = :id FOR UPDATE");
                $stmtKardexStock->execute([':id' => $product_id]);
                $kardexRow = $stmtKardexStock->fetch(PDO::FETCH_ASSOC);
                
                $kardexQuery = "INSERT INTO kardex (product_id, user_id, tipo_movimiento, cantidad, stock_resultante, motivo) 
                                VALUES (:pid, :uid, 'salida', :cant, :res, :motivo)";
                $stmtKardex = $this->conn->prepare($kardexQuery);
                $stmtKardex->execute([
                    ':pid' => $product_id,
                    ':uid' => $user_id,
                    ':cant' => $qty,
                    ':res' => (int)$kardexRow['stock'],
                    ':motivo' => "Venta Libre en POS - Ticket #" . $sale_id
                ]);
            }

            // Exito Total -> Commit
            $this->conn->commit();
            return $sale_id;

        } catch (Exception $e) {
            // Fallo parcial o total -> Rollback para mantener integridad relacional
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function fetchSales($limit, $offset, $dateFilter) {
        $whereClause = "";
        
        switch ($dateFilter) {
            case 'today':
                $whereClause = "WHERE DATE(s.created_at) = CURDATE()";
                break;
            case 'month':
                $whereClause = "WHERE MONTH(s.created_at) = MONTH(CURDATE()) AND YEAR(s.created_at) = YEAR(CURDATE())";
                break;
            case 'year':
                $whereClause = "WHERE YEAR(s.created_at) = YEAR(CURDATE())";
                break;
            case 'all':
            default:
                // Si es todo o custom manual
                if (strpos($dateFilter, 'to') !== false) {
                    $parts = explode('to', $dateFilter);
                    $start = trim($parts[0]);
                    $end = trim($parts[1]);
                    $whereClause = "WHERE DATE(s.created_at) >= '$start' AND DATE(s.created_at) <= '$end'";
                }
                break;
        }

        $query = "SELECT s.*, u.name as user_name,
                    (SELECT GROUP_CONCAT(CONCAT(method, ':', amount) SEPARATOR '|') FROM sale_payments WHERE sale_id = s.id) as payments_raw
                  FROM sales s
                  LEFT JOIN users u ON s.user_id = u.id 
                  $whereClause
                  ORDER BY s.id DESC 
                  LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Fetch Total
        $countQuery = "SELECT COUNT(*) as total FROM sales s $whereClause";
        $countStmt = $this->conn->prepare($countQuery);
        $countStmt->execute();
        $totalItems = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Aggregate by Payment Method
        $totalsQuery = "SELECT sp.method, SUM(sp.amount) as total_amount 
                        FROM sale_payments sp
                        JOIN sales s ON sp.sale_id = s.id
                        $whereClause
                        GROUP BY sp.method";
        $totalsStmt = $this->conn->prepare($totalsQuery);
        $totalsStmt->execute();
        $totalsByMethod = $totalsStmt->fetchAll(PDO::FETCH_ASSOC);

        return ["data" => $data, "total" => $totalItems, "totalsByMethod" => $totalsByMethod];
    }

    public function fetchSaleDetails($sale_id) {
        $query = "SELECT sd.*, p.name as product_name, p.barcode 
                  FROM sale_details sd
                  LEFT JOIN products p ON sd.product_id = p.id
                  WHERE sd.sale_id = :sale_id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([':sale_id' => $sale_id]);
        $details = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $queryPay = "SELECT * FROM sale_payments WHERE sale_id = :sale_id";
        $stmtPay = $this->conn->prepare($queryPay);
        $stmtPay->execute([':sale_id' => $sale_id]);
        $payments = $stmtPay->fetchAll(PDO::FETCH_ASSOC);

        return ["details" => $details, "payments" => $payments];
    }
}
