import Eventable from '../eventable';
import getColor from '../helpers/colors';
import inferType from '../state/infer_type';
import BackgroundProgram from './background_program.js';
import drawArea from './draw_area';
import drawBackground from './draw_background.js';
import drawBars from './draw_bars';
import drawLine from './draw_line';
import LineProgram from './line_program';
import ShadowProgram from './shadow_program';
import sizeCanvas, { DPI_INCREASE } from './size_canvas';

export default class GraphBodyRenderer extends Eventable {

    constructor({stateController, canvasElement, webgl=false, checkIntersection=true }) {
        super();

        this._stateController = stateController;

        this._checkIntersection = checkIntersection;
        this._canvas = canvasElement;
        this._webgl = webgl;
        
        if (!this._canvas) {
            console.error('Canvas element is null in GraphBodyRenderer constructor');
            this._initialized = false;
            return;
        }
        
        if (webgl) {
            this._context = this._canvas.getContext('webgl');
            if (this._context) {
                this._lineProgram = new LineProgram(this._context);
                this._shadowProgram = new ShadowProgram(this._context);
            } else {
                console.error('❌ WebGL context creation failed');
                alert('WebGL failed! Attempting fallback to CPU rendering');
                this._webgl = false;
            }
        }

        if (!this._webgl) {
            this._context = this._canvas.getContext('2d');
            this._context2d = this._context;
        }

        if (!this._context) {
            console.error('Failed to get canvas context in GraphBodyRenderer');
            this._initialized = false;
            return;
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
        this._shadowProgram && this._shadowProgram.dispose();
        this._cachedAxisCount = null;
        this._stateController.off('axes_changed', this._onAxisChange);
        this._stateController.off('dragging_y_changed', this._boundResize);

        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }

        if (this._intersectionObserver) {
            this._intersectionObserver.disconnect();
        }

        if (this._zeroLineCanvas && this._zeroLineCanvas.parentNode) {
            this._zeroLineCanvas.parentNode.removeChild(this._zeroLineCanvas);
            this._zeroLineCanvas = null;
            this._zeroLineContext = null;
        }
    }

    clear() {
        if (this._webgl) {
            this._lineProgram.clear();
        } else {
            this._context.clearRect(0, 0, this._context.canvas.width, this._context.canvas.height);
        }
    }

