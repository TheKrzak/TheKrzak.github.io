<?php
namespace App\Encoder;

interface EncoderInterface {
    public function supports(string $format): bool;
    public function decode(string $data): array;
    public function encode(array $data): string;
}