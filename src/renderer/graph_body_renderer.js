import sizeCanvas from './size_canvas';
import getColor from '../helpers/colors';
import LineProgram from './line_program';
import drawLine from './draw_line';
import Eventable from '../eventable';
import drawBackground from './draw_background.js';
import BackgroundProgram from './background_program.js';
import drawBars from './draw_bars';
import drawArea from './draw_area';

export default class GraphBodyRenderer extends Eventable {

    constructor({stateController, canvasElement, webgl=false, checkIntersection=true }) {
        super();

        this._stateController = stateController;

        this._checkIntersection = checkIntersection;
        this._canvas = canvasElement;
        this._webgl = webgl;
        if (webgl) {
            this._context = this._canvas.getContext('webgl');
            if (this._context) {
                this._lineProgram = new LineProgram(this._context);
            } else {
                alert('WebGL failed! Attempting fallback to CPU rendering');
                this._webgl = false;
            }
        }

        if (!this._webgl) {
            this._context = this._canvas.getContext( '2d');
            this._context2d = this._context;
        }

        this._initialized = this._initializeCanvas();

        this._boundResize = this.resize.bind(this);
        this._cachedAxisCount = null;
        this._onAxisChange = (axes) => {
            const count = axes.filter(({ series }) => series.length > 0).length;
            if (this._cachedAxisCount !== count) {
                this._cachedAxisCount = count;
                this.resize();
            }
        };

        stateController.on('axes_changed', this._onAxisChange);
        stateController.on('dragging_y_changed', this._boundResize);
        stateController.on('showing_sidebar_changed', this._boundResize);
    }

    /**
     * Cleans up after this renderer
     */
    dispose() {
        this.clearListeners();
        this._lineProgram && this._lineProgram.dispose();
        this._cachedAxisCount = null;
        this._stateController.off('axes_changed', this._onAxisChange);
        this._stateController.off('dragging_y_changed', this._boundResize);

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }

