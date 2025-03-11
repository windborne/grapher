precision highp float;

uniform vec4 color;
uniform float thickness;
uniform float shadowBlur;
uniform vec4 shadowColor;

varying vec2 position_vec;
varying vec2 prev_position_vec;

/**
 * Calculate distance between point and line in screen space (ie, inputs in pixels, returns distance in pixels)
 */
float distance_from_line() {
    float x0 = gl_FragCoord.x;
    float y0 = gl_FragCoord.y;

    // let line be defined by ax + by + c = 0;
    float a, b, c;

    if (position_vec.x == prev_position_vec.x) {
        a = 1.0;
        b = 0.0;
        c = -position_vec.x;
    } else {
        float slope = (position_vec.y - prev_position_vec.y)/(position_vec.x - prev_position_vec.x);
        float y_intercept = position_vec.y - slope*position_vec.x;

        // y = slope*x + y_intercept
        // (-slope)(x) + (1)(y) - y_intercept = 0;
        a = -slope;
        b = 1.0;
        c = -y_intercept;
    }

    return abs(a*x0 + b*y0 + c)/length(vec2(a, b));
}

void main() {
    vec4 transparent = vec4(0.0, 0.0, 0.0, 0.0);

    float dist = distance_from_line();

    if (dist + shadowBlur >= thickness) {
        float percent_shadowed = ((thickness - dist) / shadowBlur);
        gl_FragColor = mix(transparent, shadowColor, percent_shadowed*percent_shadowed);
    } else {
        gl_FragColor = vec4(color);
        gl_FragColor.rgb *= gl_FragColor.a;
    }
}
