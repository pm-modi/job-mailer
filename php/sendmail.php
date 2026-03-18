<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);

register_shutdown_function(function() {
    $error = error_get_last();
    $output = ob_get_clean();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'PHP Fatal: ' . $error['message'] . ' in ' . $error['file'] . ':' . $error['line']
        ]);
    } else {
        echo $output;
    }
});

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

// ✅ FIXED: Load autoload directly — no broken if/else
$autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) {
    echo json_encode([
        'success' => false,
        'message' => 'PHPMailer not found — run: composer install in project root'
    ]);
    exit;
}
require_once $autoload;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

$gmail      = trim($_POST['gmail']      ?? '');
$pass       = trim($_POST['pass']       ?? '');
$senderName = trim($_POST['senderName'] ?? 'Paras Verma');
$toEmail    = trim($_POST['toEmail']    ?? '');
$toName     = trim($_POST['toName']     ?? 'Hiring Team');
$subject    = trim($_POST['subject']    ?? '');
$body       = trim($_POST['body']       ?? '');
$resumeB64  = trim($_POST['resumeB64']  ?? '');
$resumeName = trim($_POST['resumeName'] ?? 'Resume.pdf');

if (!$gmail || !$pass || !$toEmail || !$subject || !$body) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing fields — gmail=' . ($gmail ? 'ok' : 'EMPTY')
                   . ' pass=' . ($pass ? 'ok' : 'EMPTY')
                   . ' to=' . ($toEmail ? 'ok' : 'EMPTY')
                   . ' subject=' . ($subject ? 'ok' : 'EMPTY')
                   . ' body=' . ($body ? 'ok' : 'EMPTY')
    ]);
    exit;
}

if (!filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email: ' . $toEmail]);
    exit;
}

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = $gmail;
    $mail->Password   = $pass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;
    $mail->CharSet    = 'UTF-8';
    $mail->SMTPOptions = [
        'ssl' => [
            'verify_peer'       => false,
            'verify_peer_name'  => false,
            'allow_self_signed' => true
        ]
    ];

    $mail->setFrom($gmail, $senderName);
    $mail->addAddress($toEmail, $toName);
    $mail->addReplyTo($gmail, $senderName);
    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body    = $body;

    if (!empty($resumeB64)) {
        $resumeData = base64_decode($resumeB64);
        if ($resumeData !== false) {
            $mail->addStringAttachment($resumeData, $resumeName, 'base64', 'application/pdf');
        }
    }

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Sent to ' . $toEmail]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Mailer Error: ' . $mail->ErrorInfo]);
} catch (\Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}