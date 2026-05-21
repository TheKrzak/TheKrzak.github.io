<?php
namespace App\Encoder;

class YamlEncoder implements EncoderInterface {
    public function supports(string $format): bool {
        return $format === 'yml' || $format === 'yaml';
    }

    public function decode(string $data): array {
        if (empty(trim($data))) return [];
        return yaml_parse($data);
    }

    public function encode(array $data): string {
        if (empty($data)) return "";
        return yaml_emit($data);
    }
}