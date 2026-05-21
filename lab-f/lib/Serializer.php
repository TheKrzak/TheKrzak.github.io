<?php
namespace App;

use App\Encoder\EncoderInterface;

class Serializer {
    private $encoders = [];

    public function addEncoder(EncoderInterface $encoder) {
        $this->encoders[] = $encoder;
    }

    public function deserialize(string $data, string $format): array {
        foreach ($this->encoders as $encoder) {
            if ($encoder->supports($format)) {
                return $encoder->decode($data);
            }
        }
        return [];
    }

    public function serialize(array $data, string $format): string {
        foreach ($this->encoders as $encoder) {
            if ($encoder->supports($format)) {
                return $encoder->encode($data);
            }
        }
        return "";
    }
}