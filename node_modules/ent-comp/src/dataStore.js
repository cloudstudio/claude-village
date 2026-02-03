

/*
 * 
 *      Encapsulates (mostly) a collection of objects, 
 *      exposed both as a hash and as an array
 *      _map maps hash id to list index
 * 
 *      Note this is a dumb store, it doesn't check any inputs at all.
 *      It also assumes every stored data object is stored like:
 *          dataStore.add(37, {__id:37} )
 * 
*/


module.exports = class DataStore {

    constructor() {
        this.list = []
        this.hash = {}
        this._map = {}
        this._pendingRemovals = []
    }


    // add a new state object
    add(id, stateObject) {
        if (typeof this._map[id] === 'number') {
            // this happens if id is removed/readded without flushing
            var index = this._map[id]
            this.hash[id] = stateObject
            this.list[index] = stateObject
        } else {
            this._map[id] = this.list.length
            this.hash[id] = stateObject
            this.list.push(stateObject)
        }
    }


    // remove - nulls the state object, actual removal comes later
    remove(id) {
        var index = this._map[id]
        this.hash[id] = null
        this.list[index] = null
        this._pendingRemovals.push(id)
    }


    // just sever references
    dispose() {
        this.list = null
        this.hash = null
        this._map = null
        this._pendingRemovals.length = 0
    }


    // deletes removed objects from data structures
    flush() {
        for (var i = 0; i < this._pendingRemovals.length; i++) {
            var id = this._pendingRemovals[i]
            // removal might have been reversed, or already handled
            if (this.hash[id] !== null) continue
            removeElement(this, id)
        }
        this._pendingRemovals.length = 0
    }

}


/*
 * 
 *      actual remove / cleanup logic, fixes up data structures after removal
 * 
 * 
*/


function removeElement(data, id) {
    // current location of this element in the list
    var index = data._map[id]
    // for hash and map, just delete by id
    delete data.hash[id]
    delete data._map[id]
    // now splice - either by popping or by swapping with final element
    if (index === data.list.length - 1) {
        data.list.pop()
    } else {
        // swap last item with the one we're removing
        var swapped = data.list.pop()
        data.list[index] = swapped
        // need to fix _map for swapped item
        if (swapped === null || swapped[0] === null) {
            // slowest but rarest case - swapped item is ALSO pending removal
            var prevIndex = data.list.length
            for (var swapID in data._map) {
                if (data._map[swapID] === prevIndex) {
                    data._map[swapID] = index
                    return
                }
            }
        } else {
            var swappedID = swapped.__id || swapped[0].__id
            data._map[swappedID] = index
        }
    }
}


