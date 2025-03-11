import backgroundFrag from './background.frag';
import backgroundVert from './background.vert';
import colorToVector from '../helpers/color_to_vector';
import createGLProgram from './create_gl_program';

export default class BackgroundProgram {

    constructor(gl) {
        this._gl = gl;

        this._program = createGLProgram(gl, backgroundVert, backgroundFrag);

        this._vertexBuffer = gl.createBuffer();
        this._indexBuffer = gl.createBuffer();

        if (!gl.getExtension('OES_element_index_uint')) {
            console.error('Your browser does not support OES_element_index_uint'); // eslint-disable-line no-console
        }
    }

    draw({ data }) {
        const gl = this._gl;
        gl.useProgram(this._program);

        // gl.disable(gl.DEPTH_TEST);

        for (let { minXt, maxXt, color } of data) {
            gl.uniform4f(gl.getUniformLocation(this._program, 'color'), ...colorToVector(color));

            const vertices = new Float32Array([
                minXt, 1, maxXt, 1, maxXt, -1,
                minXt, 1, maxXt, -1, minXt, -1
            ]);

            gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            const positionLocation = gl.getAttribLocation(this._program, 'position');
            gl.enableVertexAttribArray(positionLocation);
            gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }

}
