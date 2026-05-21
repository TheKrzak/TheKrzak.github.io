<?php // I:\ptw\lab-f\yaml.php

$data = [
    'name' => 'Artur Karczmarczyk',
    'index' => '3346',
    'date' => date(DATE_ATOM),
];

$yaml = yaml_emit($data);

echo $yaml;