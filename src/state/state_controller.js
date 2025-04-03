import simpleSeriesToDataSpace from './space_conversions/simple_series_to_data_space';
import calculateDataBounds from './calculate_data_bounds';
import mergeBounds from './merge_bounds';
import expandBounds from './expand_bounds';
import selectionFromGlobalBounds from './selection_from_global_bounds';
import dataSpaceToSelectedSpace from './space_conversions/data_space_to_selected_space';
import selectedSpaceToRenderSpace from './space_conversions/selected_space_to_render_space';
import Eventable from '../eventable';
import boundCalculatorFromSelection from './bound_calculator_from_selection';
import calculateTooltipState, {toggleTooltipSaved} from './calculate_tooltip_state';
import getDefaultBoundsCalculator from './get_default_bounds_calculator';
import inferType from './infer_type';
import {SIMPLE_DATA_TYPES} from './data_types';
import generatorParamsEqual from '../helpers/generator_params_equal';
import findMatchingAxis from './find_matching_axis';
import {DPI_INCREASE} from '../renderer/size_canvas';
import {averageLoopTimes} from './average_loop_times';
import condenseDataSpace from './space_conversions/condense_data_space.js';
import calculateAnnotationsState from './calculate_annotations_state.js';
import {selectedSpaceToBackgroundSpace} from './space_conversions/selected_space_to_background_space.js';
let RustAPI;
const RustAPIPromise = import('../rust/pkg/index.js').then((module) => {
    RustAPI = module;
});

export default class StateController extends Eventable {

    constructor({ defaultBoundsCalculator, customBoundsSelectors, requireWASM, defaultShowIndividualPoints, defaultShowSidebar, defaultShowAnnotations, defaultShowOptions, syncPool, grapherID, sharedDataCache, sharedSubscriptions, fullscreen }) {
        super();

        this._requireWASM = requireWASM;
        if (requireWASM) {
            RustAPIPromise.then(() => {
                this._markDirty();
            });
        }

        this._series = [];
        this._seriesFromOriginalSeries = new Map();

        this._axes = [
            {
                series: [],
                scale: 'linear',
                side: 'left',
                axisIndex: 0
            }
        ];
        this._highlightedSeries = null;

        this._showIndividualPoints = defaultShowIndividualPoints || false;
        this._autoscaleY = true;
        this._percentile = 100;
        this._percentileAsymmetry = 0;
        this._showingOptions = defaultShowOptions;
        this._maxPrecision = false;
        this._showingSidebar = defaultShowSidebar || false;
        this._showingAnnotations = defaultShowAnnotations || false;
        this._grapherID = grapherID;
        this._fullscreen = fullscreen || false;

        this._alwaysTooltipped = new Set();
        this._tooltipState = {
            mousePresent: false,
            mouseX: 0,
            mouseY: 0,
            elementWidth: 0,
            elementHeight: 0,
            tooltips: []
        };
        this._contextMenuPosition = {
            x: 0,
            y: 0,
            showing: false,
            value: null
        };
        this._savedTooltips = [];
        this._draggingY = false;
        this._annotations = [];
        this._annotationsState = {
            elementWidth: 0,
            annotations: []
        };
        this._enumMap = {};
        this._hasXEnum = false;

        this._timingBuffer = [];
        this._timingIndex = 0;
        this._timingFrameCount = 0;

        this._modifiedSeries = new Set();
        this._deferredEmissions = {};
        this._deferredPriorityEmissions = {};
        this.primaryRenderer = null;
        this.rangeGraphRenderer = null;

        this._boundsCalculator = getDefaultBoundsCalculator(defaultBoundsCalculator, customBoundsSelectors);
        this._boundsHistory = [this._boundsCalculator];
        this._boundsIndex = 0;

        this._dataCache = sharedDataCache || new Map();
        this._subscriptions = sharedSubscriptions || new Map();
        this._subscriptionsShared = !!sharedSubscriptions;
        this._observablesToSeries = new Map();
        this._generators = new Set();
        this._generatorsToSeries = new Map();
        this._generatorCallArgs = new Map();
        this._seriesChangedFromPromises = new Set();

        this._syncPool = syncPool;
        if (this._syncPool) {
            this._syncPool.add(this);
        }

        this._onDataChange();
    }

    dispose() {
        this.emit('dispose', this);

        this.clearListeners();

        if (!this._subscriptionsShared) {
            for (let listener of this._subscriptions.values()) {
                listener.unsubscribe();
            }
            this._subscriptions.clear();
        }

        for (let singleSeries of this._series) {
            this._removeSeries(singleSeries);
        }

        if (this._syncPool) {
            this._syncPool.remove(this);
        }

        this.disposed = true;
    }

    setSeries(series) {
        const userSeries = this._series.filter((singleSeries) => singleSeries.userCreated);
        const propsSeries = this._series.filter((singleSeries) => !singleSeries.userCreated);

        if (series.length === propsSeries.length) {
            let anyDifferent = false;
            for (let i = 0; i < series.length; i++) {
                if (series[i] !== this._series[i].originalSeries) {
                    anyDifferent = true;
                    break;
                }
            }

            if (!anyDifferent) {
                return;
            }
        } else {
            this._mustResize = this._mustResize || this._fullscreen;
        }

        const newSeriesSet = new Set(series);
        for (let singleSeries of propsSeries) {
            if (!newSeriesSet.has(singleSeries.originalSeries)) {
                this._removeSeries(singleSeries);
            }
        }

        this._series.splice(0);
        for (let i = 0; i < series.length; i++) {
            const originalSeries = series[i];

            let singleSeries = this._seriesFromOriginalSeries.get(originalSeries);
            if (!singleSeries) {
                singleSeries = {
                    ...originalSeries,
                    originalSeries
                };
                this._seriesFromOriginalSeries.set(originalSeries, singleSeries);

                if (singleSeries.defaultAlwaysTooltipped) {
                    this._alwaysTooltipped.add(singleSeries);
                    this._tooltipsChanged = true;
                    this.deferredEmit('always_tooltipped_changed', this._alwaysTooltipped);
                }
            }

            singleSeries.index = i;
            this._series.push(singleSeries);
            this._assignAxisTo(singleSeries);

            if (singleSeries.hidden) {
                this._hideSeries(singleSeries);
            }
        }

        for (let i = 0; i < userSeries.length; i++) {
            const singleSeries = userSeries[i];
            singleSeries.index = i + series.length;
            this._series.push(singleSeries);
        }

        this.deferredEmit('series_changed', this._series);

        this._dataChanged = true;
        this._markDirty();
    }

