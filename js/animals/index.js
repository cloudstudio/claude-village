/**
 * Animals module index - re-exports all animal creation functions
 */

// Farm animals
export { createChicken } from './farm/Chicken.js';
export { createSheep } from './farm/Sheep.js';
export { createPig } from './farm/Pig.js';

// Flying animals
export { createButterfly } from './flying/Butterfly.js';
export { createBird } from './flying/Bird.js';
export { createBee } from './flying/Bee.js';

// Wild animals
export { createFox } from './wild/Fox.js';
export { createRabbit } from './wild/Rabbit.js';
export { createDeer } from './wild/Deer.js';
export { createSquirrel } from './wild/Squirrel.js';
export { createFrog } from './wild/Frog.js';

// Spawner
export { spawnAnimals } from './spawn.js';
