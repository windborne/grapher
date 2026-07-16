#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision mediump float;

uniform vec4 color;
uniform float shape; // 0=circle, 1=square, 2=triangle, 3=diamond

// Adapted and modified from https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
void main() {
    float delta = 0.0;
    float alpha = 1.0;
    vec2 center = 2.0 * gl_PointCoord - 1.0;

    // Signed field: negative/zero inside the shape, positive outside, so every
    // shape shares the same discard + antialias path below.
    float d;

    if (shape < 0.5) {
        // circle
        d = dot(center, center) - 1.0;
    } else if (shape < 1.5) {
        // square (slight inset so it optically matches the circle diameter)
        d = max(abs(center.x), abs(center.y)) - 0.9;
    } else if (shape < 2.5) {
        // triangle, apex up: inside when y >= 2|x| - 1 (point coords have +y down)
        d = (2.0 * abs(center.x) - 1.0) - center.y;
    } else {
        // diamond
        d = abs(center.x) + abs(center.y) - 1.0;
    }

    if (d > 0.0) {
        discard;
    }

    #ifdef GL_OES_standard_derivatives
    delta = fwidth(d);
    alpha = 1.0 - smoothstep(-delta, delta, d);
    #endif

    gl_FragColor = color * alpha;
}
