export default class Eventable {

    constructor() {
        this._listeners = {};
    }

    /**
     * Clears all listeners
     * @protected
     */
    clearListeners() {
        this._listeners = {};
    }

    /**
     * Create a new listener for the event
     * When the event is emitted, it will call the provided function
     *
     * @param {String|symbol} eventName - the name of the event to start listening to
     * @param {Function} fn - the listener to add
     */
    on(eventName, fn) {
        this._listeners[eventName] = this._listeners[eventName] || new Set();
        this._listeners[eventName].add(fn);
    }

    /**
     * Removes an existing listener for the event
     *
     * @param {String|symbol} eventName - the name of the event to stop listening to
     * @param {Function} fn - the listener to remove
     */
    off(eventName, fn) {
        if (!this._listeners[eventName]) {
            return;
        }

        this._listeners[eventName].delete(fn);

        if (this._listeners[eventName].size === 0) {
            delete this._listeners[eventName];
        }
    }

    /**
     * Emits an event that will go out to all _listeners on eventName
     *
     * @param {String|symbol} eventName - the name of the event to emit
     */
    emit(eventName) {
        if (!this._listeners[eventName]) {
            return;
        }

        const args = [];
        for (let i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        this._listeners[eventName].forEach((fn) => {
            fn.apply(this, args);
        });
    }

}
