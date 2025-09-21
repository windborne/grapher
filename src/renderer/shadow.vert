precision highp float;

attribute vec2 position;
attribute vec4 trapezoidBounds; // [x1, y1_line, x2, y2_line] - the line segment  
attribute vec4 trapezoidBottom; // [x1, y1_bottom, x2, y2_bottom] - the bottom segment

uniform float width;
uniform float height;

varying vec4 trapBounds;  // Pass trapezoid line bounds to fragment
varying vec4 trapBottom;  // Pass trapezoid bottom bounds to fragment  
varying vec2 worldPos;    // Pass world position

void main() {
    trapBounds = trapezoidBounds;
    trapBottom = trapezoidBottom;
    worldPos = position;
    
    gl_Position = vec4(2.0*position.x/width - 1.0, 1.0 - 2.0*position.y/height, 0.0, 1.0);
}
