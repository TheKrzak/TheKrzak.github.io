<?php
namespace App\Encoder;

class CsvEncoder implements EncoderInterface {
    public function supports(string $format): bool {
        return $format === 'csv';
    }

    public function decode(string $data): array {
        $lines = explode("\n", trim($data));
        $header = str_getcsv(array_shift($lines), ",", '"', "\\");
        $result = [];

        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            $row = str_getcsv($line, ",", '"', "\\");
            $result[] = array_combine($header, $row);
        }
        return $result;
    }

    public function encode(array $data): string {
        if (empty($data)) return "";

        $output = fopen("php://temp", "r+");
        $header = array_keys($data[0]);
        fputcsv($output, $header, ",", '"', "\\");

        foreach ($data as $row) {
            fputcsv($output, $row, ",", '"', "\\");
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}