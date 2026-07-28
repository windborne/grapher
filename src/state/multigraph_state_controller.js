import Eventable from '../eventable.js';
import getColor, {LINE_COLORS} from '../helpers/colors.js';
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
        this._nextMultigrapherSeriesIndex = 0;
        this._graphIds = [];
        this._nextGraphId = 0;

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
        if (this.disposed) {
            return;
        }

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

        const currentSeriesSet = new Set(series);

        // prune bookkeeping for series that are no longer present, freeing their colors
        for (let [originalSeries, modifiedSeries] of [...this._modifiedSeries]) {
            if (!currentSeriesSet.has(originalSeries)) {
                this._modifiedSeries.delete(originalSeries);
                this._originalSeriesByMultigrapherIndex.delete(modifiedSeries.multigrapherSeriesIndex);
                this._seriesToGraphIndices.delete(originalSeries);
            }
        }

        // group by graph: a graph the series was previously placed in (e.g. by dragging)
        // wins over the graph requested in the series definition
        const graphBuckets = new Map();

        for (let singleSeries of series) {
            let graphIndex = singleSeries.graph || 0;

            if (this._seriesToGraphIndices.has(singleSeries)) {
                graphIndex = this._seriesToGraphIndices.get(singleSeries);
            }

            graphIndex = parseInt(graphIndex);
            if (!Number.isFinite(graphIndex) || graphIndex < 0) {
                graphIndex = 0;
            }

            let bucket = graphBuckets.get(graphIndex);
            if (!bucket) {
                bucket = [];
                graphBuckets.set(graphIndex, bucket);
            }

            bucket.push(singleSeries);
        }

        const sortedGraphIndices = [...graphBuckets.keys()].sort((a, b) => a - b);

        const usedColors = new Set();
        for (let singleSeries of series) {
            const modifiedSeries = this._modifiedSeries.get(singleSeries);
            if (modifiedSeries) {
                usedColors.add(modifiedSeries.color);
            }
        }

        this._multiSeries = [];

        for (let graphIndex of sortedGraphIndices) {
            const graphSeries = [];

            for (let singleSeries of graphBuckets.get(graphIndex)) {
                let modifiedSeries = this._modifiedSeries.get(singleSeries);

                if (!modifiedSeries) {
                    const seriesIndex = this._nextMultigrapherSeriesIndex++;
                    const color = this._pickColor(singleSeries, seriesIndex, usedColors);
                    usedColors.add(color);

                    modifiedSeries = {
                        ...singleSeries,
                        multigrapherSeriesIndex: seriesIndex,
                        color,
                        name: nameForSeries(singleSeries, seriesIndex)
                    };

                    this._modifiedSeries.set(singleSeries, modifiedSeries);
                    this._originalSeriesByMultigrapherIndex.set(seriesIndex, singleSeries);
                }

                graphSeries.push(modifiedSeries);
            }

            this._multiSeries.push(graphSeries);
        }

        this._renumberGraphs();

        this.emit('multi_series_changed', this.multiSeries);
    }

    /**
     * Picks a color for a new series: an explicitly requested one if present,
     * otherwise the first line color not currently in use
     *
     * @param {Object} singleSeries
     * @param {Number} seriesIndex
     * @param {Set<String>} usedColors
     * @return {String}
     * @private
     */
    _pickColor(singleSeries, seriesIndex, usedColors) {
        if (typeof singleSeries.color === 'string' || typeof singleSeries.color === 'number') {
            return getColor(singleSeries.color, seriesIndex);
        }

        for (let color of LINE_COLORS) {
            if (!usedColors.has(color)) {
                return color;
            }
        }

        return getColor(undefined, seriesIndex);
    }

    /**
     * Restores the invariants after any change to _multiSeries:
     * no empty graphs, and every series' multigrapherGraphIndex matches the
     * position of its graph so drop targets (which are identified by rendered
     * position) always resolve to the right graph
     *
     * @private
     */
    _renumberGraphs() {
        const keptSeries = [];
        const keptIds = [];
        for (let i = 0; i < this._multiSeries.length; i++) {
            if (!this._multiSeries[i].length) {
                continue;
            }

            keptSeries.push(this._multiSeries[i]);
            keptIds.push(this._graphIds[i] !== undefined ? this._graphIds[i] : this._nextGraphId++);
        }
        this._multiSeries = keptSeries;
        this._graphIds = keptIds;

        this._graphIndicesToSeries = new Map();
        this._seriesToGraphIndices = new Map();

        for (let graphIndex = 0; graphIndex < this._multiSeries.length; graphIndex++) {
            const originalSeriesSet = new Set();

            for (let modifiedSeries of this._multiSeries[graphIndex]) {
                modifiedSeries.multigrapherGraphIndex = graphIndex;

                const originalSeries = this._originalSeriesByMultigrapherIndex.get(modifiedSeries.multigrapherSeriesIndex);
                if (originalSeries) {
                    originalSeriesSet.add(originalSeries);
                    this._seriesToGraphIndices.set(originalSeries, graphIndex);
                }
            }

            this._graphIndicesToSeries.set(graphIndex, originalSeriesSet);
        }
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
        if (!modifiedSeries) {
            return;
        }

        // remove it from whichever graph currently holds it
        // (searched rather than indexed so a stale multigrapherGraphIndex can never desync us)
        for (let graphSeries of this._multiSeries) {
            const seriesPosition = graphSeries.indexOf(modifiedSeries);
            if (seriesPosition !== -1) {
                graphSeries.splice(seriesPosition, 1);
            }
        }

        // note: the source graph may now be empty, but it must keep its position
        // until after the target is resolved, since numeric drop targets refer to
        // the positions that were rendered when the drag started
        let targetSeries;
        if (graphIndex === 'top') {
            targetSeries = [];
            this._multiSeries.unshift(targetSeries);
            this._graphIds.unshift(this._nextGraphId++);
        } else if (graphIndex === 'bottom') {
            targetSeries = [];
            this._multiSeries.push(targetSeries);
            this._graphIds.push(this._nextGraphId++);
        } else {
            targetSeries = this._multiSeries[parseInt(graphIndex)];
            if (!targetSeries) {
                targetSeries = [];
                this._multiSeries.push(targetSeries);
                this._graphIds.push(this._nextGraphId++);
            }
        }
        targetSeries.push(modifiedSeries);

        modifiedSeries.axisIndex = axisIndex;
        // safe because stateController operates on a copy. We could also have changed the identify of modifiedSeries,
        // but with that we might reset data when moving it back
        delete modifiedSeries.axis;

        // fresh array identities so react and the child state controllers pick up the change
        this._multiSeries = this._multiSeries.map((graphSeries) => [...graphSeries]);
        this._renumberGraphs();

        this.emit('multi_series_changed', this.multiSeries);
        this.emit('graph_count_changed', this.graphCount, prevGraphCount);
    }

    get multiSeries() {
        return this._multiSeries.filter((series) => series.length);
    }

    /**
     * A stable identity for the graph at the given position, usable as a react
     * key so existing graphs don't remount when one is added above them
     *
     * @param {Number} graphIndex
     * @return {Number}
     */
    graphKeyAt(graphIndex) {
        return this._graphIds[graphIndex] !== undefined ? this._graphIds[graphIndex] : graphIndex;
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
        if (this.disposed) {
            return;
        }
        this.disposed = true;

        this.clearListeners();

        for (let listener of this._subscriptions.values()) {
            listener.unsubscribe();
        }

        this._subscriptions.clear();
        this._stateControllers.clear();
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
