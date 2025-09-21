precision highp float;

varying vec4 trapBounds;  // [x1, lineY1, x2, lineY2]
varying vec4 trapBottom;  // [x1, bottomY1, x2, bottomY2]  
varying vec2 worldPos;    // World position

uniform int gradientCount;
uniform sampler2D gradientTexture;  // Texture containing gradient data
uniform vec4 fallbackColor;

vec4 interpolateGradient(float position) {
    if (gradientCount <= 0) {
        return fallbackColor;
    }
    if (gradientCount == 1) {
        // Sample first color from texture
        return texture2D(gradientTexture, vec2(0.5 / float(gradientCount * 2), 0.5));
    }

    // Declare variables once at the top
    float textureWidth = float(gradientCount * 2);
    float firstStop = texture2D(gradientTexture, vec2(0.5 / textureWidth, 0.5)).r;
    float lastStop = texture2D(gradientTexture, vec2((float((gradientCount - 1) * 2) + 0.5) / textureWidth, 0.5)).r;
    
    // Scale position to fit the gradient range
    // If gradient goes from 0.0 to 0.5, map shadow area 0.0-1.0 to gradient 0.0-0.5
    if (lastStop > firstStop) {
        position = firstStop + position * (lastStop - firstStop);
    }
    
    // Clamp position to [0.0, 1.0]
    position = clamp(position, 0.0, 1.0);

    // Find which interval this position belongs to by sampling gradient stops
    for (int i = 0; i < 15; i++) { // Max 15 intervals (16 stops)
        if (i >= gradientCount - 1) break;

        float stopA = texture2D(gradientTexture, vec2((float(i * 2) + 0.5) / textureWidth, 0.5)).r;
        float stopB = texture2D(gradientTexture, vec2((float((i + 1) * 2) + 0.5) / textureWidth, 0.5)).r;

        if (position >= stopA && position <= stopB) {
            // Sample colors from texture
            vec4 colorA = texture2D(gradientTexture, vec2((float(i * 2 + 1) + 0.5) / textureWidth, 0.5));
            vec4 colorB = texture2D(gradientTexture, vec2((float((i + 1) * 2 + 1) + 0.5) / textureWidth, 0.5));
            
            float t = (stopB - stopA) > 0.001 ? (position - stopA) / (stopB - stopA) : 0.0;
            return mix(colorA, colorB, t);
        }
    }

    // Handle edge cases - sample first and last colors
    vec4 firstColor = texture2D(gradientTexture, vec2(1.5 / textureWidth, 0.5));
    vec4 lastColor = texture2D(gradientTexture, vec2((float((gradientCount - 1) * 2 + 1) + 0.5) / textureWidth, 0.5));
    
    if (position < firstStop) {
        return firstColor;
    }
    if (position > lastStop) {
        return lastColor;
    }

    return fallbackColor;
}

void main() {
    // TRUE vertical strip gradient: interpolate line Y and bottom Y at this X position
    float pixelX = worldPos.x;
    float pixelY = worldPos.y;
    
    // Extract trapezoid corners
    float x1 = trapBounds.x;
    float lineY1 = trapBounds.y;
    float x2 = trapBounds.z;
    float lineY2 = trapBounds.w;
    
    float bottomX1 = trapBottom.x;
    float bottomY1 = trapBottom.y;
    float bottomX2 = trapBottom.z;
    float bottomY2 = trapBottom.w;
    
    // Interpolate line Y at current pixel X
    float t = (pixelX - x1) / (x2 - x1 + 0.001); // Avoid division by zero
    t = clamp(t, 0.0, 1.0);
    
    float lineYAtPixel = mix(lineY1, lineY2, t);
    float bottomYAtPixel = mix(bottomY1, bottomY2, t);
    
    // Calculate gradient position: 0.0 at line, 1.0 at bottom
    float totalDistance = abs(bottomYAtPixel - lineYAtPixel);
    float gradientPos = totalDistance > 0.001 ? 
                       abs(pixelY - lineYAtPixel) / totalDistance : 0.0;
    
    vec4 color = interpolateGradient(gradientPos);
    gl_FragColor = color;
}
