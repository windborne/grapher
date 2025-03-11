#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

precision mediump float;

uniform vec4 color;

// Adapted and modified from https://www.desultoryquest.com/blog/drawing-anti-aliased-circular-points-using-opengl-slash-webgl/
void main() {
    float delta = 0.0;
    float alpha = 1.0;
    vec2 center = 2.0 * gl_PointCoord - 1.0;
    float r = dot(center, center);

    if (r > 1.0) {
        discard;
    }

    #ifdef GL_OES_standard_derivatives
    delta = fwidth(r);
    alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
    #endif

    gl_FragColor = color * alpha;
}