    _markDirty() {
        if (this._frameRequested) {
            return;
        }

        if (this._requireWASM && !RustAPI) {
            return;
        }

        const frameRequestStart = performance.now();
        this._frameRequested = true;
        requestAnimationFrame(() => {
            if (this.disposed) {
                return;
            }

            const frameExecutionStart = performance.now();

            const dataProcessingStart = performance.now();
            if (this._dataChanged) {
                this._onDataChange();
                this._mustRerender = true;
                this._tooltipsChanged = true;
                this._annotationsChanged = true;
            } else if (this._modifiedSeries.size) {
                this._onDataAdd(this._modifiedSeries);
                this._mustRerender = true;
                this._tooltipsChanged = true;
                this._annotationsChanged = true;
            } else {
                if (this._primarySizeChanged) {
                    this._calculatePrimarySizeDependents();
                    this._mustRerender = true;
                }
                if (this._rangeGraphSizeChanged) {
                    this._calculateRangeGraphSizeDependents();
                    this._mustRerender = true;
                }
            }
            const dataProcessingEnd = performance.now();

            const renderPipelineStart = performance.now();
            if (this._mustRerender) {
                this._render();
            }
            const renderPipelineEnd = performance.now();

            const generatorsStart = performance.now();
            if (this._mustCallGenerators) {
                this._callGenerators();
            }
            const generatorsEnd = performance.now();

            const tooltipStart = performance.now();
            if (this._tooltipsChanged) {
                this._recalculateTooltips();
            }
            const tooltipEnd = performance.now();

            const contextMenuStart = performance.now();
            if (this._contextMenuChanged) {
                this._recalculateContextMenu();
            }
            const contextMenuEnd = performance.now();

            const annotationStart = performance.now();
            if (this._annotationsChanged) {
                this._recalculateAnnotations();
            }
            const annotationEnd = performance.now();

            if (this._mustResize) {
                this.primaryRenderer.resizeDebounced();
                this.rangeGraphRenderer && this.rangeGraphRenderer.resizeDebounced();
            }

            this._frameRequested = false;
            this._mustRerender = false;
            this._dataChanged = false;
            this._primarySizeChanged = false;
            this._rangeGraphSizeChanged = false;
            this._modifiedSeries.clear();
            this._seriesChangedFromPromises.clear();
            this._tooltipsChanged = false;
            this._contextMenuChanged = false;
            this._annotationsChanged = false;
            this._mustCallGenerators = false;
            this._mustResize = false;

            const callbacksStart = performance.now();
            for (let emission of [...Object.values(this._deferredPriorityEmissions), ...Object.values(this._deferredEmissions)]) {
                this.emit(...emission);
            }
            const callbacksEnd = performance.now();
            this._deferredEmissions = {};
            this._deferredPriorityEmissions = {};

            const completionTime = performance.now();
            const loopTime = {
                frameExecution: completionTime - frameExecutionStart,
                frameRequestAndExecution: completionTime - frameRequestStart,
                generators: generatorsEnd - generatorsStart,
                dataProcessing: dataProcessingEnd - dataProcessingStart,
                renderPipeline: renderPipelineEnd - renderPipelineStart,
                tooltips: tooltipEnd - tooltipStart,
                contextMenu: contextMenuEnd - contextMenuStart,
                annotations: annotationEnd - annotationStart,
                callbacks: callbacksEnd - callbacksStart
            };
            this.lastLoopTime = loopTime;
            if (this._timingFrameCount) {
                if (this._timingBuffer.length < this._timingFrameCount) {
                    this._timingBuffer.push(loopTime);
                } else {
                    this._timingBuffer[this._timingIndex % this._timingFrameCount] = loopTime;
                }
                this._timingIndex++;
            }
            this.emit('render_time', completionTime - frameExecutionStart, loopTime);
        });
    }

    deferredEmit(...args) {
        this._deferredEmissions[args[0]] = args;
    }

    deferredPriorityEmit(...args) {
        this._deferredPriorityEmissions[args[0]] = args;
    }

    _seriesToSimpleData(singleSeries) {
        const type = inferType(singleSeries);
        if (SIMPLE_DATA_TYPES.includes(type)) {
            return singleSeries.data;
        }

        // get a reference to whatever you already have
        let currentData = this._dataCache.get(singleSeries.data);

        if (currentData && this._seriesChangedFromPromises.has(singleSeries.data)) {
            return currentData;
        }

        if (!currentData) {
            currentData = [];
            this._dataCache.set(singleSeries.data, currentData);
            singleSeries.simpleData = currentData;
        }

        if (type === 'object_observable' || type === 'tuple_observable') {
            let sameDataSet = this._observablesToSeries.get(singleSeries.data);
            if (sameDataSet) {
                const firstSameDataSeries = sameDataSet.values().next().value;
                currentData = firstSameDataSeries.simpleData;
                if (!currentData) {
                    throw new Error(`Cannot find simpleData in ${firstSameDataSeries.name || firstSameDataSeries.yKey || firstSameDataSeries.data}`);
                }
                this._dataCache.set(singleSeries.data, currentData);
                singleSeries.simpleData = currentData;
            } else {
                sameDataSet = new Set();
                singleSeries.simpleData = currentData;
                this._observablesToSeries.set(singleSeries.data, sameDataSet);
            }

            sameDataSet.add(singleSeries);

            this._listenToObservableData({
                observable: singleSeries.data,
                currentData
            });
        }

        if (type === 'generator') {
            if (!this._generatorsToSeries.has(singleSeries.data)) {
                this._generatorsToSeries.set(singleSeries.data, new Set());
            }

            this._generatorsToSeries.get(singleSeries.data).add(singleSeries);

            if (!this._generators.has(singleSeries.data)) {
                this._generators.add(singleSeries.data);
                this._callGenerator(singleSeries.data);
            }
        }

        // return whatever you have; it'll fetch more in the background
        return currentData;
    }

    _listenToPromise(singleSeries, dataPromise) {
        dataPromise.then((resolved) => {
            this._dataCache.set(singleSeries.data, resolved);
            singleSeries.simpleData = resolved;
            this._seriesChangedFromPromises.add(singleSeries.data);
            this._dataChanged = true;
            this._markDirty();
        });
    }

    _listenToObservableData({ observable, currentData }) {
        if (this._subscriptions.has(observable)) { // someone else already listened to it
            return;
        }
        this._subscriptions.set(observable, true);

        // listen to the new data
        const listener = observable.observe((point) => {
            if (Array.isArray(point)) {
                for (let datum of point) {
                    currentData.push(datum);
                }
            } else {
                currentData.push(point);
            }

            this.emit('observable_modified', observable);

            this.markObservableModified(observable);
        });
        this._subscriptions.set(observable, listener);
    }

    markObservableModified(observable) {
        if (!this._observablesToSeries.has(observable)) {
            return;
        }

        for (let singleSeries of this._observablesToSeries.get(observable)) {
            this._modifiedSeries.add(singleSeries);
        }
        this._markDirty();
    }

    _unsubscribeFromStaleSeries() {
        const currentSeries = new Set(this._series);
        for (let [observable, seriesSet] of this._observablesToSeries) {
            let stillHasListener = false;

            for (let singleSeries of seriesSet) {
                if (currentSeries.has(singleSeries)) {
                    stillHasListener = true;
                    break;
                }
            }

            if (!stillHasListener) {
                this._subscriptions.get(observable).unsubscribe();
                this._subscriptions.delete(observable);
                this._observablesToSeries.delete(observable);
            }
        }

        for (let [generator, seriesSet ] of this._generatorsToSeries) {
            let stillHasSeries = false;

            for (let singleSeries of seriesSet) {
                if (currentSeries.has(singleSeries)) {
                    stillHasSeries = true;
                    break;
                }
            }

            if (!stillHasSeries) {
                this._generatorsToSeries.delete(generator);
                this._generators.delete(generator);
                this._generatorCallArgs.delete(generator);
            }
        }
    }

