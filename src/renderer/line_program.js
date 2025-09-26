import lineFrag from './line.frag';
import lineVert from './line.vert';
import circleFrag from './circle.frag';
import circleVert from './circle.vert';
import colorToVector from '../helpers/color_to_vector';
import extractVertices from './extract_vertices';
import createGLProgram from './create_gl_program';
import {DPI_INCREASE} from './size_canvas';
import { applyReducedOpacity } from "../helpers/colors";

export default class LineProgram {

    constructor(gl) {
        this._gl = gl;

        this._program = createGLProgram(gl, lineVert, lineFrag);
        this._circleProgram = createGLProgram(gl, circleVert, circleFrag);

        this._positionBuffer = gl.createBuffer();
        this._prevPositionBuffer = gl.createBuffer();
        this._vertexBuffer = gl.createBuffer();
        this._indexBuffer = gl.createBuffer();
        this._individualPointBuffer = gl.createBuffer();

        if (!gl.getExtension('OES_element_index_uint')) {
            console.error('Your browser does not support OES_element_index_uint'); // eslint-disable-line no-console
        }
    }

    dispose() {

    }

    clear() {
        const gl = this._gl;
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;

        gl.clearColor(0, 0, 0, 0);
        gl.viewport(0, 0, width, height);
    }

    /**
     * Draws the data on the canvas
     * Assumes the data is in render space
     *
     * @param {{nullMask: Uint8Array, maxYValues: Float64Array, minYValues: Float64Array, yValues: Float64Array}} dataInRenderSpace        - the data to render
     * @param {Object} parameters                           - set of options
     * @param {String} parameters.color                     - color of the line to draw
     * @param {Number} [parameters.width]                   - line width
     * @param {Number} [parameters.shadowBlur]              - level to blur shadow to
     * @param {String} [parameters.shadowColor]             - color of the shadow
     * @param {String} [parameters.dashed]                  - whether or not to make the line dashed
     * @param {Array<Number>} [parameters.dashPattern]      - dash array for the canvas
     * @param {Boolean} [parameters.highlighted]            - whether the line is highlighted or not
     * @param {Boolean} [parameters.showIndividualPoints]   - draw circles at each point
     * @param {Function} [parameters.getIndividualPoints]   - points to draw circles at. Only called when needed.
     * @private
     */
    draw(dataInRenderSpace, parameters) {
        const gl = this._gl;
        const width = gl.drawingBufferWidth;
        const height = gl.drawingBufferHeight;
        gl.useProgram(this._program);

        const thickness = DPI_INCREASE*((parameters.width || 1) + (parameters.highlighted ? 2 : 0));
        const shadowBlur = parameters.shadowBlur === undefined ? 2 : parameters.shadowBlur;
        const shadowColor = parameters.shadowColor || 'black';
        const dashed = parameters.dashed || false;
        const dashPattern = parameters.dashPattern || [5, 5];
        if (parameters.renderCutoffGradient && parameters.cutoffIndex !== undefined && parameters.originalData) {
            this.drawLineWithCutoff(dataInRenderSpace, parameters);
            return;
        }

        const {positions, prevPositions, vertices, indices} = extractVertices(dataInRenderSpace, { dashed, dashPattern });

        if (!this._program) {
            console.error('WebGL line program is null - shader compilation failed!');
            return;
        }

        const positionIndex = gl.getAttribLocation(this._program, 'position');
        const prevPositionIndex = gl.getAttribLocation(this._program, 'prevPosition');
        const vertexIndex = gl.getAttribLocation(this._program, 'vertex');

        gl.enableVertexAttribArray(positionIndex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(positionIndex, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(prevPositionIndex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._prevPositionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, prevPositions, gl.STATIC_DRAW);
        gl.vertexAttribPointer(prevPositionIndex, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(vertexIndex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(vertexIndex, 1, gl.FLOAT, false, 0, 0);

        gl.uniform1f(gl.getUniformLocation(this._program, 'width'), width);
        gl.uniform1f(gl.getUniformLocation(this._program, 'height'), height);
        gl.uniform1f(gl.getUniformLocation(this._program, 'thickness'), Math.max(thickness, 1)+shadowBlur);
        gl.uniform1f(gl.getUniformLocation(this._program, 'shadowBlur'), shadowBlur);
        const colorVector = colorToVector(parameters.color);
        gl.uniform4f(gl.getUniformLocation(this._program, 'color'), ...colorVector);
        gl.uniform4f(gl.getUniformLocation(this._program, 'shadowColor'), ...colorToVector(shadowColor));
        
        const cutoffX = parameters.cutoffX !== undefined ? parameters.cutoffX : -1.0; // Use parameter or disable
        const cutoffOpacity = parameters.cutoffOpacity !== undefined ? parameters.cutoffOpacity : 0.35;
        
        gl.uniform1f(gl.getUniformLocation(this._program, 'cutoffX'), cutoffX);
        gl.uniform1f(gl.getUniformLocation(this._program, 'cutoffOpacity'), cutoffOpacity);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);

        if (parameters.showIndividualPoints) {
            gl.useProgram(this._circleProgram);

            gl.uniform1f(gl.getUniformLocation(this._circleProgram, 'width'), width);
            gl.uniform1f(gl.getUniformLocation(this._circleProgram, 'height'), height);
            gl.uniform1f(gl.getUniformLocation(this._circleProgram, 'pointSize'), 2*(thickness+6));

            const individualPoints = parameters.getIndividualPoints();

            if (parameters.cutoffIndex !== undefined && parameters.cutoffIndex > 0 && parameters.originalData) {
                const { originalData } = parameters;
                let cutoffTime;
                
                if (typeof originalData[0] === 'object' && originalData[0].length === 2) {
                    const baseIndex = Math.floor(parameters.cutoffIndex);
                    const fraction = parameters.cutoffIndex - baseIndex;
                    
                    if (fraction === 0 || baseIndex >= originalData.length - 1) {
                        const cutoffDate = originalData[Math.min(baseIndex, originalData.length - 1)][0];
                        cutoffTime = cutoffDate instanceof Date ? cutoffDate.getTime() : cutoffDate;
                    } else {
                        const currentDate = originalData[baseIndex][0];
                        const nextDate = originalData[baseIndex + 1][0];
                        const currentTime = currentDate instanceof Date ? currentDate.getTime() : currentDate;
                        const nextTime = nextDate instanceof Date ? nextDate.getTime() : nextDate;
                        cutoffTime = currentTime + fraction * (nextTime - currentTime);
                    }
                }
                
                const preCutoffPoints = [];
                const postCutoffPoints = [];

                if (parameters.isPreview) {
                    const firstTime = originalData[0][0] instanceof Date ? originalData[0][0].getTime() : originalData[0][0];
                    const lastTime = originalData[originalData.length - 1][0] instanceof Date ? 
                        originalData[originalData.length - 1][0].getTime() : originalData[originalData.length - 1][0];
                    const timeRatio = (cutoffTime - firstTime) / (lastTime - firstTime);
                    
                    for (let i = 0; i < individualPoints.length; i++) {
                        const pointRatio = i / (individualPoints.length - 1);
                        if (pointRatio < timeRatio) {
                            preCutoffPoints.push(individualPoints[i]);
                        } else {
                            postCutoffPoints.push(individualPoints[i]);
                        }
                    }
                } else if (!parameters.selectionBounds) {
                    postCutoffPoints.push(...individualPoints);
                } else {
                    const visibleMinTime = parameters.selectionBounds.minX instanceof Date ? 
                        parameters.selectionBounds.minX.getTime() : parameters.selectionBounds.minX;
                    const visibleMaxTime = parameters.selectionBounds.maxX instanceof Date ? 
                        parameters.selectionBounds.maxX.getTime() : parameters.selectionBounds.maxX;
                
                if (cutoffTime < visibleMinTime) {
                    postCutoffPoints.push(...individualPoints);
                } else if (cutoffTime > visibleMaxTime) {
                    if (parameters.rendering === 'shadow') {
                        postCutoffPoints.push(...individualPoints);
                    } else {
                        preCutoffPoints.push(...individualPoints);
                    }
                } else {
                    const visibleCutoffRatio = (cutoffTime - visibleMinTime) / (visibleMaxTime - visibleMinTime);
                    const renderWidth = this._gl.canvas.width;
                    const cutoffPixelX = visibleCutoffRatio * renderWidth;
                    
                    individualPoints.forEach((point, index) => {
                        const [pixelX, pixelY] = point;
                        
                        if (pixelX < cutoffPixelX) {
                            preCutoffPoints.push(point);
                        } else {
                            postCutoffPoints.push(point);
                        }
                    });
                    }
                }
                
                if (preCutoffPoints.length > 0) {
                    const reducedOpacityColor = applyReducedOpacity(parameters.color, parameters.cutoffOpacity || 0.35);
                    gl.uniform4f(gl.getUniformLocation(this._circleProgram, 'color'), ...colorToVector(reducedOpacityColor));
                    
                    gl.enableVertexAttribArray(0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, this._individualPointBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(preCutoffPoints.flat()), gl.STATIC_DRAW);
                    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                    gl.drawArrays(gl.POINTS, 0, preCutoffPoints.length);
                }
                
                if (postCutoffPoints.length > 0) {
                    gl.uniform4f(gl.getUniformLocation(this._circleProgram, 'color'), ...colorToVector(parameters.color));
                    
                    gl.enableVertexAttribArray(0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, this._individualPointBuffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(postCutoffPoints.flat()), gl.STATIC_DRAW);
                    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
                    gl.drawArrays(gl.POINTS, 0, postCutoffPoints.length);
                }
            } else {
                gl.uniform4f(gl.getUniformLocation(this._circleProgram, 'color'), ...colorToVector(parameters.color));

                gl.enableVertexAttribArray(0);
                gl.bindBuffer(gl.ARRAY_BUFFER, this._individualPointBuffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(individualPoints.flat()), gl.STATIC_DRAW);
                gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

                gl.drawArrays(gl.POINTS, 0, individualPoints.length);
            }
        }
    }

    drawLineWithCutoff(dataInRenderSpace, parameters) {
        const { cutoffIndex, cutoffOpacity, originalData, selectionBounds } = parameters;
        
        let cutoffTime;
        if (typeof originalData[0] === 'object' && originalData[0].length === 2) {
            const baseIndex = Math.floor(cutoffIndex);
            const fraction = cutoffIndex - baseIndex;
            
            if (fraction === 0 || baseIndex >= originalData.length - 1) {
                const cutoffDate = originalData[Math.min(baseIndex, originalData.length - 1)][0];
                cutoffTime = cutoffDate instanceof Date ? cutoffDate.getTime() : cutoffDate;
            } else {
                const currentDate = originalData[baseIndex][0];
                const nextDate = originalData[baseIndex + 1][0];
                const currentTime = currentDate instanceof Date ? currentDate.getTime() : currentDate;
                const nextTime = nextDate instanceof Date ? nextDate.getTime() : nextDate;
                cutoffTime = currentTime + fraction * (nextTime - currentTime);
            }
        } else {
            cutoffTime = cutoffIndex; 
        }

        if (parameters.isPreview) {
            const firstTime = originalData[0][0] instanceof Date ? originalData[0][0].getTime() : originalData[0][0];
            const lastTime = originalData[originalData.length - 1][0] instanceof Date ? 
                originalData[originalData.length - 1][0].getTime() : originalData[originalData.length - 1][0];
            const timeRatio = (cutoffTime - firstTime) / (lastTime - firstTime);
            
            if (timeRatio < 0) {
                this.draw(dataInRenderSpace, { ...parameters, renderCutoffGradient: false });
            } else if (timeRatio > 1) {
                const reducedOpacityColor = applyReducedOpacity(parameters.color, cutoffOpacity);
                this.draw(dataInRenderSpace, { 
                    ...parameters, 
                    color: reducedOpacityColor,
                    renderCutoffGradient: false 
                });
            } else {
                const gl = this._gl;
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                
                this.draw(dataInRenderSpace, {
                    ...parameters,
                    renderCutoffGradient: false,
                    cutoffX: timeRatio,
                    cutoffOpacity: cutoffOpacity || 0.35
                });
            }
        } else {
            if (!selectionBounds) {
                this.draw(dataInRenderSpace, { ...parameters, renderCutoffGradient: false });
                return;
            }
        
            const visibleMinTime = selectionBounds.minX instanceof Date ? selectionBounds.minX.getTime() : selectionBounds.minX;
            const visibleMaxTime = selectionBounds.maxX instanceof Date ? selectionBounds.maxX.getTime() : selectionBounds.maxX;

            if (cutoffTime < visibleMinTime) {
                this.draw(dataInRenderSpace, { ...parameters, renderCutoffGradient: false });
            } else if (cutoffTime > visibleMaxTime) {
                const reducedOpacityColor = applyReducedOpacity(parameters.color, cutoffOpacity);
                this.draw(dataInRenderSpace, { 
                    ...parameters, 
                    color: reducedOpacityColor,
                    renderCutoffGradient: false 
                });
            } else {
                const visibleCutoffRatio = (cutoffTime - visibleMinTime) / (visibleMaxTime - visibleMinTime);
                
                const gl = this._gl;
                gl.enable(gl.BLEND);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
                
                this.draw(dataInRenderSpace, {
                    ...parameters,
                    renderCutoffGradient: false,
                    cutoffX: visibleCutoffRatio,
                    cutoffOpacity: cutoffOpacity || 0.35
                });
            }
        }
    }
}
