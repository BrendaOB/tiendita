<?php
namespace Src\Models;

class Supplier {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function fetchAll() {
        $stmt = $this->db->query("SELECT * FROM suppliers ORDER BY id DESC");
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO suppliers (name, ruc, phone, email, address) VALUES (:name, :ruc, :phone, :email, :address)";
        $stmt = $this->db->prepare($query);
        $stmt->execute([
            ':name' => $data->name,
            ':ruc' => $data->ruc ?? null,
            ':phone' => $data->phone ?? null,
            ':email' => $data->email ?? null,
            ':address' => $data->address ?? null
        ]);
        return $this->db->lastInsertId();
    }

    public function update($id, $data) {
        $query = "UPDATE suppliers SET name = :name, ruc = :ruc, phone = :phone, email = :email, address = :address WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([
            ':name' => $data->name,
            ':ruc' => $data->ruc ?? null,
            ':phone' => $data->phone ?? null,
            ':email' => $data->email ?? null,
            ':address' => $data->address ?? null,
            ':id' => $id
        ]);
    }

    public function delete($id) {
        $query = "DELETE FROM suppliers WHERE id = :id";
        $stmt = $this->db->prepare($query);
        return $stmt->execute([':id' => $id]);
    }
}