    async _callGenerator(generator) {
        const parameters = {
            minX: this._selection.minX,
            maxX: this._selection.maxX,
            sizing: this.primaryRenderer.sizing
        };

        if (generatorParamsEqual(this._generatorCallArgs.get(generator), parameters)) {
            return;
        }
        this._generatorCallArgs.set(generator, parameters);

        // Note: potential race condition if generator is stupid. For now, we'll rely on generator being smart
        // Race condition: a new, faster one runs before completed
        const data = await Promise.resolve(generator(parameters));

        // do nothing if the generator returned nothing
        if (!data) {
            return;
        }

        // because calling the generator may have taken some time, check that there are still listeners for it
        if (!this._generatorsToSeries.has(generator)) {
            return;
        }

        this._dataChanged = true;
        this._markDirty();

        if (typeof data.observe === 'function') {
            const currentData = [];
            this._dataCache.set(generator, currentData);
            for (let singleSeries of this._generatorsToSeries.get(generator)) {
                singleSeries.simpleData = currentData;
            }

            for (let singleSeries of this._generatorsToSeries.get(generator)) {
                if (!this._observablesToSeries.has(data)) {
                    this._observablesToSeries.set(data, new Set());
                }

                this._observablesToSeries.get(data).add(singleSeries);
            }

            this._listenToObservableData({
                observable: data,
                currentData
            });
        } else {
            this._dataCache.set(generator, data);
            for (let singleSeries of this._generatorsToSeries.get(generator)) {
                singleSeries.simpleData = data;
            }
        }
    }

    _callGenerators() {
        for (let generator of this._generators) {
            this._callGenerator(generator);
        }
    }

    _recalculateTooltips() {
        if (!this.primaryRenderer || !this.primaryRenderer.sizing) {
            return;
        }

        this._tooltipState = calculateTooltipState({
            mousePresent: this._tooltipState.mousePresent,
            mouseX: this._tooltipState.mouseX,
            mouseY: this._tooltipState.mouseY,
            sizing: this.primaryRenderer.sizing,
            series: this._series,
            alwaysTooltipped: this._alwaysTooltipped,
            savedTooltips: this._savedTooltips,
            allTooltipped: this._tooltipAllNext,
            closestSpacing: this._globalBounds.closestSpacing
        });
        this._tooltipAllNext = false;
        this.deferredEmit('tooltip_state_changed', this._tooltipState, this._tooltipStateArg);
        this._tooltipStateArg = null;
    }
    
    _recalculateContextMenu() {
        if (!this.primaryRenderer || !this.primaryRenderer.sizing) {
            return;
        }

        const boundingRect = this.primaryRenderer.boundingRect;
        const sizing = this.primaryRenderer.sizing;
        let value = null;
        let newX = null;
        
        for (let series of this._series) {
            const bounds = series.axis.currentBounds;
            
            newX = this._contextMenuPosition.x - boundingRect.left;
            
            // if it's on the right side, move it to the left one width
            if (this._contextMenuPosition.x > (boundingRect.right - sizing.elementWidth) * 2) newX -= 130;

            if (series.xKey === 'timestamp' || series.xKey === 'time' || series.xKey === 'date') {
                value = new Date((this._contextMenuPosition.x - boundingRect.left) / sizing.elementWidth * (bounds.maxX - bounds.minX) + bounds.minX);
            } else {
                value = (this._contextMenuPosition.x - boundingRect.left) / sizing.elementWidth * (bounds.maxX - bounds.minX) + bounds.minX;
            }
        }
        this._contextMenuPosition = {
            x: newX,
            y: this._contextMenuPosition.y - boundingRect.top,
            showing: this._contextMenuPosition.showing,
            value: value
        };
        this.deferredEmit('context_menu_position_changed', this._contextMenuPosition);
    }

    _recalculateAnnotations() {
        if (!this.primaryRenderer || !this.primaryRenderer.sizing) {
            return;
        }

        this._annotationsState = calculateAnnotationsState({
            annotations: this._annotations,
            series: this._series,
            sizing: this.primaryRenderer.sizing,
            selection: this._selection
        });
        this.deferredEmit('annotations_changed', this._annotationsState);
    }

    _onDataChange() {
        this._expandYWith = [];
        const dataBoundsList = [];

        for (let singleSeries of this._series) {
            if (singleSeries.hidden) {
                continue;
            }

            const simpleData = this._seriesToSimpleData(singleSeries);
            singleSeries.inDataSpace = simpleSeriesToDataSpace({
                ...singleSeries,
                data: simpleData
            }, {
                stateController: this
            });
            singleSeries.simpleDataSliceStart = simpleData.length;
            singleSeries.dataBounds = calculateDataBounds(singleSeries.inDataSpace);
            if (singleSeries.rendering === 'bar') {
                singleSeries.dataBounds = expandBounds(singleSeries.dataBounds, { extendXForNBars: singleSeries.inDataSpace.length });
            }

            dataBoundsList.push(singleSeries.dataBounds);

            if (singleSeries.expandYWith) {
                this._expandYWith.push(singleSeries.expandYWith);
            }
        }

        this._unsubscribeFromStaleSeries();

        this._dataBounds = mergeBounds(dataBoundsList);

        this._recalculateSelection({ disableSwap: true});

        for (let singleSeries of this._series) {
            if (singleSeries.hidden) {
                continue;
            }

            singleSeries.selectedBounds = calculateDataBounds(singleSeries.inSelectedSpace.data, { percentile: this._percentile, percentileAsymmetry: this._percentileAsymmetry });
            if (singleSeries.hasAreaBottom) {
                singleSeries.selectedBoundsAreaTop = singleSeries.selectedBounds;
                singleSeries.selectedBoundsAreaBottom = calculateDataBounds(singleSeries.inSelectedSpaceAreaBottom.data, { percentile: this._percentile, percentileAsymmetry: this._percentileAsymmetry });

                singleSeries.selectedBounds = mergeBounds([
                    singleSeries.selectedBoundsAreaTop,
                    singleSeries.selectedBoundsAreaBottom
                ]);
            }
        }

        this._recalculateAxisBounds();

        for (let singleSeries of this._series) {
            if (singleSeries.hidden) {
                continue;
            }

            this._calculatePrimarySizeDependents(singleSeries, { dataChanged: true });
            this._calculateRangeGraphSizeDependents(singleSeries, { dataChanged: true });
        }
    }

