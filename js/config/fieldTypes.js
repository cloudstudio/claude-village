/**
 * Field types and configuration
 */

// Field types for work areas
export const FieldTypes = {
    ORCHARD: 'orchard',      // Frutal (trees with fruits)
    RICE: 'rice',            // Rice paddy (water + plants)
    WHEAT: 'wheat',          // Wheat field (stalks)
    VEGETABLE: 'vegetable',  // Vegetable garden (varied)
    VINEYARD: 'vineyard',    // Vineyard (vines in rows)
};

// Field configuration per type - each can have its own size
export const fieldConfig = {
    [FieldTypes.ORCHARD]: {
        width: 10,
        depth: 10,
        rows: 3,
        cols: 3,
        workAnimation: 'harvest'
    },
    [FieldTypes.RICE]: {
        width: 9,
        depth: 9,
        rows: 4,
        cols: 5,
        workAnimation: 'plant'
    },
    [FieldTypes.WHEAT]: {
        width: 10,
        depth: 8,
        rows: 5,
        cols: 6,
        workAnimation: 'harvest'
    },
    [FieldTypes.VEGETABLE]: {
        width: 8,
        depth: 8,
        rows: 4,
        cols: 4,
        workAnimation: 'tend'
    },
    [FieldTypes.VINEYARD]: {
        width: 10,
        depth: 9,
        rows: 3,
        cols: 5,
        workAnimation: 'prune'
    }
};
