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
        return texture2D(gradientTexture, vec2(0.5 / float(gradientCount * 2), 0.5));
    }

    float textureWidth = float(gradientCount * 2);
    float firstStop = texture2D(gradientTexture, vec2(0.5 / textureWidth, 0.5)).r;
    float lastStop = texture2D(gradientTexture, vec2((float((gradientCount - 1) * 2) + 0.5) / textureWidth, 0.5)).r;
    
    // Scale position to fit the gradient range
    if (lastStop > firstStop) {
        position = firstStop + position * (lastStop - firstStop);
    }
    
    position = clamp(position, 0.0, 1.0);

    // Handle boundary cases first
    vec4 firstColor = texture2D(gradientTexture, vec2(1.5 / textureWidth, 0.5));
    vec4 lastColor = texture2D(gradientTexture, vec2((float((gradientCount - 1) * 2 + 1) + 0.5) / textureWidth, 0.5));
    
    if (position <= firstStop) return firstColor;
    if (position >= lastStop) return lastColor;
    
    // Calculate normalized position within the gradient range
    float normalizedPos = (position - firstStop) / max(lastStop - firstStop, 0.001);
    normalizedPos = clamp(normalizedPos, 0.0, 1.0);
    
    // Map to segment index using only float operations
    float segmentFloat = normalizedPos * float(gradientCount - 1);
    float segmentIndex = floor(segmentFloat);
    
    // Ensure segment index is within valid bounds using float operations
    segmentIndex = min(segmentIndex, float(gradientCount - 2));
    segmentIndex = max(segmentIndex, 0.0);
    
    // Calculate texture coordinates for the two colors to interpolate
    float texCoordA = (segmentIndex * 2.0 + 1.0 + 0.5) / textureWidth;
    float texCoordB = ((segmentIndex + 1.0) * 2.0 + 1.0 + 0.5) / textureWidth;
    
    // Sample the two colors
    vec4 colorA = texture2D(gradientTexture, vec2(texCoordA, 0.5));
    vec4 colorB = texture2D(gradientTexture, vec2(texCoordB, 0.5));
    
    // Get the actual gradient stops for proper interpolation
    float stopA = texture2D(gradientTexture, vec2((segmentIndex * 2.0 + 0.5) / textureWidth, 0.5)).r;
    float stopB = texture2D(gradientTexture, vec2(((segmentIndex + 1.0) * 2.0 + 0.5) / textureWidth, 0.5)).r;
    
    // Calculate interpolation factor based on actual stop positions
    float stopRange = stopB - stopA;
    float t = stopRange > 0.001 ? (position - stopA) / stopRange : 0.0;
    t = clamp(t, 0.0, 1.0);
    
    return mix(colorA, colorB, t);
}

void main() {
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
