<?php
namespace Src\Controllers;

use PDO;
use Exception;

class DashboardController {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getStats() {
        try {
            // 1. Ventas de hoy
            $stmt = $this->conn->prepare("SELECT SUM(total) as daily_sales FROM sales WHERE DATE(created_at) = CURDATE()");
            $stmt->execute();
            $daily_sales = $stmt->fetch(PDO::FETCH_ASSOC)['daily_sales'] ?: 0;

            // 2. Ventas del mes
            $stmt = $this->conn->prepare("SELECT COUNT(*) as monthly_count, SUM(total) as monthly_revenue FROM sales WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())");
            $stmt->execute();
            $monthly_stats = $stmt->fetch(PDO::FETCH_ASSOC);

            // 3. Top 5 productos vendidos
            $stmt = $this->conn->prepare("
                SELECT p.name, SUM(sd.quantity) as total_sold
                FROM sale_details sd
                JOIN products p ON sd.product_id = p.id
                GROUP BY p.id
                ORDER BY total_sold DESC
                LIMIT 5
            ");
            $stmt->execute();
            $top_products = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 4. Stock bajo (crítico) con Proveedor (Suministros)
            $stmt = $this->conn->prepare("SELECT p.id, p.name, p.stock, p.min_stock, s.name as supplier_name, s.phone as supplier_phone FROM products p LEFT JOIN suppliers s ON p.supplier_id = s.id WHERE p.stock <= p.min_stock ORDER BY p.stock ASC");
            $stmt->execute();
            $low_stock = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 5. Histórico 7 días
            $stmt = $this->conn->prepare("
                SELECT DATE(created_at) as date, SUM(total) as total
                FROM sales
                WHERE created_at >= DATE(NOW()) - INTERVAL 6 DAY
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            ");
            $stmt->execute();
            $chart_data = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // 6. Ranking de Vendedores (Mes Actual)
            $stmt = $this->conn->prepare("
                SELECT u.name, SUM(s.total) as total_sold
                FROM sales s
                JOIN users u ON s.user_id = u.id
                WHERE MONTH(s.created_at) = MONTH(CURDATE()) AND YEAR(s.created_at) = YEAR(CURDATE())
                GROUP BY u.id
                ORDER BY total_sold DESC
            ");
            $stmt->execute();
            $ranking = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Normalización para la gráfica Recharts
            $filled_chart = [];
            for ($i = 6; $i >= 0; $i--) {
                $d = date('Y-m-d', strtotime("-$i days"));
                $found = array_filter($chart_data, fn($c) => $c['date'] === $d);
                if ($found) {
                    $filled_chart[] = ["date" => date('D d', strtotime($d)), "ingresos" => (float)array_values($found)[0]['total']];
                } else {
                    $filled_chart[] = ["date" => date('D d', strtotime($d)), "ingresos" => 0];
                }
            }

            http_response_code(200);
            echo json_encode([
                "status" => "success",
                "data" => [
                    "daily_sales" => (float)$daily_sales,
                    "monthly_count" => (int)($monthly_stats['monthly_count'] ?? 0),
                    "monthly_revenue" => (float)($monthly_stats['monthly_revenue'] ?? 0),
                    "top_products" => $top_products,
                    "low_stock" => $low_stock,
                    "chart" => $filled_chart,
                    "ranking" => $ranking
                ]
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Error calculando métricas.", "debug" => $e->getMessage()]);
        }
    }
}
