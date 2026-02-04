/**
 * State - Encapsulated global state management
 * Replaces the scattered arrays from terrain.js with a single,
 * well-organized state container
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} z - Z coordinate
 * @property {number} radius - Collision radius
 */

class State {
    constructor() {
        // Entity collections
        this._houses = [];
        this._agents = [];
        this._trees = [];
        this._files = [];
        this._flowers = [];
        this._bushes = [];
        this._rocks = [];
        this._animals = [];
        this._insects = [];
        this._fields = [];
        this._fieldSigns = [];

        // Additional vegetation
        this._tallGrass = [];
        this._mushrooms = [];

        // Position tracking
        this._occupiedPositions = [];

        // House slot management
        this._nextHouseIndex = 0;
        this._houseSlots = null;

        // Field placement
        this._nextFieldIndex = 0;

        // Special references
        this._headquarters = null;
        this._pondWater = null;
        this._pondWaterData = null;
    }

    // ==================== HOUSES ====================
    get houses() { return this._houses; }
    addHouse(house) { this._houses.push(house); }
    removeHouse(house) {
        const idx = this._houses.indexOf(house);
        if (idx > -1) this._houses.splice(idx, 1);
    }

    // ==================== AGENTS ====================
    get agents() { return this._agents; }
    addAgent(agent) { this._agents.push(agent); }
    removeAgent(agent) {
        const idx = this._agents.indexOf(agent);
        if (idx > -1) this._agents.splice(idx, 1);
    }
    findAgentById(id) {
        return this._agents.find(a => a.userData.id === id);
    }

    // ==================== TREES ====================
    get trees() { return this._trees; }
    addTree(tree) { this._trees.push(tree); }
    removeTree(tree) {
        const idx = this._trees.indexOf(tree);
        if (idx > -1) this._trees.splice(idx, 1);
    }
    removeTreeAt(index) {
        if (index >= 0 && index < this._trees.length) {
            return this._trees.splice(index, 1)[0];
        }
        return null;
    }

    // ==================== FILES ====================
    get files() { return this._files; }
    addFile(file) { this._files.push(file); }
    removeFile(file) {
        const idx = this._files.indexOf(file);
        if (idx > -1) this._files.splice(idx, 1);
    }

    // ==================== FLOWERS ====================
    get flowers() { return this._flowers; }
    addFlower(flower) { this._flowers.push(flower); }
    removeFlower(flower) {
        const idx = this._flowers.indexOf(flower);
        if (idx > -1) this._flowers.splice(idx, 1);
    }

    // ==================== BUSHES ====================
    get bushes() { return this._bushes; }
    addBush(bush) { this._bushes.push(bush); }
    removeBush(bush) {
        const idx = this._bushes.indexOf(bush);
        if (idx > -1) this._bushes.splice(idx, 1);
    }

    // ==================== ROCKS ====================
    get rocks() { return this._rocks; }
    addRock(rock) { this._rocks.push(rock); }
    removeRock(rock) {
        const idx = this._rocks.indexOf(rock);
        if (idx > -1) this._rocks.splice(idx, 1);
    }

    // ==================== ANIMALS ====================
    get animals() { return this._animals; }
    addAnimal(animal) { this._animals.push(animal); }
    removeAnimal(animal) {
        const idx = this._animals.indexOf(animal);
        if (idx > -1) this._animals.splice(idx, 1);
    }

    // ==================== INSECTS ====================
    get insects() { return this._insects; }
    addInsect(insect) { this._insects.push(insect); }
    removeInsect(insect) {
        const idx = this._insects.indexOf(insect);
        if (idx > -1) this._insects.splice(idx, 1);
    }

    // ==================== FIELDS ====================
    get fields() { return this._fields; }
    addField(field) { this._fields.push(field); }
    removeField(field) {
        const idx = this._fields.indexOf(field);
        if (idx > -1) this._fields.splice(idx, 1);
    }
    findFieldById(id) {
        return this._fields.find(f => f.userData.id === id);
    }

    // ==================== FIELD SIGNS ====================
    get fieldSigns() { return this._fieldSigns; }
    addFieldSign(sign) { this._fieldSigns.push(sign); }
    removeFieldSign(sign) {
        const idx = this._fieldSigns.indexOf(sign);
        if (idx > -1) this._fieldSigns.splice(idx, 1);
    }

    // ==================== ADDITIONAL VEGETATION ====================
    get tallGrass() { return this._tallGrass; }
    addTallGrass(grass) { this._tallGrass.push(grass); }

