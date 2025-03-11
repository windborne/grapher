import Eventable from '../eventable.js';
import getColor from '../helpers/colors.js';
import nameForSeries from '../helpers/name_for_series.js';

export default class MultigraphStateController extends Eventable {

    constructor({ id }) {
        super();

        this._id = id;

        this._multiSeries = [];
        this._seriesToGraphIndices = new Map();
        this._graphIndicesToSeries = new Map();
        this._modifiedSeries = new Map();
        this._originalSeriesByMultigrapherIndex = new Map();
        this._stateControllers = new Set();
        this._prevSeries = [];

        this._dataCache = new Map();
        this._subscriptions = new Map();

        this._draggingY = false;

        this.on('multi_series_changed', () => {
            for (let stateController of this._stateControllers) {
                stateController._multiSeries = this._multiSeries;
            }
        });
    }

    /**
     * Takes an  array of user-supplied series, then splits, modifies, and broadcasts them
     *
     * @param {Array<Object>} series
     */
    setSeries(series) {

        if (this._prevSeries.length === series.length) {
            let anyDifferent = false;
            for (let i = 0; i < series.length; i++) {
                if (series[i] !== this._prevSeries[i]) {
                    anyDifferent = true;
                    break;
                }
            }

            if (!anyDifferent) {
                return;
            }
        }

        this._prevSeries = series;

        const graphIndices = new Set();
        const currentSeriesSet = new Set(series);

        for (let singleSeries of series) {
            let graphIndex = singleSeries.graph || 0;

            if (this._seriesToGraphIndices.has(singleSeries)) {
                graphIndex = this._seriesToGraphIndices.get(singleSeries);
            }

            graphIndices.add(graphIndex);

            let seriesSet = this._graphIndicesToSeries.get(graphIndex);
            if (!seriesSet) {
                seriesSet = new Set();
                this._graphIndicesToSeries.set(graphIndex, seriesSet);
            }

            seriesSet.add(singleSeries);
        }

        const sortedGraphIndices = [...graphIndices].sort();

        this._multiSeries = [];
        let globalSeriesIndex = 0;

        for (let graphIndex of sortedGraphIndices) {
            const series = [];

            for (let singleSeries of this._graphIndicesToSeries.get(graphIndex)) {
                if (!currentSeriesSet.has(singleSeries)) {
                    this._graphIndicesToSeries.get(graphIndex).delete(singleSeries);
                    continue;
                }

                if (this._modifiedSeries.has(singleSeries)) {
                    globalSeriesIndex++;
                    series.push(this._modifiedSeries.get(singleSeries));
                    continue;
                }

                const color = getColor(singleSeries.color, globalSeriesIndex);
                const name = nameForSeries(singleSeries, globalSeriesIndex);
                const modifiedSeries = {
                    ...singleSeries,
                    multigrapherSeriesIndex: globalSeriesIndex,
                    multigrapherGraphIndex: graphIndex,
                    color,
                    name
                };

                this._modifiedSeries.set(singleSeries, modifiedSeries);
                this._originalSeriesByMultigrapherIndex.set(globalSeriesIndex, singleSeries);

                globalSeriesIndex++;
                series.push(modifiedSeries);
            }

            this._multiSeries.push(series);
        }

        if (this._nextMultigrapherSeriesIndex) {
            this._nextMultigrapherSeriesIndex = this._nextMultigrapherSeriesIndex - this._multiSeriesCount + globalSeriesIndex;
        } else {
            this._nextMultigrapherSeriesIndex = globalSeriesIndex;
        }
        this._multiSeriesCount = globalSeriesIndex;

        this.emit('multi_series_changed', this.multiSeries);
    }

    /**
     * Registers a state controller for series switching
     *
     * @param {StateController} stateController
     */
    registerStateController(stateController) {
        if (this._stateControllers.has(stateController)) {
            return;
        }

        this._stateControllers.add(stateController);
        stateController._multigraphStateController = this;
        stateController._multiSeries = this._multiSeries;

        stateController.on('dragging_y_finalized', ({ grapherID, axisIndex, draggedSeries }={}) => {
            if (grapherID === stateController.grapherID) {
                return;
            }

            const [check, multigrapherID, graphIndex] = grapherID.split('-');
            if (check !== 'multigrapher' || multigrapherID !== this._id) {
                return;
            }

            setTimeout(() => {
                this.moveSeries({ axisIndex, draggedSeries, graphIndex });
            });
        });

        stateController.on('dragging_y_changed', (draggingY) => {
            if (draggingY === this._draggingY) {
                return;
            }

            this._draggingY = draggingY;
            this.emit('dragging_y_changed', this._draggingY);
        });

        stateController.on('observable_modified', (observable) => {
            for (let otherStateController of this._stateControllers) {
                if (stateController === otherStateController) {
                    continue;
                }

                otherStateController.markObservableModified(observable);
            }
        });

        stateController.on('dispose', () => {
            this._stateControllers.delete(stateController);
        });
    }