    _onDataAdd(modifiedSeries) {
        const newData = new Map();
        const modifiedAxes = new Set();

        const modifiedSeriesAndDependents = new Set();
        for (let singleSeries of modifiedSeries) {
            modifiedSeriesAndDependents.add(singleSeries);
        }

        for (let singleSeries of modifiedSeries) {
            modifiedAxes.add(singleSeries.axis);

            if (!singleSeries.inDataSpace) {
                throw new Error('inDataSpace must be present for onDataAdd to be called');
            }

            const simpleData = this._seriesToSimpleData(singleSeries);

            let prevY;
            if (singleSeries.inDataSpace.length) {
                prevY = singleSeries.inDataSpace[singleSeries.inDataSpace.length - 1][1];
            }

            const newDataInDataSpace = simpleSeriesToDataSpace(singleSeries, {
                data: simpleData.slice(singleSeries.simpleDataSliceStart || 0),
                valueXStart: singleSeries.inDataSpace.length,
                prevY,
                stateController: this
            });
            newData.set(singleSeries, newDataInDataSpace);
            singleSeries.simpleDataSliceStart = simpleData.length;

            if (newDataInDataSpace.length < 32) {
                singleSeries.inDataSpace.push(...newDataInDataSpace);
            } else {
                for (let point of newDataInDataSpace) {
                    singleSeries.inDataSpace.push(point);
                }
            }

            let newDataBounds = calculateDataBounds(newDataInDataSpace);
            if (singleSeries.rendering === 'bar') {
                newDataBounds = expandBounds(newDataBounds, { extendXForNBars: singleSeries.inDataSpace.length });
            }

            singleSeries.dataBounds = mergeBounds([singleSeries.dataBounds, newDataBounds]);
            this._dataBounds = mergeBounds([this._dataBounds, newDataBounds]);

            // save these off for debugging only
            singleSeries.newPointCount = newDataInDataSpace.length;
            singleSeries.newDataBounds = newDataBounds;
        }

        const previousSelection = this._selection;
        this._recalculateSelection();

        for (let singleSeries of modifiedSeries) {
            if (!singleSeries.inSelectedSpace.data.length) { // empty, trivially fast
                singleSeries.selectedBounds = calculateDataBounds(singleSeries.inSelectedSpace.data);
                continue;
            }

            const firstX = singleSeries.inSelectedSpace.data[0][0];
            const lastX = singleSeries.inSelectedSpace.data[singleSeries.inSelectedSpace.data.length - 1][0];

            const oldBoundSubsetOfNewBounds = previousSelection.minX >= firstX && previousSelection.maxX <= lastX;

            if (!oldBoundSubsetOfNewBounds || this._percentile !== 100) {
                // this is significantly slower, but it's too complex to diff the old bounds and new bounds or diff percentiles
                // besides, it not being a subset hopefully means its a lower volume of data
                singleSeries.selectedBounds = calculateDataBounds(singleSeries.inSelectedSpace.data, { percentile: this._percentile, percentileAsymmetry: this._percentileAsymmetry});
                if (singleSeries.hasAreaBottom) {
                    singleSeries.selectedBoundsAreaTop = singleSeries.selectedBounds;
                    singleSeries.selectedBoundsAreaBottom = calculateDataBounds(singleSeries.inSelectedSpaceAreaBottom.data, { percentile: this._percentile, percentileAsymmetry: this._percentileAsymmetry });

                    singleSeries.selectedBounds = mergeBounds([
                        singleSeries.selectedBoundsAreaTop,
                        singleSeries.selectedBoundsAreaBottom
                    ]);
                }
                continue;
            }

            // note: we could do a binary search here, but there are typically only a few points added each frame, so it isn't worth it
            const newSelectedData = newData.get(singleSeries)
                .filter((tuple) => tuple[0] >= this._selection.minX && tuple[0] <= this._selection.maxX);

            singleSeries.newSelectedData = newSelectedData;
            singleSeries.selectedBounds = mergeBounds([singleSeries.selectedBounds, calculateDataBounds(newSelectedData)]);
        }

        this._recalculateAxisBounds();

        this.deferredPriorityEmit('axis_bounds_changed', this._axes.map(({ currentBounds }) => currentBounds));

        for (let axis of modifiedAxes) {
            for (let singleSeries of axis.series) {
                this._calculatePrimarySizeDependents(singleSeries);
                this._calculateRangeGraphSizeDependents(singleSeries);
            }
        }
    }

    _recalculateAxisBounds() {
        for (let axis of this._axes) {
            if (this._selection.fixedY || !this._autoscaleY) {
                axis.targetBounds = this._selection;
                if (axis.targetBounds.byAxis) {
                    axis.targetBounds = axis.targetBounds.byAxis[axis.axisIndex];
                }

                axis.currentBounds = axis.targetBounds;
                continue;
            }

            const selectedBoundsList = [];
            const expandYWith = [];

            for (let singleSeries of axis.series) {
                selectedBoundsList.push(singleSeries.selectedBounds);

                if (singleSeries.expandYWith) {
                    expandYWith.push(...singleSeries.expandYWith);
                }

                if (singleSeries.rendering === 'bar') {
                    expandYWith.push(singleSeries.dataBounds.minY, singleSeries.dataBounds.maxY);
                }
            }

            axis.selectedDataBounds = mergeBounds(selectedBoundsList);
            axis.targetBounds = axis.currentBounds = expandBounds(axis.selectedDataBounds, {expandYWith});
        }
        this.deferredPriorityEmit('axis_bounds_changed', this._axes.map(({ currentBounds }) => currentBounds));
    }

    /**
     * Recalculates global bounds, selection, and data in selected space (for each series)
     * REQUIRES that this._dataBounds and this._expandYWith are set & up-to-date
     *
     * @private
     */
    _recalculateSelection({disableSwap = false}={}) {
        this._globalBounds = expandBounds(this._dataBounds, {expandYWith: this._expandYWith.flat()});
        this.deferredPriorityEmit('global_bounds_changed', this._globalBounds);
        this._selection = selectionFromGlobalBounds(this._globalBounds, this._boundsCalculator);
        this.deferredPriorityEmit('selection_changed', this._selection);

        for (let singleSeries of this._series) {
            if (singleSeries.hidden) {
                continue;
            }

            singleSeries.inSelectedSpace = dataSpaceToSelectedSpace({
                data: singleSeries.hasAreaBottom ? singleSeries.inDataSpace.filter((_, i) => i % 2 === 1) : singleSeries.inDataSpace,
                swap: disableSwap ? null : singleSeries.inSelectedSpace,
                minX: this._selection.minX,
                maxX: this._selection.maxX,
                ignoreDiscontinuities: singleSeries.ignoreDiscontinuities,
                square: singleSeries.square
            });

            if (singleSeries.hasAreaBottom) {
                singleSeries.inSelectedSpaceAreaBottom = dataSpaceToSelectedSpace({
                    data:singleSeries.inDataSpace.filter((_, i) => i % 2 === 0),
                    swap: disableSwap ? null : singleSeries.inSelectedSpaceAreaBottom,
                    minX: this._selection.minX,
                    maxX: this._selection.maxX,
                    ignoreDiscontinuities: singleSeries.ignoreDiscontinuities,
                    square: singleSeries.square
                });
            }
        }
    }

    _render() {
        if (!this.primaryRenderer || !this.primaryRenderer.sizing) {
            return;
        }

        this.primaryRenderer.clear();
        if (this.rangeGraphRenderer) {
            this.rangeGraphRenderer.clear();
        }

        for (let singleSeries of this._series) {
            if (singleSeries.hidden) {
                continue;
            }

            const shadowColor = {
                day: 'white',
                export: 'transparent',
                night: 'black'
            }[this._theme] || 'black';

            const shadowBlur = undefined;

            this.primaryRenderer.renderBackground(singleSeries.inBackgroundSpacePrimary);

            this.primaryRenderer.render(singleSeries, singleSeries.inRenderSpacePrimary, {
                highlighted: this._highlightedSeries === singleSeries.index,
                showIndividualPoints: this._showIndividualPoints,
                shadowColor,
                shadowBlur,
                defaultLineWidth: this._defaultLineWidth,
                globalBounds: this._globalBounds,
                inRenderSpaceAreaBottom: singleSeries.inRenderSpacePrimaryAreaBottom
            });

            if (this.rangeGraphRenderer && this.rangeGraphRenderer.sizing) {
                this.rangeGraphRenderer.render(singleSeries, singleSeries.inRenderSpaceRangeGraph, {
                    shadowColor: 'transparent',
                    shadowBlur: 0,
                    width: 1,
                    bounds: this._globalBounds,
                    globalBounds: this._globalBounds,
                    inRenderSpaceAreaBottom: singleSeries.inRenderSpaceRangeGraphAreaBottom
                });
            }
        }
    }