        if (this._intersectionObserver) {
            this._intersectionObserver.disconnect();
        }
    }

    clear() {
        if (this._webgl) {
            this._lineProgram.clear();
        } else {
            this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
        }
    }

    render(singleSeries, inRenderSpace, { highlighted, showIndividualPoints, shadowColor, shadowBlur, width, defaultLineWidth, bounds, globalBounds }) {
        const getIndividualPoints = (useDataSpace) => {
            if (!bounds) {
                bounds = singleSeries.axis.currentBounds;
            }

            const individualPoints = [];
            let data = singleSeries.inSelectedSpace.data;
            if (useDataSpace) {
                data = singleSeries.inDataSpace;
            }

            for (let [x, y] of data) {
                if (y === null) {
                    continue;
                }

                individualPoints.push([
                    (x - bounds.minX) / (bounds.maxX - bounds.minX) * this._sizing.renderWidth,
                    (1.0 - (y - bounds.minY) / (bounds.maxY - bounds.minY)) * this._sizing.renderHeight
                ]);
            }

            return individualPoints;
        };

        const cpuRendering = singleSeries.rendering === 'bar' || singleSeries.rendering === 'area';
        let commonCPUParams;

        if (cpuRendering) {
            // we can currently only render bars with the CPU
            this._context2d = this._context2d || this._canvas.getContext('2d');

            if (this._webgl) {
                // make sure we don't have any webgl stuff in the way before we get back to CPU rendering
                this._context.flush();
            }

            if (!bounds) {
                bounds = singleSeries.axis.currentBounds;
            }

            commonCPUParams = {
                context: this._context2d,
                color: getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex),
                sizing: this._sizing,
                zero: (1.0 - (0 - bounds.minY) / (bounds.maxY - bounds.minY)) * this._sizing.renderHeight,
                hasNegatives: !!singleSeries.inDataSpace.find((tuple) => tuple[1] < 0),
                negativeColor: singleSeries.negativeColor,
                zeroWidth: singleSeries.zeroLineWidth,
                zeroColor: singleSeries.zeroLineColor
            };
        }

        if (singleSeries.rendering === 'bar') {
            drawBars(getIndividualPoints(true), {
                ...commonCPUParams,
                indexInAxis: singleSeries.axis.series.indexOf(singleSeries),
                axisSeriesCount: singleSeries.axis.series.length,
                closestSpacing: globalBounds.closestSpacing,
                bounds
            });
            return;
        }

        if (singleSeries.rendering === 'area') {
            drawArea(getIndividualPoints(true), inRenderSpace, {
                ...commonCPUParams,
                showIndividualPoints: typeof singleSeries.showIndividualPoints === 'boolean' ? singleSeries.showIndividualPoints : showIndividualPoints,
                gradient: singleSeries.gradient,
                pointRadius: singleSeries.pointRadius,
                highlighted,
                width: width || singleSeries.width || defaultLineWidth,
                shadowColor,
                shadowBlur
            });
            return;
        }

        const drawParams = {
            color: getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex),
            context: this._context,
            width: width || singleSeries.width || defaultLineWidth,
            shadowColor,
            shadowBlur,
            dashed: singleSeries.dashed,
            dashPattern: singleSeries.dashPattern,
            highlighted,
            showIndividualPoints: typeof singleSeries.showIndividualPoints === 'boolean' ? singleSeries.showIndividualPoints : showIndividualPoints,
            getIndividualPoints
        };

        if (this._webgl) {
            this._lineProgram.draw(inRenderSpace, drawParams);
        } else {
            drawLine(inRenderSpace, drawParams);
        }
    }

    renderBackground(inBackgroundSpace) {
        if (!inBackgroundSpace) {
            return;
        }

        if (this._webgl) {
            if (!this._backgroundProgram) {
                this._backgroundProgram = new BackgroundProgram(this._context);
            }
            
            this._backgroundProgram.draw(inBackgroundSpace);
        } else {
            drawBackground(inBackgroundSpace, {
                context: this._context
            });
        }
    }

    /**
     * Initializes canvas
     * Currently, just sets sizing
     */
    async _initializeCanvas() {
        this._sizing = await sizeCanvas(this._canvas, this._context);

        this.emit('size_changed', this._sizing);
        this._stateController.markSizeChanged();

        if (window.ResizeObserver) {
            let first = true;
            let disabled = false;

            this._resizeObserver = new window.ResizeObserver( () => {
                if (first) { // always fires once at the beginning
                    first = false;
                    return;
                }

                if (disabled) {
                    return;
                }

                disabled = true;
                this.resize().then(() => {
                    disabled = false;
                });
            });

            this._resizeObserver.observe(this._canvas.parentNode);
        }

        if (this._checkIntersection && window.IntersectionObserver) {
            this._intersectionObserver = new window.IntersectionObserver((entries) => {
                clearTimeout(this._intersectionTimeout);

                if (!entries[0].isIntersecting) {
                    return;
                }

                this._intersectionTimeout = setTimeout(() => {
                    this.resize();
                }, 50);
            }, {
                threshold: 0.1
            });

            this._intersectionObserver.observe(this._canvas.parentNode);
        }
    }

    async resize() {
        const sizingPromise = sizeCanvas(this._canvas, this._context, { reset: true });
        this._initialized = sizingPromise;

        this._sizing = await this._initialized;
        if (this._initialized !== sizingPromise) {
            return;
        }

        this.emit('size_changed', this._sizing);
        this._stateController.markSizeChanged(this);
    }

    resizeDebounced() {
        if (this._resizeTimeout) {
            clearTimeout(this._resizeTimeout);
        }

        this._resizeTimeout = setTimeout(() => {
            this.resize();
            this._resizeTimeout = null;
        }, 50);
    }

    recalculatePosition() {
        if (!this._sizing) {
            return;
        }

        this._sizing.boundingRect = this._canvas.getBoundingClientRect();
    }

    /**
     * Returns the bounding rect of the element
     *
     * @return {DOMRect}
     */
    get boundingRect() {
        return this._sizing.boundingRect;
    }

    get sizing() {
        return this._sizing;
    }

}
