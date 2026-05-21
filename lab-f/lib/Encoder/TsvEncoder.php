<?php
namespace App\Encoder;

class TsvEncoder implements EncoderInterface {
    public function supports(string $format): bool {
        return $format === 'tsv';
    }

    public function decode(string $data): array {
        $lines = explode("\n", trim($data));
        // DODANY PARAMETR ESCAPE
        $header = str_getcsv(array_shift($lines), "\t", '"', "\\");
        $result = [];

        foreach ($lines as $line) {
            if (empty(trim($line))) continue;
            // DODANY PARAMETR ESCAPE
            $row = str_getcsv($line, "\t", '"', "\\");
            $result[] = array_combine($header, $row);
        }
        return $result;
    }

    public function encode(array $data): string {
        if (empty($data)) return "";

        $output = fopen("php://temp", "r+");
        $header = array_keys($data[0]);
        // DODANY PARAMETR ESCAPE
        fputcsv($output, $header, "\t", '"', "\\");

        foreach ($data as $row) {
            // DODANY PARAMETR ESCAPE
            fputcsv($output, $row, "\t", '"', "\\");
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }
}