    _calculatePrimarySizeDependents(singleSeries, { dataChanged=false } = {}) {
        if (!this.primaryRenderer || !this.primaryRenderer.sizing) {
            return;
        }

        if (!singleSeries) {
            for (let s of this._series) {
                this._calculatePrimarySizeDependents(s);
            }
            return;
        }

        if (!this._series.includes(singleSeries)) {
            throw new Error('Series no longer exists');
        }

        if (singleSeries.hidden) {
            return;
        }

        const { currentBounds, scale } = singleSeries.axis;
        const renderWidth = Math.ceil(this.primaryRenderer.sizing.renderWidth/DPI_INCREASE);
        const renderHeight = Math.ceil(this.primaryRenderer.sizing.renderHeight);

        const toCondensedSelectedSpaceParams = {
            minX: currentBounds.minX,
            maxX: currentBounds.maxX,
            renderWidth,
            dataChanged
        }

        singleSeries.inCondensedSelectedSpacePrimary = condenseDataSpace({
            data: singleSeries.inSelectedSpace.data,
            swap: singleSeries.inCondensedSelectedSpacePrimary,
            ...toCondensedSelectedSpaceParams
        });

        const toRenderSpaceParams = {
            minX: currentBounds.minX,
            maxX: currentBounds.maxX,
            minY: currentBounds.minY,
            maxY: currentBounds.maxY,
            renderWidth,
            renderHeight,
            scale,
            dataChanged
        };

        singleSeries.inRenderSpacePrimary = selectedSpaceToRenderSpace({
            data: singleSeries.inCondensedSelectedSpacePrimary.data,
            swap: singleSeries.inRenderSpacePrimary,
            ...toRenderSpaceParams
        });

        singleSeries.inBackgroundSpacePrimary = selectedSpaceToBackgroundSpace({
            data: singleSeries.inCondensedSelectedSpacePrimary.data,
            background: singleSeries.background,
            swap: singleSeries.inBackgroundSpacePrimary,
            minX: currentBounds.minX,
            maxX: currentBounds.maxX
        });

        if (singleSeries.hasAreaBottom) {
            singleSeries.inCondensedSelectedSpacePrimaryAreaBottom = condenseDataSpace({
                data: singleSeries.inSelectedSpaceAreaBottom.data,
                swap: singleSeries.inCondensedSelectedSpacePrimaryAreaBottom,
                ...toCondensedSelectedSpaceParams
            });

            singleSeries.inRenderSpacePrimaryAreaBottom = selectedSpaceToRenderSpace({
                data: singleSeries.inCondensedSelectedSpacePrimaryAreaBottom.data,
                swap: singleSeries.inRenderSpacePrimaryAreaBottom,
                ...toRenderSpaceParams
            });

            singleSeries.inBackgroundSpacePrimaryAreaBottom = selectedSpaceToBackgroundSpace({
                data: singleSeries.inCondensedSelectedSpacePrimaryAreaBottom.data,
                background: singleSeries.background,
                swap: singleSeries.inBackgroundSpacePrimaryAreaBottom,
                minX: currentBounds.minX,
                maxX: currentBounds.maxX
            });
        }
    }

    _calculateRangeGraphSizeDependents(singleSeries, { dataChanged=false } = {}) {
        if (!this.rangeGraphRenderer || !this.rangeGraphRenderer.sizing) {
            return;
        }

        if (!singleSeries) {
            for (let s of this._series) {
                this._calculateRangeGraphSizeDependents(s);
            }
            return;
        }

        if (!this._series.includes(singleSeries)) {
            throw new Error('Series no longer exists');
        }

        if (singleSeries.hidden) {
            return;
        }

        const { scale } = singleSeries.axis;
        const globalBounds = this._globalBounds;
        const renderWidth = Math.ceil(this.rangeGraphRenderer.sizing.renderWidth/DPI_INCREASE);
        const renderHeight = Math.ceil(this.rangeGraphRenderer.sizing.renderHeight);

        const toSelectedSpaceParams = {
            minX: globalBounds.minX,
            maxX: globalBounds.maxX,
            ignoreDiscontinuities: singleSeries.ignoreDiscontinuities,
            square: singleSeries.square
        }

        singleSeries.inSelectedSpaceRangeGraph = dataSpaceToSelectedSpace({
            data: singleSeries.hasAreaBottom ? singleSeries.inDataSpace.filter((_, i) => i % 2 === 1) : singleSeries.inDataSpace,
            swap: singleSeries.inSelectedSpaceRangeGraph,
            ...toSelectedSpaceParams
        });

        const toCondensedSelectedSpaceParams = {
            minX: globalBounds.minX,
            maxX: globalBounds.maxX,
            renderWidth,
            dataChanged
        };

        singleSeries.inCondensedSelectedSpaceRangeGraph = condenseDataSpace({
            data: singleSeries.inSelectedSpaceRangeGraph.data,
            swap: singleSeries.inCondensedSelectedSpaceRangeGraph
        });

        const toRenderSpaceParams = {
            minX: globalBounds.minX,
            maxX: globalBounds.maxX,
            minY: globalBounds.minY,
            maxY: globalBounds.maxY,
            renderWidth,
            renderHeight,
            scale,
            dataChanged
        }

        singleSeries.inRenderSpaceRangeGraph = selectedSpaceToRenderSpace({
            data: singleSeries.inCondensedSelectedSpaceRangeGraph.data,
            swap: singleSeries.inRenderSpaceRangeGraph,
            ...toRenderSpaceParams
        });

        if (singleSeries.hasAreaBottom) {
            singleSeries.inSelectedSpaceRangeGraphAreaBottom = dataSpaceToSelectedSpace({
                data: singleSeries.inDataSpace.filter((_, i) => i % 2 === 0), // take the odd points for area bottom
                swap: singleSeries.inSelectedSpaceRangeGraphAreaBottom,
                ...toSelectedSpaceParams
            });

            singleSeries.inCondensedSelectedSpaceRangeGraphAreaBottom = condenseDataSpace({
                data: singleSeries.inSelectedSpaceRangeGraphAreaBottom.data,
                swap: singleSeries.inCondensedSelectedSpaceRangeGraphAreaBottom,
                ...toCondensedSelectedSpaceParams
            });

            singleSeries.inRenderSpaceRangeGraphAreaBottom = selectedSpaceToRenderSpace({
                data: singleSeries.inCondensedSelectedSpaceRangeGraphAreaBottom.data,
                swap: singleSeries.inRenderSpaceRangeGraphAreaBottom,
                ...toRenderSpaceParams
            });
        }
    }