    render(singleSeries, inRenderSpace, { highlighted, showIndividualPoints, shadowColor, shadowBlur, width, defaultLineWidth, bounds, globalBounds, inRenderSpaceAreaBottom }) {
        if (!this._initialized || !this._context || !this._canvas) {
            console.warn('GraphBodyRenderer: Cannot render - not initialized, missing context, or missing canvas');
            return;
        }
        
        let cutoffIndex = -1;
        let cutoffTime = null; 
        let cutoffData = singleSeries.data; 

        const isObjectFormat = singleSeries.data && singleSeries.data.length > 0 && 
                              typeof singleSeries.data[0] === 'object' && 
                              !Array.isArray(singleSeries.data[0]);
        
        if (isObjectFormat && singleSeries.cutoffTime) {
            cutoffData = singleSeries.data.map(point => {
                const xValue = point[singleSeries.xKey || 'x'];
                const yValue = point[singleSeries.yKey || 'y'];
                
                const convertedX = typeof xValue === 'string' ? new Date(xValue) : xValue;
                
                return [convertedX, yValue];
            });
        }
        
        if (singleSeries.cutoffTime && singleSeries.data && singleSeries.data.length > 0) {
            let cutoffDate;
            if (singleSeries.cutoffTime === 'now') {
                cutoffDate = new Date();
            } else if (typeof singleSeries.cutoffTime === 'number') {
                cutoffDate = new Date(singleSeries.cutoffTime);
            } else {
                cutoffDate = singleSeries.cutoffTime;
            }
            
            cutoffTime = cutoffDate instanceof Date ? cutoffDate.getTime() : cutoffDate;
            
            for (let i = 0; i < cutoffData.length - 1; i++) {
                const currentPoint = cutoffData[i];
                const nextPoint = cutoffData[i + 1];
                
                const currentTime = currentPoint[0] instanceof Date ? currentPoint[0].getTime() : currentPoint[0];
                const nextTime = nextPoint[0] instanceof Date ? nextPoint[0].getTime() : nextPoint[0];
                
                if (currentTime <= cutoffTime && cutoffTime <= nextTime) {
                    const timeRatio = (cutoffTime - currentTime) / (nextTime - currentTime);
                    cutoffIndex = i + timeRatio;
                    break;
                } else if (currentTime > cutoffTime) {
                    cutoffIndex = i;
                    break;
                }
            }
            
            if (cutoffIndex === -1) {
                cutoffIndex = cutoffData.length - 1;
            }
        }
        
        const getIndividualPoints = (useDataSpace, includeBeyondBounds = false) => {
            if (!useDataSpace && inRenderSpace && inRenderSpace.yValues) {
                if (!bounds) {
                    bounds = singleSeries.axis.currentBounds;
                }
                
                const individualPoints = [];
                const { yValues, nullMask } = inRenderSpace;
                const threshold = yValues.length / 2;
                let pastThreshold = 0;
                const samples = [];
                
                for (let pixelX = 0; pixelX < yValues.length; pixelX++) {
                    if (nullMask[pixelX] === 0) {
                        const xCoord = pixelX * DPI_INCREASE;
                        individualPoints.push([xCoord, yValues[pixelX]]);
                        
                        if (pixelX > threshold) {
                            pastThreshold++;
                            if (samples.length < 3) samples.push({pixelX, xCoord, nullMask: nullMask[pixelX]});
                        }
                    }
                }
                
                if (individualPoints.length < 50) {
                    return getIndividualPoints(true, includeBeyondBounds);
                }

                return individualPoints;
            }

            if (!bounds) {
                bounds = singleSeries.axis.currentBounds;
            }

            const individualPoints = [];
            let data = singleSeries.inSelectedSpace.data;
            if (useDataSpace) {
                data = singleSeries.inDataSpace;
            }

            let boundsMinX = bounds.minX instanceof Date ? bounds.minX.getTime() : bounds.minX;
            let boundsMaxX = bounds.maxX instanceof Date ? bounds.maxX.getTime() : bounds.maxX;
            
            let foundBeyondBounds = false;
            let lastPointBeforeBounds = null;
            
            for (let i = 0; i < data.length; i++) {
                let x, y;
                
                if (Array.isArray(data[i])) {
                    [x, y] = data[i];
                } else if (typeof data[i] === 'object' && data[i] !== null) {
                    x = data[i][singleSeries.xKey];
                    y = data[i][singleSeries.yKey];
                } else {
                    continue;
                }
                
                if (y === null || y === undefined) {
                    continue;
                }

                let xValue = x instanceof Date ? x.getTime() : x;
                
                if (xValue < boundsMinX) {
                    if (includeBeyondBounds) {
                        lastPointBeforeBounds = [xValue, y];
                    }
                    continue;
                }
                
                if (xValue > boundsMaxX) {
                    if (includeBeyondBounds && !foundBeyondBounds) {
                        foundBeyondBounds = true;
                    } else {
                        break;
                    }
                }

                const renderWidth = this._sizing.renderWidth / DPI_INCREASE;
                const xCoord = (xValue - boundsMinX) / (boundsMaxX - boundsMinX) * (renderWidth - 1) * DPI_INCREASE;
                const yCoord = (1.0 - (y - bounds.minY) / (bounds.maxY - bounds.minY)) * this._sizing.renderHeight;
                
                individualPoints.push([xCoord, yCoord]);
            }

            if (lastPointBeforeBounds && includeBeyondBounds) {
                const [beforeXValue, beforeY] = lastPointBeforeBounds;
                const renderWidth = this._sizing.renderWidth / DPI_INCREASE;
                const beforeXCoord = (beforeXValue - boundsMinX) / (boundsMaxX - boundsMinX) * (renderWidth - 1) * DPI_INCREASE;
                const beforeYCoord = (1.0 - (beforeY - bounds.minY) / (bounds.maxY - bounds.minY)) * this._sizing.renderHeight;
                individualPoints.unshift([beforeXCoord, beforeYCoord]);
            }

            return individualPoints;
        };

        const getRanges = () => {
            if (!bounds) {
                bounds = singleSeries.axis.currentBounds;
            }

            if (!singleSeries.rangeKey) {
                return [];
            }

            const inferredType = inferType(singleSeries, { useSimpleData: true });
            if (inferredType !== 'objects') {
                return [];
            }

            return (singleSeries.simpleData || singleSeries.data).map((object) => {
                const range = object[singleSeries.rangeKey];

                if (!range) {
                    return null;
                }

                const min = range.min;
                const max = range.max;
                const x = object[singleSeries.xKey];

                return {
                    x,
                    range,

                    pixelX: (x - bounds.minX) / (bounds.maxX - bounds.minX) * this._sizing.renderWidth,
                    pixelMinY: typeof min === 'number' ? (1.0 - (min - bounds.minY) / (bounds.maxY - bounds.minY)) * this._sizing.renderHeight : null,
                    pixelMaxY: typeof max === 'number' ? (1.0 - (max - bounds.minY) / (bounds.maxY - bounds.minY)) * this._sizing.renderHeight : null
                };
            });
        };

        const cpuRendering = singleSeries.rendering === 'bar' || singleSeries.rendering === 'area';
        let commonCPUParams;

        if (cpuRendering) {
            if (this._webgl) {
                console.warn(`CPU rendering (${singleSeries.rendering}) is not supported with webgl={true}. Use webgl={false} or switch to 'line' rendering.`);
                return;
            }
            
            if (!this._context2d) {
                this._context2d = this._canvas.getContext('2d', { willReadFrequently: false });
            }
            
            if (!this._context2d) {
                console.error('Failed to get 2D context for CPU rendering');
                return;
            }

            if (this._webgl) {
                this._context.flush();
            }

            if (!bounds) {
                bounds = singleSeries.axis.currentBounds;
            }

            const zero = singleSeries.zeroLineY === 'bottom' ?
                this._sizing.renderHeight :
                (1.0 - ((singleSeries.zeroLineY || 0) - bounds.minY) / (bounds.maxY - bounds.minY)) * this._sizing.renderHeight;

            commonCPUParams = {
                context: this._context2d,
                color: getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex),
                sizing: this._sizing,
                zero,
                hasNegatives: !!singleSeries.inDataSpace.find((tuple) => tuple[1] < 0),
                negativeColor: singleSeries.negativeColor,
                zeroWidth: singleSeries.zeroLineWidth,
                zeroColor: singleSeries.zeroLineColor
            };

            if (!commonCPUParams.hasNegatives && singleSeries.expandYWith) {
                commonCPUParams.hasNegatives = singleSeries.expandYWith.some((y) => y < 0);
            }
        }

