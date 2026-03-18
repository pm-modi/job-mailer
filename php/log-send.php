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
$senderEmail = trim($input['senderEmail'] ?? '');
$senderName = trim($input['senderName'] ?? '');
$subject = trim($input['subject'] ?? '');
$companyName = trim($input['companyName'] ?? '');
$companyEmail = trim($input['companyEmail'] ?? '');
$status = trim($input['status'] ?? 'unknown');
$message = trim($input['message'] ?? '');

if ($companyEmail === '' || !filter_var($companyEmail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Valid company email required']);
    exit;
}

$store = load_store();
$store['send_logs'][] = [
    'sender_email' => $senderEmail,
    'sender_name' => $senderName,
    'subject' => $subject,
    'company_name' => $companyName,
    'company_email' => $companyEmail,
    'status' => $status,
    'message' => $message,
    'sent_at' => gmdate('c'),
];

if (count($store['send_logs']) > 1000) {
    $store['send_logs'] = array_slice($store['send_logs'], -1000);
}

if (!save_store($store)) {
    echo json_encode(['success' => false, 'message' => 'Failed to save send log']);
    exit;
}

echo json_encode(['success' => true]);