    _createAxis({ side }) {
        const axis = {
            series: [],
            scale: 'linear',
            side,
            axisIndex: this._axes.length
        };
        this._axes.push(axis);
        return axis;
    }

    _moveAxis(singleSeries, axisIndex) {
        if (!this._series.includes(singleSeries)) {
            throw new Error('Series no longer exists');
        }

        let newAxis;
        if (axisIndex === 'new-left' || axisIndex === 'new-right') {
            newAxis = this._createAxis({ side: axisIndex.split('-')[1] });
        } else {
            newAxis = this._axes[parseInt(axisIndex)];
        }

        if (singleSeries.axis === newAxis) {
            return;
        }

        const oldAxis = singleSeries.axis;
        const oldIndex = oldAxis.series.indexOf(singleSeries);
        if (oldIndex === -1) {
            throw new Error('Series not present in axis');
        }
        oldAxis.series.splice(oldIndex, 1);

        newAxis.series.push(singleSeries);
        singleSeries.axis = newAxis;

        this._dataChanged = true;
        this.deferredEmit('axes_changed', this._axes);
        this.deferredEmit('left_axes_changed', this.leftAxes);
        this.deferredEmit('right_axes_changed', this.rightAxes);
        this.deferredEmit('exported_axes_changed', this.exportedAxes);
        this._markDirty();
    }

    _assignAxisTo(singleSeries) {
        if (singleSeries.axis && typeof singleSeries.axis === 'object') {
            return;
        }

        let axis;

        if (singleSeries.axisIndex) {
            const { axisIndex } = singleSeries;

            if (axisIndex === 'new-left' || axisIndex === 'new-right') {
                axis = this._createAxis({ side: axisIndex.split('-')[1] });
            } else {
                axis = this._axes[parseInt(axisIndex)];
            }
        } else if (singleSeries.axis) {
            singleSeries.originalAxis = singleSeries.axis;
            let [side, number] = singleSeries.axis.split('-');
            axis = findMatchingAxis({ axes: this._axes, side, number });

            if (!axis) {
                axis = this._createAxis({
                    side
                });
            }
        } else {
            axis = this._axes[0];
        }

        axis.series.push(singleSeries);
        singleSeries.axis = axis;

        this.deferredEmit('axes_changed', this._axes);
        this.deferredEmit('exported_axes_changed', this.exportedAxes);

        if (singleSeries.axis.side === 'left') {
            this.deferredEmit('left_axes_changed', this.leftAxes);
        } else {
            this.deferredEmit('right_axes_changed', this.rightAxes);
        }
    }

    _removeSeries(singleSeries) {
        this._seriesFromOriginalSeries.delete(singleSeries.originalSeries);

        const { axis, data } = singleSeries;
        axis.series.splice(axis.series.indexOf(singleSeries), 1);
        const sameDataSet = this._observablesToSeries.get(data);
        if (sameDataSet) {
            sameDataSet.delete(singleSeries);
            if (sameDataSet.size === 0) {
                this._observablesToSeries.delete(data);
            }
        }

        if (this._generatorsToSeries.has(data)) {
            this._generatorsToSeries.get(data).delete(singleSeries);
            if (this._generatorsToSeries.get(data).size === 0) {
                this._generatorsToSeries.delete(data);
                this._generators.delete(data);
            }
        }

        this._alwaysTooltipped.delete(singleSeries);

        singleSeries.axis = singleSeries.originalAxis;
        delete singleSeries.originalAxis;
        delete singleSeries.inDataSpace;
        delete singleSeries.inSelectedSpace;
        delete singleSeries.inValueSpacePrimary;
        delete singleSeries.inValueSpaceRangeGraph;
        delete singleSeries.inRenderSpacePrimary;
        delete singleSeries.inRenderSpaceRangeGraph;
        delete singleSeries.newPointCount;
        delete singleSeries.newDataBounds;
        delete singleSeries.simpleDataSliceStart;

        this.deferredEmit('axes_changed', this._axes);
        this.deferredEmit('exported_axes_changed', this.exportedAxes);

        if (axis.side === 'left') {
            this.deferredEmit('left_axes_changed', this.leftAxes);
        } else {
            this.deferredEmit('right_axes_changed', this.rightAxes);
        }
    }

    _hideSeries(singleSeries) {
        const { axis } = singleSeries;
        const indexInAxis = axis.series.indexOf(singleSeries);
        singleSeries.indexInAxis = indexInAxis;
        axis.series.splice(indexInAxis, 1);

        this.deferredEmit('axes_changed', this._axes);

        if (axis.side === 'left') {
            this.deferredEmit('left_axes_changed', this.leftAxes);
        } else {
            this.deferredEmit('right_axes_changed', this.rightAxes);
        }
    }

    _showSeries(singleSeries) {
        const { axis } = singleSeries;
        axis.series.splice(singleSeries.indexInAxis, 0, singleSeries);

        this.deferredEmit('axes_changed', this._axes);

        if (axis.side === 'left') {
            this.deferredEmit('left_axes_changed', this.leftAxes);
        } else {
            this.deferredEmit('right_axes_changed', this.rightAxes);
        }
    }

    /*
     *   Getters
     *******************
     */

    get boundCalculator() {
        return this._boundsCalculator;
    }

    get axes() {
        return this._axes;
    }

    get leftAxes() {
        const leftAxes = this._axes.filter(({ side, series }) => side === 'left' && series.length > 0).reverse();

        if (leftAxes.length === 0 && this.rightAxes.length === 0) {
            leftAxes.push(this._axes[0]);
        }

        return leftAxes;
    }

    get rightAxes() {
        return this._axes.filter(({ side, series }) => side === 'right' && series.length > 0 );
    }

    get bounds() {
        return this._axes.map(({ targetBounds }) => targetBounds);
    }

    get selection() {
        return this._selection;
    }

    get globalBounds() {
        return this._globalBounds;
    }

    get series() {
        return this._series;
    }

    get highlightedSeries() {
        return this._highlightedSeries;
    }

    get showIndividualPoints() {
        return this._showIndividualPoints;
    }

    get autoscaleY() {
        return this._autoscaleY;
    }

    get boundHistory() {
        return {
            hasNextBounds: this._boundsIndex < this._boundsHistory.length - 1,
            hasPreviousBounds: this._boundsIndex > 0
        };
    }

    get tooltipState() {
        return this._tooltipState;
    }
    
    get contextMenuState() {
        return this._contextMenuPosition;
    }

    get alwaysTooltipped() {
        return this._alwaysTooltipped;
    }

    get draggingY() {
        return this._draggingY;
    }

    get averageLoopTime() {
        return averageLoopTimes(this._timingBuffer);
    }

    get exportedAxes() {
        const axisToName = new Map();
        let leftCount = 0;
        let rightCount = 0;

        for (let axis of this._axes) {
            let name;
            if (axis.side === 'left') {
                name = `left-${leftCount}`;
                leftCount++;
            } else {
                name = `right-${rightCount}`;
                rightCount++;
            }

            for (let singleSeries of axis.series) {
                axisToName.set(singleSeries, name);
            }
        }

        return this.series.map((singleSeries) => {
            return {
                ...singleSeries.originalSeries,
                axis: axisToName.get(singleSeries)
            };
        });
    }

    get percentile() {
        return this._percentile;
    }

    get percentileAsymmetry() {
        return this._percentileAsymmetry;
    }