        if (singleSeries.rendering === 'bar') {
            let barParams = {
                ...commonCPUParams,
                indexInAxis: singleSeries.axis.series.indexOf(singleSeries),
                axisSeriesCount: singleSeries.axis.series.length,
                closestSpacing: globalBounds.closestSpacing,
                bounds
            };

            if (singleSeries.cutoffTime) {
                barParams.cutoffIndex = cutoffIndex;
                barParams.cutoffOpacity = 0.35;
                barParams.originalData = cutoffData;
                barParams.renderCutoffGradient = cutoffIndex >= 0; 
                
                const selection = this === this._stateController.rangeGraphRenderer 
                    ? this._stateController._bounds 
                    : (this._stateController._selection || this._stateController._bounds);
                barParams.selectionBounds = selection;
            }

            drawBars(getIndividualPoints(true), barParams);
            return;
        }

        if (singleSeries.rendering === 'area') {
            let areaParams = {
                ...commonCPUParams,
                showIndividualPoints: typeof singleSeries.showIndividualPoints === 'boolean' ? singleSeries.showIndividualPoints : showIndividualPoints,
                gradient: singleSeries.gradient,
                pointRadius: singleSeries.pointRadius,
                highlighted,
                width: width || singleSeries.width || defaultLineWidth,
                shadowColor,
                shadowBlur,
                inRenderSpaceAreaBottom
            };

        if (singleSeries.cutoffTime) {
            areaParams.cutoffIndex = cutoffIndex;
            areaParams.cutoffOpacity = 0.35;
            areaParams.originalData = cutoffData;
            areaParams.renderCutoffGradient = cutoffIndex >= 0; 
            areaParams.isPreview = this === this._stateController.rangeGraphRenderer; 
            
            const selection = this === this._stateController.rangeGraphRenderer 
                ? this._stateController._bounds 
                : (this._stateController._selection || this._stateController._bounds);
            areaParams.selectionBounds = selection;
        }

            drawArea(getIndividualPoints(true), inRenderSpace, areaParams);
        }

        if (singleSeries.rendering === 'shadow') {
            if (!this._webgl || !this._shadowProgram) {
                console.warn('Shadow rendering requires WebGL. Enable webgl={true} on your Grapher component.', {
                    webgl: !!this._webgl,
                    shadowProgram: !!this._shadowProgram,
                    program: !!this._shadowProgram?._program
                });
                return;
            }
            
            if (!this._shadowProgram._program) {
                console.error('ShadowProgram has no valid WebGL program');
                return;
            }
            
            if (!inRenderSpace) {
                console.error('inRenderSpace is null for shadow rendering');
                return;
            }
            
            if (!bounds) {
                bounds = singleSeries.axis.currentBounds;
            }
            
            let zero = singleSeries.zeroLineY === 'bottom' ?
                this._sizing.renderHeight :
                singleSeries.zeroLineY !== undefined ? 
                    (1.0 - ((singleSeries.zeroLineY) - bounds.minY) / (bounds.maxY - bounds.minY)) * this._sizing.renderHeight :
                    this._sizing.renderHeight;
                
            const boundsChanged = !this._lastBounds || 
                bounds.minY !== this._lastBounds.minY || 
                bounds.maxY !== this._lastBounds.maxY || 
                this._sizing.renderHeight !== this._lastRenderHeight;
                
            this._lastBounds = {...bounds};
            this._lastRenderHeight = this._sizing.renderHeight;
            
            if (boundsChanged && this._lastShadowCache) {
                this._lastShadowCache = null;
            }
            
            if (zero > this._sizing.renderHeight * 1.5) {
                zero = this._sizing.renderHeight;
            } else if (zero < -this._sizing.renderHeight * 0.5) {
                zero = 0;
            }
            
            let shadowParams = {
                color: getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex),
                gradient: singleSeries.gradient,
                zero,
                sizing: this._sizing,
                inRenderSpaceAreaBottom
            };

