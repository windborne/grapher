precision mediump float;

attribute vec2 position;

uniform float width;
uniform float height;
uniform float pointSize;

void main() {
    gl_Position = vec4(2.0*position.x/width - 1.0, 1.0 - 2.0*position.y/height, 0.0, 1.0);
    gl_PointSize = pointSize;
}