    get showingOptions() {
        return this._showingOptions;
    }

    get maxPrecision() {
        return this._maxPrecision;
    }

    get showingSidebar() {
        return this._showingSidebar;
    }

    get showingAnnotations() {
        return this._showingAnnotations;
    }

    get userCreatedSeries() {
        return this._series.filter((singleSeries) => singleSeries.userCreated);
    }

    get grapherID() {
        return this._grapherID;
    }

    get annotationState() {
        return this._annotationsState;
    }

    get sizing() {
        return this.primaryRenderer && this.primaryRenderer.sizing;
    }

    get theme() {
        return this._theme;
    }

    get exportMode() {
        return this._exportMode;
    }

    get enumMap() {
        return this._enumMap;
    }

    get hasXEnum() {
        return this._hasXEnum;
    }

    /*
     *   Setters / ways to mutate the state that aren't the underlying data changing
     ***********************************************************************************
     */

    markSizeChanged(renderer) {
        if (renderer === this.primaryRenderer) {
            this.deferredEmit('primary_size_change', this.primaryRenderer.sizing);
            this.deferredEmit('primary_bounding_rect_change', this.primaryRenderer.boundingRect);
            this._primarySizeChanged = true;
        } else if (renderer === this.rangeGraphRenderer) {
            this.deferredEmit('range_graph_size_change', this.rangeGraphRenderer.sizing);
            this.deferredEmit('range_graph_bounding_rect_change', this.rangeGraphRenderer.boundingRect);
            this._rangeGraphSizeChanged = true;
        }

        this._mustRerender = true;
        this._tooltipsChanged = true;
        this._annotationsChanged = true;
        this._mustCallGenerators = true;
        this._markDirty();
    }

    set theme(value) {
        this._theme = value;
        this._mustRerender = true;
        this.deferredEmit('theme_change', this._theme);
        this._markDirty();
    }

    set exportMode(value) {
        this._exportMode = value;

        if (value) {
            this._nonExportTheme = this.theme;
            this.theme = 'export';
        } else {
            this.theme = this._nonExportTheme;
        }

        this.deferredEmit('export_mode_change', this._exportMode);
        this._markDirty();
    }

    set defaultLineWidth(value) {
        this._defaultLineWidth = value;
        this._mustRerender = true;
        this._markDirty();
    }

    set boundCalculator(boundingFunction) {
        if (!boundingFunction) {
            return;
        }

        if (boundingFunction === this._boundsCalculator) {
            return;
        }

        if (boundingFunction.debounceHistory) {
            clearTimeout(this._boundingCalculatorDebouncer);
            this._boundingCalculatorDebouncer = setTimeout(() => {
                this._addBoundCalculatorToHistory(boundingFunction);
            }, 250);
        } else {
            this._addBoundCalculatorToHistory(boundingFunction);
        }

        this._boundsCalculator = boundingFunction;
        this.deferredEmit('bound_calculator_changed', this._boundsCalculator);
        this._dataChanged = true;
        this._mustCallGenerators = true;
        this._markDirty();
    }

    set customBoundsSelectors(boundsSelectors) {
        this._customBoundsSelectors = this._customBoundsSelectors || {};

        const indexedCustomBoundSelectors = {};

        for (let { label, calculator } of boundsSelectors) {
            indexedCustomBoundSelectors[label] = calculator;

            if (this._boundsCalculator === this._customBoundsSelectors[label] && this._boundsCalculator !== calculator) {
                this.boundCalculator = calculator;
            }
        }

        this._customBoundsSelectors = indexedCustomBoundSelectors;
    }

    _addBoundCalculatorToHistory(boundingFunction) {
        this._boundsIndex++;
        this._boundsHistory = this._boundsHistory.slice(0, this._boundsIndex);
        this._boundsHistory.push(boundingFunction);
        this.emit('bound_history_changed', this.boundHistory);
    }

    registerSeriesClick(selectedSeriesIndex) {
        this.emit('series_click', this._series[selectedSeriesIndex], selectedSeriesIndex);
    }

    setHighlightedSeries(highlightedSeries) {
        this._highlightedSeries = highlightedSeries;
        this.deferredEmit('highlighted_series_changed', highlightedSeries);
        this._mustRerender = true;
        this._markDirty();
    }

    toggleIndividualPoints() {
        this._showIndividualPoints = !this._showIndividualPoints;
        this.deferredEmit('show_individual_points_changed', this._showIndividualPoints);
        this._mustRerender = true;
        this._markDirty();
    }

    toggleYAutoscaling() {
        this._autoscaleY = !this._autoscaleY;
        this.deferredEmit('autoscale_y_changed', this._autoscaleY);
        this._markDirty();
    }

    toggleExportMode() {
        this.exportMode = !this._exportMode;
    }

    setBoundsFromSelection(pixelSelection) {
        this.boundCalculator = boundCalculatorFromSelection(pixelSelection, {
            elementWidth: this.primaryRenderer.sizing.elementWidth,
            elementHeight: this.primaryRenderer.sizing.elementHeight,
            selection: this._selection,
            axes: this._axes
        });
    }

    nextBounds() {
        this._boundsIndex++;
        this._boundsCalculator = this._boundsHistory[this._boundsIndex];
        this.deferredEmit('bound_calculator_changed', this._boundsCalculator);
        this.deferredEmit('bound_history_changed', this.boundHistory);
        this._dataChanged = true;
        this._markDirty();
    }

    previousBounds() {
        this._boundsIndex--;
        this._boundsCalculator = this._boundsHistory[this._boundsIndex];
        this.deferredEmit('bound_calculator_changed', this._boundsCalculator);
        this.deferredEmit('bound_history_changed', this.boundHistory);
        this._dataChanged = true;
        this._markDirty();
    }

    setLabel({ axisIndex, label }) {
        this._axes[axisIndex].label = label;
        this.deferredEmit('axes_changed', [...this._axes]);
        this._markDirty();
    }

    toggleScale({ axisIndex }) {
        const oldScale = this._axes[axisIndex].scale;
        this._axes[axisIndex].scale = oldScale === 'log' ? 'linear' : 'log';

        this._dataChanged = true;
        this.deferredEmit('axes_changed', [...this._axes]);
        this._markDirty();
    }

    recalculateTooltips() {
        this.primaryRenderer.recalculatePosition();
        this.setTooltipMousePosition({
            clientX: this._tooltipClientX,
            clientY: this._tooltipClientY,
            shiftKey: this.shiftKeyPressedOnMove,
            tooltipAllNext: this._tooltipAllNext,
            tooltipStateArg: this._tooltipStateArg
        });
    }