            if (singleSeries.cutoffTime) {
                shadowParams.cutoffIndex = cutoffIndex;
                shadowParams.cutoffOpacity = 0.35;
                shadowParams.originalData = cutoffData;
                shadowParams.renderCutoffGradient = cutoffIndex >= 0; 
                shadowParams.isPreview = this === this._stateController.rangeGraphRenderer; 

                const selection = this === this._stateController.rangeGraphRenderer 
                    ? this._stateController._bounds 
                    : (this._stateController._selection || this._stateController._bounds);
                shadowParams.selectionBounds = selection || bounds;
            }

            this._shadowProgram.draw(getIndividualPoints(false, true), shadowParams);
            
            if (this._webgl) {
                const gl = this._context;
                gl.disable(gl.BLEND);
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            }
            
            if (singleSeries.zeroLineWidth && singleSeries.zeroLineWidth > 0) {
                if (this._context2d) {
                    this._context2d.save();
                    this._context2d.strokeStyle = singleSeries.zeroLineColor || getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex);
                    this._context2d.lineWidth = singleSeries.zeroLineWidth;
                    this._context2d.globalCompositeOperation = 'source-over';
                    
                    this._context2d.beginPath();
                    this._context2d.moveTo(0, zero);
                    this._context2d.lineTo(this._sizing.renderWidth, zero);
                    this._context2d.stroke();
                    this._context2d.restore();
                } else {
                    if (!this._zeroLineCanvas) {
                        this._zeroLineCanvas = document.createElement('canvas');
                        this._zeroLineCanvas.style.position = 'absolute';
                        this._zeroLineCanvas.style.top = '0';
                        this._zeroLineCanvas.style.left = '0';
                        this._zeroLineCanvas.style.pointerEvents = 'none';
                        this._zeroLineContext = this._zeroLineCanvas.getContext('2d');
                        this._canvas.parentNode.insertBefore(this._zeroLineCanvas, this._canvas.nextSibling);
                    }
                    
                    this._zeroLineCanvas.width = this._canvas.width;
                    this._zeroLineCanvas.height = this._canvas.height;
                    this._zeroLineCanvas.style.width = this._canvas.style.width;
                    this._zeroLineCanvas.style.height = this._canvas.style.height;
                    
                    this._zeroLineContext.clearRect(0, 0, this._zeroLineCanvas.width, this._zeroLineCanvas.height);
                    this._zeroLineContext.strokeStyle = singleSeries.zeroLineColor || getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex);
                    this._zeroLineContext.lineWidth = singleSeries.zeroLineWidth;
                    
                    this._zeroLineContext.beginPath();
                    this._zeroLineContext.moveTo(0, zero);
                    this._zeroLineContext.lineTo(this._sizing.renderWidth, zero);
                    this._zeroLineContext.stroke();
                }
            }
        }

        const shouldShowIndividualPoints = typeof singleSeries.showIndividualPoints === 'boolean' ? singleSeries.showIndividualPoints : showIndividualPoints;

        const drawParams = {
            color: getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex),
            context: this._context,
            width: width || singleSeries.width || defaultLineWidth,
            shadowColor,
            shadowBlur,
            dashed: singleSeries.dashed,
            dashPattern: singleSeries.dashPattern,
            highlighted,
            showIndividualPoints: shouldShowIndividualPoints,
            getIndividualPoints,
            getRanges: singleSeries.rangeKey ? getRanges : null,
            rendering: singleSeries.rendering  // Pass rendering type for all charts
        };

        if (!inRenderSpace) {
            console.error('inRenderSpace is null for line rendering');
            return;
        }
        
        if (singleSeries.cutoffTime) {
            drawParams.cutoffIndex = cutoffIndex;
            drawParams.cutoffOpacity = 0.35;
            drawParams.originalData = cutoffData;
            drawParams.renderCutoffGradient = cutoffIndex >= 0;
            drawParams.currentBounds = bounds;
            drawParams.isPreview = this === this._stateController.rangeGraphRenderer;
            
            const selection = this === this._stateController.rangeGraphRenderer 
                ? this._stateController._bounds 
                : (this._stateController._selection || this._stateController._bounds);
            drawParams.selectionBounds = selection || bounds;    
        }
        
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
        return this._sizing?.boundingRect;
    }

    get sizing() {
        return this._sizing;
    }

}
