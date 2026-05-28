<?php
namespace App\Controller;

use App\Exception\NotFoundException;
use App\Model\Car;
use App\Service\Router;
use App\Service\Templating;

class CarController
{
    public function indexAction(Templating $templating, Router $router): ?string
    {
        $cars = Car::findAll();
        $html = $templating->render('car/index.html.php', [
            'cars'   => $cars,
            'router' => $router,
        ]);
        return $html;
    }

    public function createAction(?array $requestPost, Templating $templating, Router $router): ?string
    {
        if ($requestPost) {
            $car = Car::fromArray($requestPost);
            $car->save();

            $path = $router->generatePath('car-index');
            $router->redirect($path);
            return null;
        } else {
            $car = new Car();
        }

        $html = $templating->render('car/create.html.php', [
            'car'    => $car,
            'router' => $router,
        ]);
        return $html;
    }

    public function editAction(int $carId, ?array $requestPost, Templating $templating, Router $router): ?string
    {
        $car = Car::find($carId);
        if (!$car) {
            throw new NotFoundException("Missing car with id $carId");
        }

        if ($requestPost) {
            $car->fill($requestPost);
            $car->save();

            $path = $router->generatePath('car-index');
            $router->redirect($path);
            return null;
        }

        $html = $templating->render('car/edit.html.php', [
            'car'    => $car,
            'router' => $router,
        ]);
        return $html;
    }

    public function showAction(int $carId, Templating $templating, Router $router): ?string
    {
        $car = Car::find($carId);
        if (!$car) {
            throw new NotFoundException("Missing car with id $carId");
        }

        $html = $templating->render('car/show.html.php', [
            'car'    => $car,
            'router' => $router,
        ]);
        return $html;
    }

    public function deleteAction(int $carId, Router $router): ?string
    {
        $car = Car::find($carId);
        if (!$car) {
            throw new NotFoundException("Missing car with id $carId");
        }

        $car->delete();
        $path = $router->generatePath('car-index');
        $router->redirect($path);
        return null;
    }
}