    /**
     * Moves the given dragged series (as specified by the child state controller) to a different graph
     *
     * @param {String} axisIndex        - the axis index on the new graph to move the series to
     * @param {Object} draggedSeries    - the series that got dragged. Different identity than what this may access
     * @param {String} graphIndex       - the index of the graph to assign it to
     */
    moveSeries({ axisIndex, draggedSeries, graphIndex }) {
        const prevGraphCount = this.graphCount;

        const originalSeries = this._originalSeriesByMultigrapherIndex.get(draggedSeries.multigrapherSeriesIndex);
        const modifiedSeries = this._modifiedSeries.get(originalSeries);

        this._multiSeries[modifiedSeries.multigrapherGraphIndex].splice(
            this._multiSeries[modifiedSeries.multigrapherGraphIndex].indexOf(modifiedSeries), 1
        );
        this._multiSeries[modifiedSeries.multigrapherGraphIndex] = [...this._multiSeries[modifiedSeries.multigrapherGraphIndex]];

        if (graphIndex === 'top') {
            modifiedSeries.multigrapherGraphIndex = this._createGraphAtTop();
        } else if (graphIndex === 'bottom') {
            modifiedSeries.multigrapherGraphIndex = this._createGraphAtBottom();
        } else {
            modifiedSeries.multigrapherGraphIndex = parseInt(graphIndex);
        }

        modifiedSeries.axisIndex = axisIndex;
        // safe because stateController operates on a copy. We could also have changed the identify of modifiedSeries,
        // but with that we might reset data when moving it back
        delete modifiedSeries.axis;

        this._multiSeries[modifiedSeries.multigrapherGraphIndex] = [...this._multiSeries[modifiedSeries.multigrapherGraphIndex], modifiedSeries];
        this._multiSeries = [...this._multiSeries];

        for (let graphIndex = 0; graphIndex < this._multiSeries.length; graphIndex++) {
            const originalSeriesAtIndex = this._multiSeries[graphIndex].map(({ multigrapherSeriesIndex  }) =>
                this._originalSeriesByMultigrapherIndex.get(multigrapherSeriesIndex));
            this._graphIndicesToSeries.set(graphIndex, new Set(originalSeriesAtIndex));

            for (let singleSeries of originalSeriesAtIndex) {
                this._seriesToGraphIndices.set(singleSeries, graphIndex);
            }
        }

        this.emit('multi_series_changed', this.multiSeries);
        this.emit('graph_count_changed', this.graphCount, prevGraphCount);
    }

    /**
     * Finds or creates an empty graph at the beginning and returns its index
     *
     * @return {number}
     * @private
     */
    _createGraphAtTop() {
        // check if there's anything at the beginning already
        let emptyAtTopIndex = null;

        for (let i = 0; i < this._multiSeries.length; i++) {
            if (this._multiSeries[i].length === 0) {
                emptyAtTopIndex = i;
            } else {
                break;
            }
        }

        if (emptyAtTopIndex !== null) {
            return emptyAtTopIndex;
        }

        // add a series at the beginning and mutate the graph index of each
        this._multiSeries = [[], ...this._multiSeries];
        for (let graphIndex = 0; graphIndex < this._multiSeries.length; graphIndex++) {
            if (!this._multiSeries[graphIndex].length) {
                continue;
            }

            this._multiSeries[graphIndex] = [...this._multiSeries[graphIndex]];

            for (let modifiedSeries of this._multiSeries[graphIndex]) {
                modifiedSeries.multigrapherGraphIndex = graphIndex;
            }
        }

        return 0;
    }

    /**
     * Finds or creates an empty graph at the end and returns its index
     *
     * @return {number}
     * @private
     */
    _createGraphAtBottom() {
        // check if there's anything at the beginning already
        let emptyAtBottomIndex = null;

        for (let i = this._multiSeries.length - 1; i >= 0; i--) {
            if (this._multiSeries[i].length === 0) {
                emptyAtBottomIndex = i;
            } else {
                break;
            }
        }

        if (emptyAtBottomIndex !== null) {
            return emptyAtBottomIndex;
        }

        // add something at the bottom
        this._multiSeries = [...this._multiSeries, []];

        return this._multiSeries.length - 1;
    }

    get multiSeries() {
        return this._multiSeries.filter((series) => series.length);
    }

    get series() {
        return [...this._stateControllers].map((stateController) => stateController.series).flat();
    }

    get graphCount() {
        return this.multiSeries.length;
    }

    get draggingY() {
        return this._draggingY;
    }

    dispose() {
        this.clearListeners();

        for (let listener of this._subscriptions.values()) {
            listener.unsubscribe();
        }

        this._subscriptions.clear();
    }

    get stateControllerInitialization() {
        return {
            sharedDataCache: this._dataCache,
            sharedSubscriptions: this._subscriptions
        };
    }

    incrementMultigrapherSeriesIndex() {
        const index = this._nextMultigrapherSeriesIndex;

        this._nextMultigrapherSeriesIndex ++;

        return index;
    }
}
