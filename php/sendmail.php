<?php
ob_start();
error_reporting(E_ALL);
ini_set('display_errors', 0);

register_shutdown_function(function () {
    $error = error_get_last();
    $output = ob_get_clean();

    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'message' => 'PHP Fatal: ' . $error['message'] . ' in ' . $error['file'] . ':' . $error['line'],
        ]);
        return;
    }

    echo $output;
});

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

$autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) {
    echo json_encode([
        'success' => false,
        'message' => 'PHPMailer not found. Run composer install in the project root.',
    ]);
    exit;
}

require_once $autoload;

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

$gmail = trim($_POST['gmail'] ?? '');
$pass = trim($_POST['pass'] ?? '');
$senderName = trim($_POST['senderName'] ?? 'Suraj Gupta');
$toEmail = trim($_POST['toEmail'] ?? '');
$toName = trim($_POST['toName'] ?? 'Hiring Team');
$subject = trim($_POST['subject'] ?? '');
$body = trim($_POST['body'] ?? '');
$resumeB64 = trim($_POST['resumeB64'] ?? '');
$resumeName = trim($_POST['resumeName'] ?? 'Suraj_Gupta_Resume.pdf');
$defaultResumePath = trim($_POST['defaultResumePath'] ?? '');

if ($gmail === '' || $pass === '' || $toEmail === '' || $subject === '' || $body === '') {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields for sending.',
    ]);
    exit;
}

if (!filter_var($gmail, FILTER_VALIDATE_EMAIL) || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid sender or recipient email address.',
    ]);
    exit;
}

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = $gmail;
    $mail->Password = $pass;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port = 465;
    $mail->CharSet = 'UTF-8';
    $mail->SMTPOptions = [
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true,
        ],
    ];

    $mail->setFrom($gmail, $senderName);
    $mail->addAddress($toEmail, $toName);
    $mail->addReplyTo($gmail, $senderName);
    $mail->isHTML(false);
    $mail->Subject = $subject;
    $mail->Body = $body;

    if ($resumeB64 !== '') {
        $resumeData = base64_decode($resumeB64, true);
        if ($resumeData !== false) {
            $mail->addStringAttachment($resumeData, $resumeName, 'base64', 'application/pdf');
        }
    } elseif ($defaultResumePath !== '' && is_readable($defaultResumePath)) {
        $mail->addAttachment($defaultResumePath, basename($defaultResumePath));
    }

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'Sent to ' . $toEmail,
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Mailer error: ' . $mail->ErrorInfo,
    ]);
} catch (\Throwable $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage(),
    ]);
}
