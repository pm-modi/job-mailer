<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$apiKey = getenv('GROQ_API_KEY') ?: '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';
if (!$apiKey) {
    echo json_encode(['error' => 'GROQ_API_KEY is not configured on the server']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || empty($input['prompt'])) {
    echo json_encode(['error' => 'prompt required']);
    exit;
}

$profile = is_array($input['profile'] ?? null) ? $input['profile'] : [];
$name = trim($profile['name'] ?? 'Suraj Gupta');
$title = trim($profile['title'] ?? 'Software Developer');
$email = trim($profile['email'] ?? '');
$phone = trim($profile['phone'] ?? '');
$summary = trim($profile['summary'] ?? 'Software developer with experience across backend and frontend delivery.');
$availability = trim($profile['availability'] ?? 'Available for interviews');
$context = trim($input['context'] ?? 'software developer role');
$emailBody = trim($input['emailBody'] ?? '');
$subject = trim($input['subject'] ?? '');
$prompt = trim($input['prompt']);

$contact = implode(' | ', array_values(array_filter([$phone, $email])));

$systemMsg = "You are an expert job application email writer.\n"
    . "Candidate name: {$name}\n"
    . "Target title: {$title}\n"
    . "Profile summary: {$summary}\n"
    . "Availability: {$availability}\n"
    . "Contact: {$contact}\n"
    . "Context tags: {$context}\n"
    . "Current subject: {$subject}\n\n"
    . "Current email body:\n---\n{$emailBody}\n---\n\n"
    . "Rules:\n"
    . "- Return JSON only with keys subject and body\n"
    . "- Keep the response concise and realistic\n"
    . "- Preserve factual details unless the user asks to change them\n"
    . "- Do not add markdown or commentary outside JSON";

$payload = json_encode([
    'model' => 'llama-3.3-70b-versatile',
    'messages' => [
        ['role' => 'system', 'content' => $systemMsg],
        ['role' => 'user', 'content' => $prompt],
    ],
    'max_tokens' => 700,
    'temperature' => 0.6,
]);

$response = false;
$httpCode = 0;
$requestError = '';

if (function_exists('curl_init')) {
    $ch = curl_init('https://api.groq.com/openai/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
        ],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);

    $response = curl_exec($ch);
    $requestError = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
} else {
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $apiKey,
            ]),
            'content' => $payload,
            'timeout' => 30,
            'ignore_errors' => true,
        ],
    ]);

    $response = @file_get_contents('https://api.groq.com/openai/v1/chat/completions', false, $context);
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $headerLine) {
            if (preg_match('/^HTTP\/\S+\s+(\d+)/', $headerLine, $matches)) {
                $httpCode = (int) $matches[1];
                break;
            }
        }
    }

    if ($response === false) {
        $error = error_get_last();
        $requestError = $error['message'] ?? 'HTTP request failed';
    }
}

if (!$response || $requestError) {
    echo json_encode(['error' => 'Request failed: ' . $requestError, 'http_code' => $httpCode]);
    exit;
}

$data = json_decode($response, true);
if (isset($data['error'])) {
    echo json_encode(['error' => 'Groq: ' . $data['error']['message']]);
    exit;
}

$text = trim($data['choices'][0]['message']['content'] ?? '');
if ($text === '') {
    echo json_encode(['error' => 'No response from model']);
    exit;
}

if (preg_match('/```(?:json)?\s*(\{.*\})\s*```/is', $text, $matches)) {
    $text = trim($matches[1]);
}

$decoded = json_decode($text, true);
if (!is_array($decoded)) {
    echo json_encode([
        'subject' => $subject,
        'body' => $text,
        'reply' => $text,
    ]);
    exit;
}

echo json_encode([
    'subject' => trim($decoded['subject'] ?? $subject),
    'body' => trim($decoded['body'] ?? $emailBody),
]);
