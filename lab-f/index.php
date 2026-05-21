<?php
// Autoloader z instrukcji
spl_autoload_register(function (string $class): void {
    $prefix = 'App\\';
    $baseDir = __DIR__.'/lib/';
    if (0 === strpos($class, $prefix)) {
        $relative = substr($class, strlen($prefix));
        $file = $baseDir.str_replace('\\', '/', $relative).'.php';
        if (file_exists($file)) {
            require $file;
        }
    }
});

use App\Serializer;
use App\Encoder\CsvEncoder;
use App\Encoder\SsvEncoder;
use App\Encoder\TsvEncoder;
use App\Encoder\JsonEncoder;
use App\Encoder\YamlEncoder;

// Rejestracja enkoderów
$serializer = new Serializer();
$serializer->addEncoder(new CsvEncoder());
$serializer->addEncoder(new SsvEncoder());
$serializer->addEncoder(new TsvEncoder());
$serializer->addEncoder(new JsonEncoder());
$serializer->addEncoder(new YamlEncoder());

// Wyciąganie wartości początkowych z ciasteczek
$inputData = $_COOKIE['inputData'] ?? '';
$formatIn = $_COOKIE['formatIn'] ?? 'csv';
$formatOut = $_COOKIE['formatOut'] ?? 'json';
$outputData = '';

// Obsługa wysłania formularza
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputData = $_POST['inputData'] ?? '';
    $formatIn = $_POST['formatIn'] ?? 'csv';
    $formatOut = $_POST['formatOut'] ?? 'json';

    // Zapisywanie ciastek na jeden dzień
    setcookie('inputData', $inputData, time() + 86400, "/");
    setcookie('formatIn', $formatIn, time() + 86400, "/");
    setcookie('formatOut', $formatOut, time() + 86400, "/");

    // Konwersja jeśli podano dane
    if (!empty(trim($inputData))) {
        $arrayData = $serializer->deserialize($inputData, $formatIn);
        $outputData = $serializer->serialize($arrayData, $formatOut);
    }
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Konwerter LAB F</title>
    <style>
        body { font-family: sans-serif; padding: 20px; }
        .container { display: flex; gap: 20px; }
        .box { flex: 1; display: flex; flex-direction: column; }
        textarea, pre { height: 400px; width: 100%; box-sizing: border-box; }
        pre { background: #f4f4f4; border: 1px solid #ccc; overflow: auto; padding: 10px; }
        select, button { padding: 10px; margin-bottom: 10px; width: 100%; }
        button { cursor: pointer; font-weight: bold; margin-top: 10px; }
    </style>
</head>
<body>
<form method="POST">
    <div class="container">
        <div class="box">
            <select name="formatIn">
                <option value="csv" <?= $formatIn == 'csv' ? 'selected' : '' ?>>CSV</option>
                <option value="ssv" <?= $formatIn == 'ssv' ? 'selected' : '' ?>>SSV</option>
                <option value="tsv" <?= $formatIn == 'tsv' ? 'selected' : '' ?>>TSV</option>
                <option value="json" <?= $formatIn == 'json' ? 'selected' : '' ?>>JSON</option>
                <option value="yml" <?= $formatIn == 'yml' ? 'selected' : '' ?>>YAML</option>
            </select>
            <textarea name="inputData"><?= htmlspecialchars($inputData) ?></textarea>
        </div>
        <div class="box">
            <select name="formatOut">
                <option value="csv" <?= $formatOut == 'csv' ? 'selected' : '' ?>>CSV</option>
                <option value="ssv" <?= $formatOut == 'ssv' ? 'selected' : '' ?>>SSV</option>
                <option value="tsv" <?= $formatOut == 'tsv' ? 'selected' : '' ?>>TSV</option>
                <option value="json" <?= $formatOut == 'json' ? 'selected' : '' ?>>JSON</option>
                <option value="yml" <?= $formatOut == 'yml' ? 'selected' : '' ?>>YAML</option>
            </select>
            <pre><?= htmlspecialchars($outputData) ?></pre>
        </div>
    </div>
    <button type="submit">Convert</button>
</form>
</body>
</html>