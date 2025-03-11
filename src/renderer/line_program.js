import lineFrag from './line.frag';
import lineVert from './line.vert';
import circleFrag from './circle.frag';
import circleVert from './circle.vert';
import colorToVector from '../helpers/color_to_vector';
import extractVertices from './extract_vertices';
import createGLProgram from './create_gl_program';
import {DPI_INCREASE} from './size_canvas';

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
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT);
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

        // gl.disable(gl.DEPTH_TEST);

        const thickness = DPI_INCREASE*((parameters.width || 1) + (parameters.highlighted ? 2 : 0));
        const shadowBlur = parameters.shadowBlur === undefined ? 2 : parameters.shadowBlur;
        const shadowColor = parameters.shadowColor || 'black';
        const dashed = parameters.dashed || false;
        const dashPattern = parameters.dashPattern || [5, 5];

        const {positions, prevPositions, vertices, indices} = extractVertices(dataInRenderSpace, { dashed, dashPattern });

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
        gl.uniform4f(gl.getUniformLocation(this._program, 'color'), ...colorToVector(parameters.color));
        gl.uniform4f(gl.getUniformLocation(this._program, 'shadowColor'), ...colorToVector(shadowColor));

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);

        if (parameters.showIndividualPoints) {
            gl.useProgram(this._circleProgram);

            gl.uniform1f(gl.getUniformLocation(this._circleProgram, 'width'), width);
            gl.uniform1f(gl.getUniformLocation(this._circleProgram, 'height'), height);
            gl.uniform1f(gl.getUniformLocation(this._circleProgram, 'pointSize'), 2*(thickness+6));
            gl.uniform4f(gl.getUniformLocation(this._circleProgram, 'color'), ...colorToVector(parameters.color));

            const individualPoints = parameters.getIndividualPoints();

            gl.enableVertexAttribArray(0);
            gl.bindBuffer(gl.ARRAY_BUFFER, this._individualPointBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(individualPoints.flat()), gl.STATIC_DRAW);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.POINTS, 0, individualPoints.length);
        }
    }

}
