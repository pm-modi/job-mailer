<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$apiKey = getenv('GROQ_API_KEY');
if (!$apiKey) {
    echo json_encode(['error' => 'GROQ_API_KEY not configured on server']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || empty($input['prompt'])) {
    echo json_encode(['error' => 'prompt required']);
    exit;
}

$prompt = $input['prompt'];
$context = $input['context'] ?? 'software developer';
$emailBody = $input['emailBody'] ?? '';

$systemMsg = "You are an expert job email writer for Paras Verma.
Paras: Full Stack .NET Developer, 1 year exp, 8+ live ERP modules (ASP.NET MVC, C#, SQL Server, SignalR).
5 production websites. B.Tech CSE 2025 ~78%. Target: 30000-35000/month Gurugram/NCR India.
Phone: 8295848561 | Email: vparas0002@gmail.com
Context: {$context}

Current email:
---
{$emailBody}
---

Rules:
- Rewrite/modify request pe: ONLY new email body return karo
- No markdown, no explanation - plain text only
- Keep Paras details accurate";

$url = 'https://api.groq.com/openai/v1/chat/completions';
$body = json_encode([
    'model' => 'llama-3.3-70b-versatile',
    'messages' => [
        ['role' => 'system', 'content' => $systemMsg],
        ['role' => 'user', 'content' => $prompt],
    ],
    'max_tokens' => 800,
    'temperature' => 0.7,
]);

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false,
]);

$response = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if (!$response || $curlError) {
    echo json_encode(['error' => 'Curl failed: ' . $curlError, 'http_code' => $httpCode]);
    exit;
}

$data = json_decode($response, true);

if (isset($data['error'])) {
    echo json_encode(['error' => 'Groq: ' . $data['error']['message']]);
    exit;
}

$text = $data['choices'][0]['message']['content'] ?? null;
if (!$text) {
    echo json_encode(['error' => 'No response', 'raw' => $data]);
    exit;
}

echo json_encode(['reply' => trim($text)]);
