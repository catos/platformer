# Refs

## Platformer examples

- https://github.com/jakesgordon/javascript-tiny-platformer

## ECS

- https://itnext.io/entity-component-system-in-action-with-typescript-f498ca82a08e
- https://maxwellforbes.com/posts/typescript-ecs-implementation
- https://github.com/grebaldi/nopun-ecs
- https://ecsy.io/docs/#/
- https://blog.mozvr.com/introducing-ecsy/
- https://medium.com/ingeniouslysimple/entities-components-and-systems-89c31464240d

### Collision

- Rectangle collision: https://www.youtube.com/watch?v=LYrge3ylccQ&ab_channel=PothOnProgramming
- Collision detection: https://spicyyoghurt.com/tutorials/html5-javascript-game-development/collision-detection-physics

## PHYSICS & COLLISION

- https://spicyyoghurt.com/tutorials/html5-javascript-game-development/collision-detection-physics

## EXAMPLES

https://www.youtube.com/watch?v=kpiO5-BtX4I&t=2258s&ab_channel=ArmadaJS-JavaScriptconference

- https://github.com/jamesseanwright/ts-pac-man/tree/master/src

How To Make A JavaScript Platformer

- https://www.youtube.com/watch?v=opiWzi0KWjs&list=PLcN6MkgfgN4CpMUgWEM5d70ANMWgcmBp8&index=2&ab_channel=PothOnProgramming

# Structure

## Components
- Position          [position]
- Velocity          [speed, velocity]
- Input             [left, right, up, down]
- BoxCollider       [size, collision]
- Shape             [size, color]

## Entities
- Player            [Position, Shape, Velocity, Input, BoxCollider]
- Tiles             [Position, Shape, BoxCollider]
- Decoration        [Position, Shape, BoxCollider]
- NPC               [Position, Shape, Velocity, BoxCollider]

## Systems
- Movement          []
- ShapeRenderer     [BoxShape, Position]
- InputSystem       [Input]
- MovementSystem    [Position, Velocity]
- CollisionSystem   [BoxCollider, Position]
- DebugInfo         []

# TODO

- Finish debugsystem, where to put code ? scene ? game ? ...systems ?
- NPC & collision
- Coin & collision with different response
- Projectile weapon
- Design a level
