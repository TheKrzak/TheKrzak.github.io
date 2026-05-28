<?php
require_once __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'autoload.php';

$config = new \App\Service\Config();

$templating = new \App\Service\Templating();
$router = new \App\Service\Router();

$action = $_REQUEST['action'] ?? null;
switch ($action) {
    // ---------- Post ----------
    case 'post-index':
    case null:
        $controller = new \App\Controller\PostController();
        $view = $controller->indexAction($templating, $router);
        break;
    case 'post-create':
        $controller = new \App\Controller\PostController();
        $view = $controller->createAction($_REQUEST['post'] ?? null, $templating, $router);
        break;
    case 'post-edit':
        if (!$_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\PostController();
        $view = $controller->editAction($_REQUEST['id'], $_REQUEST['post'] ?? null, $templating, $router);
        break;
    case 'post-show':
        if (!$_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\PostController();
        $view = $controller->showAction($_REQUEST['id'], $templating, $router);
        break;
    case 'post-delete':
        if (!$_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\PostController();
        $view = $controller->deleteAction($_REQUEST['id'], $router);
        break;

    // ---------- Car ----------
    case 'car-index':
        $controller = new \App\Controller\CarController();
        $view = $controller->indexAction($templating, $router);
        break;
    case 'car-create':
        $controller = new \App\Controller\CarController();
        $view = $controller->createAction($_REQUEST['car'] ?? null, $templating, $router);
        break;
    case 'car-edit':
        if (!$_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\CarController();
        $view = $controller->editAction((int)$_REQUEST['id'], $_REQUEST['car'] ?? null, $templating, $router);
        break;
    case 'car-show':
        if (!$_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\CarController();
        $view = $controller->showAction((int)$_REQUEST['id'], $templating, $router);
        break;
    case 'car-delete':
        if (!$_REQUEST['id']) {
            break;
        }
        $controller = new \App\Controller\CarController();
        $view = $controller->deleteAction((int)$_REQUEST['id'], $router);
        break;

    // ---------- Info ----------
    case 'info':
        $controller = new \App\Controller\InfoController();
        $view = $controller->infoAction();
        break;

    default:
        $view = 'Not found';
        break;
}

if ($view) {
    echo $view;
}
