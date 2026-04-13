<?php
namespace Src\Models;
use PDO;
use Exception;

class Product {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function fetchAll() {
        $query = "SELECT p.*, c.name as category_name, s.name as supplier_name,
                  (SELECT GROUP_CONCAT(url_image SEPARATOR ',') FROM product_images WHERE product_id = p.id) as images
                  FROM products p 
                  LEFT JOIN categories c ON p.category_id = c.id 
                  LEFT JOIN suppliers s ON p.supplier_id = s.id 
                  ORDER BY p.name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert comma separated string to array for frontend convenience
        foreach($results as &$row) {
            $row['images'] = $row['images'] ? explode(',', $row['images']) : [];
        }
        return $results;
    }

    public function create($data) {
        $query = "INSERT INTO products (barcode, name, description, category_id, supplier_id, price, cost, stock, min_stock) 
                  VALUES (:barcode, :name, :description, :category_id, :supplier_id, :price, :cost, :stock, :min_stock)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':barcode', $data->barcode ?? null);
        $stmt->bindValue(':name', $data->name);
        $stmt->bindValue(':description', $data->description ?? '');
        $stmt->bindValue(':category_id', isset($data->category_id) && $data->category_id !== '' && $data->category_id !== null ? $data->category_id : null, PDO::PARAM_INT);
        $stmt->bindValue(':supplier_id', isset($data->supplier_id) && $data->supplier_id !== '' && $data->supplier_id !== null ? $data->supplier_id : null, PDO::PARAM_INT);
        $stmt->bindValue(':price', $data->price);
        $stmt->bindValue(':cost', $data->cost);
        $stmt->bindValue(':stock', $data->stock ?? 0, PDO::PARAM_INT);
        $stmt->bindValue(':min_stock', $data->min_stock ?? 5, PDO::PARAM_INT);
        $stmt->execute();
        
        $productId = $this->conn->lastInsertId();

        if (isset($data->images) && is_array($data->images)) {
            $imgQuery = "INSERT INTO product_images (product_id, url_image) VALUES (:pid, :url)";
            $imgStmt = $this->conn->prepare($imgQuery);
            foreach($data->images as $img) {
                if (trim($img) !== '') {
                    $imgStmt->execute([':pid' => $productId, ':url' => trim($img)]);
                }
            }
        }
        
        return $productId;
    }

    public function update($id, $data) {
        $query = "UPDATE products SET barcode = :barcode, name = :name, description = :description, 
                  category_id = :category_id, supplier_id = :supplier_id, price = :price, cost = :cost, stock = :stock, min_stock = :min_stock 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->bindValue(':barcode', $data->barcode ?? null);
        $stmt->bindValue(':name', $data->name);
        $stmt->bindValue(':description', $data->description ?? '');
        $stmt->bindValue(':category_id', isset($data->category_id) && $data->category_id !== '' && $data->category_id !== null ? $data->category_id : null, PDO::PARAM_INT);
        $stmt->bindValue(':supplier_id', isset($data->supplier_id) && $data->supplier_id !== '' && $data->supplier_id !== null ? $data->supplier_id : null, PDO::PARAM_INT);
        $stmt->bindValue(':price', $data->price);
        $stmt->bindValue(':cost', $data->cost);
        $stmt->bindValue(':stock', $data->stock ?? 0, PDO::PARAM_INT);
        $stmt->bindValue(':min_stock', $data->min_stock ?? 5, PDO::PARAM_INT);
        $stmt->execute();

        if (isset($data->images) && is_array($data->images)) {
            $this->conn->prepare("DELETE FROM product_images WHERE product_id = :id")->execute([':id' => $id]);
            $imgQuery = "INSERT INTO product_images (product_id, url_image) VALUES (:pid, :url)";
            $imgStmt = $this->conn->prepare($imgQuery);
            foreach($data->images as $img) {
                if (trim($img) !== '') {
                    $imgStmt->execute([':pid' => $id, ':url' => trim($img)]);
                }
            }
        }

        return true;
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM products WHERE id = :id");
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        return $stmt->execute();
    }

    public function importCSV($filePath, $userId, $kardexModel) {
        try {
            $this->conn->beginTransaction();
            if (($handle = fopen($filePath, "r")) !== FALSE) {
                fgetcsv($handle, 1000, ","); // Skip header
                
                $query = "INSERT INTO products (barcode, name, description, category_id, price, cost, stock, min_stock, supplier_id) 
                          VALUES (:barcode, :name, :desc, :cat, :price, :cost, :stock, :min, :sup)";
                $stmt = $this->conn->prepare($query);

                $imported_count = 0;
                $rowNum = 1;

                while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
                    $rowNum++;
                    if (count($data) >= 9) {
                        try {
                            $stmt->bindValue(':barcode', trim($data[0]) !== '' ? trim($data[0]) : null);
                            $stmt->bindValue(':name', trim($data[1]));
                            $stmt->bindValue(':desc', trim($data[2]));
                            $stmt->bindValue(':cat', trim($data[3]) !== '' ? (int)$data[3] : null, PDO::PARAM_INT);
                            $stmt->bindValue(':price', (float)$data[4]);
                            $stmt->bindValue(':cost', (float)$data[5]);
                            $stmt->bindValue(':stock', (int)$data[6], PDO::PARAM_INT);
                            $stmt->bindValue(':min', (int)$data[7], PDO::PARAM_INT);
                            $stmt->bindValue(':sup', trim($data[8]) !== '' ? (int)$data[8] : null, PDO::PARAM_INT);
                            $stmt->execute();
                            
                            $productId = $this->conn->lastInsertId();
                            
                            if ($userId && ((int)$data[6]) > 0) {
                                $kardexModel->generateEntry($productId, $userId, 'entrada', (int)$data[6], "Importación masiva");
                            }
                            $imported_count++;
                        } catch (Exception $e) {
                            $msg = $e->getMessage();
                            if (strpos($msg, '1062 Duplicate entry') !== false) {
                                $msg = "El código de barras o nombre ya existe.";
                            }
                            throw new Exception("Error en fila $rowNum: " . $msg);
                        }
                    }
                }
                fclose($handle);
                $this->conn->commit();
                return $imported_count;
            }
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
        return false;
    }
}
