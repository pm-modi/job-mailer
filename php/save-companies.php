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
$companies = $input['companies'] ?? null;

if (!is_array($companies)) {
    echo json_encode(['success' => false, 'message' => 'Companies array required']);
    exit;
}

$normalized = [];
foreach ($companies as $company) {
    if (!is_array($company)) {
        continue;
    }

    $name = trim($company['name'] ?? '');
    $email = trim($company['email'] ?? '');
    $type = trim($company['type'] ?? 'custom');

    if ($name === '' || $email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        continue;
    }

    $normalized[] = [
        'name' => $name,
        'email' => $email,
        'type' => $type !== '' ? $type : 'custom',
    ];
}

$store = load_store();
$store['companies'] = $normalized;

if (!save_store($store)) {
    echo json_encode(['success' => false, 'message' => 'Failed to save companies']);
    exit;
}

echo json_encode(['success' => true, 'count' => count($normalized)]);