    get mushrooms() { return this._mushrooms; }
    addMushroom(mushroom) { this._mushrooms.push(mushroom); }

    // ==================== POSITION TRACKING ====================
    get occupiedPositions() { return this._occupiedPositions; }

    /**
     * Register a position as occupied
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} radius - Collision radius
     */
    registerPosition(x, z, radius) {
        this._occupiedPositions.push({ x, z, radius });
    }

    /**
     * Check if a position is free (not occupied)
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} radius - Required radius
     * @param {boolean} [excludeFarm=false] - Exclude farm zone
     * @param {Object} [farmZone] - Farm zone bounds
     * @returns {boolean} True if position is free
     */
    isPositionFree(x, z, radius, excludeFarm = false, farmZone = null) {
        if (excludeFarm && farmZone) {
            if (x > farmZone.minX && x < farmZone.maxX &&
                z > farmZone.minZ && z < farmZone.maxZ) {
                return false;
            }
        }

        for (const pos of this._occupiedPositions) {
            const dx = pos.x - x;
            const dz = pos.z - z;
            const minDist = radius + pos.radius;
            if (dx * dx + dz * dz < minDist * minDist) {
                return false;
            }
        }

        return true;
    }

    // ==================== HOUSE SLOT MANAGEMENT ====================
    get nextHouseIndex() { return this._nextHouseIndex; }
    set nextHouseIndex(val) { this._nextHouseIndex = val; }

    get houseSlots() { return this._houseSlots; }
    set houseSlots(slots) { this._houseSlots = slots; }

    // ==================== FIELD PLACEMENT ====================
    get nextFieldIndex() { return this._nextFieldIndex; }
    set nextFieldIndex(val) { this._nextFieldIndex = val; }
    incrementFieldIndex() { return this._nextFieldIndex++; }

    // ==================== SPECIAL REFERENCES ====================
    get headquarters() { return this._headquarters; }
    set headquarters(hq) { this._headquarters = hq; }

    get pondWater() { return this._pondWater; }
    set pondWater(water) { this._pondWater = water; }

    get pondWaterData() { return this._pondWaterData; }
    set pondWaterData(data) { this._pondWaterData = data; }

    // ==================== COLLISION HELPERS ====================
    /**
     * Check if position collides with existing houses
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} [minSpacing=16] - Minimum spacing
     * @returns {boolean} True if collides
     */
    collidesWithHouses(x, z, minSpacing = 16) {
        for (const house of this._houses) {
            const hd = house.userData;
            const dx = hd.x - x;
            const dz = hd.z - z;
            if (Math.sqrt(dx * dx + dz * dz) < minSpacing) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if position collides with existing fields
     * @param {number} x - X coordinate
     * @param {number} z - Z coordinate
     * @param {number} [padding=2] - Extra padding
     * @returns {boolean} True if collides
     */
    collidesWithFields(x, z, padding = 2) {
        for (const field of this._fields) {
            const fd = field.userData;
            const halfW = (fd.width || 10) / 2 + padding;
            const halfD = (fd.depth || 10) / 2 + padding;

            if (x > fd.x - halfW && x < fd.x + halfW &&
                z > fd.z - halfD && z < fd.z + halfD) {
                return true;
            }
        }
        return false;
    }

    // ==================== STATS ====================
    /**
     * Get count statistics
     * @returns {Object} Counts for each entity type
     */
    getStats() {
        return {
            houses: this._houses.length,
            agents: this._agents.length,
            trees: this._trees.length,
            files: this._files.length,
            flowers: this._flowers.length,
            bushes: this._bushes.length,
            rocks: this._rocks.length,
            animals: this._animals.length,
            insects: this._insects.length,
            fields: this._fields.length,
            flora: this._flowers.length + this._bushes.length
        };
    }

    // ==================== RESET ====================
    /**
     * Clear all state (useful for testing)
     */
    reset() {
        this._houses = [];
        this._agents = [];
        this._trees = [];
        this._files = [];
        this._flowers = [];
        this._bushes = [];
        this._rocks = [];
        this._animals = [];
        this._insects = [];
        this._fields = [];
        this._fieldSigns = [];
        this._tallGrass = [];
        this._mushrooms = [];
        this._occupiedPositions = [];
        this._nextHouseIndex = 0;
        this._houseSlots = null;
        this._nextFieldIndex = 0;
        this._headquarters = null;
        this._pondWater = null;
        this._pondWaterData = null;
    }
}

// Export singleton instance
export const state = new State();

// Also export the class for testing
export { State };
