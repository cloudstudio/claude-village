/**
 * Core module index - exports core functionality
 */

// State management
export { state, State } from './State.js';

// Scene setup
export {
    initScene,
    createLighting,
    getScene,
    getCamera,
    getRenderer,
    getComposer,
    getControls
} from './Scene.js';

// Game loop
export {
    initGameLoop,
    setAtmosphereUpdates,
    startGameLoop,
    stopGameLoop,
    isGameLoopRunning,
    getFPS
} from './GameLoop.js';

// Engine (public API)
export {
    initEngine,
    findPosition,
    addHouse,
    addAgent,
    addField,
    startFieldTask,
    setFieldProgress,
    startHarvesting,
    stopHarvesting,
    endFieldTask,
    matureAllFields,
    toggleUI,
    exposeToWindow
} from './Engine.js';
