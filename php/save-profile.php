<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/storage.php';

$input = read_json_input();
$gmail = trim($input['gmail'] ?? '');
$name = trim($input['name'] ?? '');

if ($gmail !== '' && !filter_var($gmail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid sender email']);
    exit;
}

$store = load_store();
$store['profile'] = [
    'gmail' => $gmail,
    'name' => $name,
    'updated_at' => gmdate('c'),
];

if (!save_store($store)) {
    echo json_encode(['success' => false, 'message' => 'Failed to save profile']);
    exit;
}

echo json_encode(['success' => true]);