    setTooltipMousePosition({ clientX, clientY, shiftKey, mouseX, mouseY, tooltipAllNext, tooltipStateArg }) {
        const sizing = this.primaryRenderer.sizing;
        if (!sizing) {
            return;
        }

        if (typeof clientX === 'number') {
            this._tooltipClientX = clientX;

            if (clientX < sizing.boundingRect.left || clientX > sizing.boundingRect.right) {
                this.showOnlySavedTooltips();
                return;
            }
        } else if (typeof mouseY !== 'number') {
            return;
        }

        if (typeof clientY === 'number') {
            this._tooltipClientY = clientY;

            if (clientY < sizing.boundingRect.top || clientY > sizing.boundingRect.bottom) {
                this.showOnlySavedTooltips();
                return;
            }
        } else if (typeof mouseY !== 'number') {
            return;
        }

        const newMouseX = mouseX || (clientX - sizing.boundingRect.left);
        const newMouseY = mouseY || (clientY - sizing.boundingRect.top);
        if (this._tooltipState.mousePresent && newMouseX === this._tooltipState.mouseX && newMouseY === this._tooltipState.mouseY) {
            return;
        }

        this._tooltipsChanged = true;
        this._tooltipState.mousePresent = true;
        this._tooltipState.mouseX = newMouseX;
        this._tooltipState.mouseY = newMouseY;
        this.shiftKeyPressedOnMove = shiftKey;
        this._tooltipAllNext = tooltipAllNext;
        this._tooltipStateArg = tooltipStateArg;
        this._markDirty();
    }
    
    setContextMenuMousePosition({ clientX, clientY }) {
        this._contextMenuPosition = { x: clientX, y: clientY, showing: !this._contextMenuPosition.showing };
        this._contextMenuChanged = true;
        this._markDirty();
    }

    toggleAlwaysTooltipped(singleSeries, shiftKey) {
        if (this._alwaysTooltipped.has(singleSeries)) {
            if (shiftKey) {
                this._alwaysTooltipped.clear();
            } else {
                this._alwaysTooltipped.delete(singleSeries);
            }
        } else {
            if (shiftKey) {
                for (let series of this._series) {
                    this._alwaysTooltipped.add(series);
                }
            } else {
                this._alwaysTooltipped.add(singleSeries);
            }
        }

        this._tooltipsChanged = true;
        this.deferredEmit('always_tooltipped_changed', this._alwaysTooltipped);
        this._markDirty();
    }

    showOnlySavedTooltips(tooltipStateArg) {
        if (!this._tooltipState.mousePresent) {
            return;
        }

        this._tooltipsChanged = true;
        this._tooltipState.mousePresent = false;
        this._tooltipStateArg = tooltipStateArg;
        this._markDirty();
    }

    registerClick({ clientX }) {
        if (!this._listeners['series_click']) {
            return;
        }

        const boundingRect = this.primaryRenderer.boundingRect;
        const sizing = this.primaryRenderer.sizing;

        for (let series of this._series) {
            const bounds = series.axis.currentBounds;

            const x = (clientX - boundingRect.left) / sizing.elementWidth * (bounds.maxX - bounds.minX) + bounds.minX;
            this.emit('series_click', { x, series });
        }
    }

    toggleTooltipSaved() {
        const oldSavedTooltips = this._savedTooltips;
        this._savedTooltips = toggleTooltipSaved({
            currentTooltips: this._tooltipState.tooltips,
            savedTooltips: this._savedTooltips
        });
        this._tooltipsChanged = this._savedTooltips !== oldSavedTooltips;
        this._markDirty();
    }

    clearSavedTooltips() {
        if (this._savedTooltips.length === 0) {
            return;
        }

        this._savedTooltips = [];
        this._tooltipsChanged = true;
        this._markDirty();
    }

    markDragStart() {
        if (this._draggingY) {
            return;
        }

        this._draggingY = true;
        this.deferredEmit('dragging_y_changed', this._draggingY);
        this._markDirty();
    }

    finalizeDrag(draggedSeries, axisIndex, grapherID) {
        if (!this._draggingY) {
            return;
        }

        this._draggingY = false;
        this.deferredEmit('dragging_y_changed', this._draggingY);

        const hasAxis = axisIndex && axisIndex !== 0;
        const sameGrapherID = grapherID === this._grapherID;

        if (hasAxis && sameGrapherID) {
            this._moveAxis(draggedSeries, axisIndex);
            this.deferredEmit('dragging_y_finalized', { draggedSeries, axisIndex, grapherID });
        } else if (grapherID) {
            this.deferredEmit('dragging_y_finalized', { draggedSeries, axisIndex, grapherID });
        }

        this._markDirty();
    }

    set timingFrameCount(value) {
        if (typeof value !== 'number') {
            return;
        }

        this._timingBuffer = [];
        this._timingIndex = 0;
        this._timingFrameCount = value;
    }

    set percentile(value) {
        if (value === undefined) {
            return;
        }

        this.deferredEmit('percentile_changed', value);

        if (value === '') {
            value = 100;
        }

        value = parseFloat(value);
        if (!isNaN(value) && value <= 100 && value >= 0) {
            this._percentile = value;
            this._dataChanged = true;
        }

        this._markDirty();
    }

    set percentileAsymmetry(value) {
        if (value === undefined) {
            return;
        }

        this.deferredEmit('percentile_asymmetry_changed', value);

        if (value === '') {
            value = 0;
        }

        value = parseFloat(value);
        if (!isNaN(value) && value <= 50 && value >= -50) {
            this._percentileAsymmetry = value;
            this._dataChanged = true;
        }

        this._markDirty();
    }

    set showingOptions(value) {
        if (value === undefined) {
            return;
        }

        this._showingOptions = value;
        this.deferredEmit('showing_options_changed', value);
        this._markDirty();
    }

    toggleShowingOptions() {
        this.showingOptions = !this.showingOptions;
    }

    toggleMaxPrecision() {
        this._maxPrecision = !this._maxPrecision;
        this.deferredEmit('max_precision_changed', this._maxPrecision);
        this._markDirty();
    }

    toggleShowingAnnotations() {
        this._showingAnnotations = !this._showingAnnotations;
        this.deferredEmit('showing_annotations_changed', this._showingAnnotations);
        this._markDirty();
    }

    toggleShowingSidebar() {
        this._showingSidebar = !this._showingSidebar;
        this.deferredEmit('showing_sidebar_changed', this._showingSidebar);
        this._markDirty();
    }

    setShowing(singleSeries, showing) {
        singleSeries.hidden = !showing;
        this._series = [...this._series];

        if (singleSeries.hidden) {
            this._hideSeries(singleSeries);
        } else {
            this._showSeries(singleSeries);
        }

        this.deferredEmit('series_changed', this._series, { skipResize: true });
        this._dataChanged = true;
        this._markDirty();
    }

    set annotations(value) {
        this._annotations = value || [];
        this._annotationsChanged = true;
        this._markDirty();
    }

    /**
     * Converts an enum to a number, mutating saved state if necessary to track that
     *
     * @param {String} value
     * @param {Object} singleSeries
     * @param {Boolean} [isX]
     * @return {Number}
     */
    enumToNumber(value, singleSeries, isX) {
        const existingIndex = this._enumMap[value];
        if (typeof existingIndex === 'number') {
            return existingIndex;
        }

        const indexToSet = Object.keys(this._enumMap).length;
        this._enumMap[value] = indexToSet;

        // safely handle reference changes
        this._series[singleSeries.index].hasEnum = true;
        if (isX) {
            this._series[singleSeries.index].hasXEnum = true;
            this._hasXEnum = true;
            this.deferredEmit('has_x_enum_change', this._hasXEnum);
            this.deferredEmit('x_enum_map_change', this._enumMap);
        }

        this.deferredEmit('enum_map_change', this._enumMap);

        return indexToSet;
    }

    triggerResize() {
        this._mustResize = true;
        this._markDirty();
    }
}
