precision highp float;

attribute vec2 position;
attribute vec2 prevPosition;
attribute float vertex;

uniform float width;
uniform float height;
uniform float thickness;

varying vec2 position_vec;
varying vec2 prev_position_vec;

void main() {
    vec2 delta = position - prevPosition;
    vec2 alpha = prevPosition;
    vec2 beta = position;

    vec2 normalized_delta = normalize(delta);
    vec2 normal = vec2(-thickness/2.0 * normalized_delta.y, thickness/2.0 * normalized_delta.x);

    vec2 vertex_position =
        step(0.5, mod(vertex, 2.0))*alpha + // alpha if vertex is odd, 0 otherwise
        step(0.5, mod(vertex + 1.0, 2.0))*beta + // beta if vertex is even, 0 otherwise
        2.0*(step(1.5, vertex)-0.5)*normal // -normal if vertex < 2, +normal otherwise
    ;

    position_vec = vec2(position.x, height - position.y);
    prev_position_vec = vec2(prevPosition.x, height - prevPosition.y);

    gl_Position = vec4(2.0*vertex_position.x/width - 1.0, 1.0 - 2.0*vertex_position.y/height, 0.0, 1.0);
}
