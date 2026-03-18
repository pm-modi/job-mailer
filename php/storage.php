<?php

function storage_path(): string
{
    $baseDir = __DIR__ . '/../data/runtime';
    if (!is_dir($baseDir)) {
        mkdir($baseDir, 0777, true);
    }

    return $baseDir . '/storage.json';
}

function load_store(): array
{
    $path = storage_path();
    if (!file_exists($path)) {
        return [
            'profile' => [
                'gmail' => '',
                'name' => '',
                'updated_at' => null,
            ],
            'companies' => [],
            'send_logs' => [],
        ];
    }

    $raw = file_get_contents($path);
    $data = json_decode($raw, true);

    if (!is_array($data)) {
        return [
            'profile' => [
                'gmail' => '',
                'name' => '',
                'updated_at' => null,
            ],
            'companies' => [],
            'send_logs' => [],
        ];
    }

    $data['profile'] = is_array($data['profile'] ?? null) ? $data['profile'] : [
        'gmail' => '',
        'name' => '',
        'updated_at' => null,
    ];
    $data['companies'] = is_array($data['companies'] ?? null) ? $data['companies'] : [];
    $data['send_logs'] = is_array($data['send_logs'] ?? null) ? $data['send_logs'] : [];

    return $data;
}

function save_store(array $store): bool
{
    $path = storage_path();
    $json = json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    return file_put_contents($path, $json, LOCK_EX) !== false;
}

function read_json_input(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
