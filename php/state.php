<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/storage.php';

$store = load_store();

echo json_encode([
    'success' => true,
    'profile' => $store['profile'],
    'companies' => $store['companies'],
    'send_logs_count' => count($store['send_logs']),
]);
