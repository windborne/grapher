precision highp float;

attribute vec2 position;

void main() {
    gl_Position = vec4((position - 0.5)*2.0, 0.0, 1.0);
}
