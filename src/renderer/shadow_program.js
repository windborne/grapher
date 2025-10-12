import shadowFrag from "./shadow.frag";
import shadowVert from "./shadow.vert";
import colorToVector from "../helpers/color_to_vector";
import createGLProgram from "./create_gl_program";
import { applyReducedOpacity, applyReducedOpacityToGradient } from "../helpers/colors";

export default class ShadowProgram {
  constructor(gl) {
    this._gl = gl;

    this._program = createGLProgram(gl, shadowVert, shadowFrag);

    if (!this._program) {
      console.error("Failed to create shadow shader program");
      this._program = null;
      return;
    }

    gl.validateProgram(this._program);
    if (!gl.getProgramParameter(this._program, gl.VALIDATE_STATUS)) {
      console.error(
        "Shadow program validation failed:",
        gl.getProgramInfoLog(this._program)
      );
    }

    const positionLoc = gl.getAttribLocation(this._program, "position");
    const trapezoidBoundsLoc = gl.getAttribLocation(
      this._program,
      "trapezoidBounds"
    );
    const trapezoidBottomLoc = gl.getAttribLocation(
      this._program,
      "trapezoidBottom"
    );

    if (
      positionLoc === -1 ||
      trapezoidBoundsLoc === -1 ||
      trapezoidBottomLoc === -1
    ) {
      console.error("Missing required shader attributes");
    }

    this._positionBuffer = gl.createBuffer();
    this._trapezoidBoundsBuffer = gl.createBuffer();
    this._trapezoidBottomBuffer = gl.createBuffer();
    this._indexBuffer = gl.createBuffer();

    this._gradientTexture = gl.createTexture();

    if (!gl.getExtension("OES_element_index_uint")) {
      console.error("Your browser does not support OES_element_index_uint");
    }
  }

  dispose() {
    const gl = this._gl;
    if (this._gradientTexture) {
      gl.deleteTexture(this._gradientTexture);
      this._gradientTexture = null;
    }
  }

  /**
   * Convert trapezoids into WebGL geometry
   * @param {Array} trapezoids - Array of trapezoid definitions
   * @returns {Object} - Geometry data for WebGL
   */
  generateTrapezoidGeometry(trapezoids) {
    const positions = [];
    const trapezoidBounds = [];
    const trapezoidBottom = [];
    const indices = [];

    let vertexIndex = 0;

    for (const trap of trapezoids) {
      const { x1, y1, x2, y2, bottomY1, bottomY2 } = trap;

      const vertices = [
        [x1, y1],
        [x2, y2],
        [x2, bottomY2],
        [x1, bottomY1],
      ];

      const bounds = [x1, y1, x2, y2];
      const bottom = [x1, bottomY1, x2, bottomY2];

      for (let i = 0; i < 4; i++) {
        const [x, y] = vertices[i];

        positions.push(x, y);
        trapezoidBounds.push(...bounds);
        trapezoidBottom.push(...bottom);
      }

      indices.push(
        vertexIndex,
        vertexIndex + 1,
        vertexIndex + 2,
        vertexIndex,
        vertexIndex + 2,
        vertexIndex + 3
      );

      vertexIndex += 4;
    }

    return {
      positions: new Float32Array(positions),
      trapezoidBounds: new Float32Array(trapezoidBounds),
      trapezoidBottom: new Float32Array(trapezoidBottom),
      indices: new Uint32Array(indices),
    };
  }

  /**
   * Parse gradient definition to shader uniforms (supports up to 16 stops)
   * @param {Array} gradient - Gradient definition
   * @param {String} fallbackColor - Fallback color
   * @returns {Object} - Shader uniform data
   */
  parseGradient(gradient, fallbackColor) {
    if (!gradient || !Array.isArray(gradient) || gradient.length < 2) {
      const fallbackColorVec = colorToVector(fallbackColor);
      return {
        textureData: new Uint8Array([
          0,
          0,
          0,
          255,
          Math.floor(fallbackColorVec[0] * 255),
          Math.floor(fallbackColorVec[1] * 255),
          Math.floor(fallbackColorVec[2] * 255),
          Math.floor(fallbackColorVec[3] * 255),
        ]),
        textureWidth: 2,
        gradientCount: 1,
        fallbackColor: fallbackColorVec,
      };
    }

    const colors = [];
    const stops = [];

    for (let i = 0; i < gradient.length; i++) {
      const item = gradient[i];

      if (Array.isArray(item)) {
        stops.push(item[0]);
        colors.push(colorToVector(item[1]));
      } else {
        stops.push(i / (gradient.length - 1));
        colors.push(colorToVector(item));
      }
    }

    const textureWidth = colors.length * 2;
    const textureData = new Uint8Array(textureWidth * 4);

    for (let i = 0; i < colors.length; i++) {
      const stopIndex = i * 8;
      const colorIndex = stopIndex + 4;

      textureData[stopIndex] = Math.floor(stops[i] * 255);
      textureData[stopIndex + 1] = 0;
      textureData[stopIndex + 2] = 0;
      textureData[stopIndex + 3] = 255;

      textureData[colorIndex] = Math.floor(colors[i][0] * 255);
      textureData[colorIndex + 1] = Math.floor(colors[i][1] * 255);
      textureData[colorIndex + 2] = Math.floor(colors[i][2] * 255);
      textureData[colorIndex + 3] = Math.floor(colors[i][3] * 255);
    }

    return {
      textureData,
      textureWidth,
      gradientCount: colors.length,
      fallbackColor: colorToVector(fallbackColor),
    };
  }

  /**
   * Draw shadow/trapezoid geometry
   * @param {Array} individualPoints - Points defining the line
   * @param {Object} params - Rendering parameters
   */
  draw(individualPoints, params) {

    if (!individualPoints || individualPoints.length < 2) {
      return;
    }

    const gl = this._gl;
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    gl.useProgram(this._program);

    if (
      params.renderCutoffGradient &&
      params.cutoffIndex !== undefined &&
      params.originalData
    ) {
      this.drawShadowWithCutoff(individualPoints, params);
      return;
    }

    const trapezoids = [];
    const positiveTrapezoids = [];
    const negativeTrapezoids = [];
    const { zero, inRenderSpaceAreaBottom, negativeGradient, hasNegatives } = params;


    for (let i = 0; i < individualPoints.length - 1; i++) {
      const [x1, y1] = individualPoints[i];
      const [x2, y2] = individualPoints[i + 1];

      let bottomY1 = zero;
      let bottomY2 = zero;

      const y1RelativeToZero = y1 - zero;
      const y2RelativeToZero = y2 - zero;
      const crossesZero = y1RelativeToZero * y2RelativeToZero < 0;

      if (crossesZero) {
        const t =
          Math.abs(y1RelativeToZero) /
          (Math.abs(y1RelativeToZero) + Math.abs(y2RelativeToZero));
        const xCross = x1 + (x2 - x1) * t;
        const yCross = zero;

        if (Math.abs(y1 - yCross) > 0.1) {
          const trap = {
            x1,
            y1,
            x2: xCross,
            y2: yCross,
            bottomY1,
            bottomY2: zero,
          };
          trapezoids.push(trap);
          
          // Determine if positive or negative (in screen coords, smaller Y is higher/positive)
          if (hasNegatives && negativeGradient) {
            if (y1 <= zero) {
              positiveTrapezoids.push(trap);
            } else {
              negativeTrapezoids.push(trap);
            }
          }
        }

        if (Math.abs(y2 - yCross) > 0.1) {
          const trap = {
            x1: xCross,
            y1: yCross,
            x2,
            y2,
            bottomY1: zero,
            bottomY2,
          };
          trapezoids.push(trap);
          
          // Determine if positive or negative
          if (hasNegatives && negativeGradient) {
            if (y2 <= zero) {
              positiveTrapezoids.push(trap);
            } else {
              negativeTrapezoids.push(trap);
            }
          }
        }
      } else {
        // Skip trapezoids completely outside canvas
        if (x1 > width || x2 < 0) {
          continue;
        }
        
        // Clip trapezoid to canvas bounds if it extends beyond
        let finalX2 = x2;
        let finalY2 = y2;
        let finalBottomY2 = bottomY2;
        
        if (x2 > width) {
          const ratio = (width - x1) / (x2 - x1);
          finalX2 = width;
          finalY2 = y1 + (y2 - y1) * ratio;
          finalBottomY2 = bottomY1 + (bottomY2 - bottomY1) * ratio;
        }
        
        const trapezoid = { x1, y1, x2: finalX2, y2: finalY2, bottomY1, bottomY2: finalBottomY2 };
        trapezoids.push(trapezoid);
        
        // Determine if positive or negative
        if (hasNegatives && negativeGradient) {
          // Check average Y position
          const avgY = (y1 + finalY2) / 2;
          if (avgY <= zero) {
            positiveTrapezoids.push(trapezoid);
          } else {
            negativeTrapezoids.push(trapezoid);
          }
        }
      }
    }

    if (trapezoids.length === 0) {
      return;
    }

    const positionLoc = gl.getAttribLocation(this._program, "position");
    const trapezoidBoundsLoc = gl.getAttribLocation(
      this._program,
      "trapezoidBounds"
    );
    const trapezoidBottomLoc = gl.getAttribLocation(
      this._program,
      "trapezoidBottom"
    );

    gl.uniform1f(gl.getUniformLocation(this._program, "width"), width);
    gl.uniform1f(gl.getUniformLocation(this._program, "height"), height);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Helper function to render a set of trapezoids with a given gradient
    const renderTrapezoidSet = (trapSet, gradient, color) => {
      if (trapSet.length === 0) return;

      const geometry = this.generateTrapezoidGeometry(trapSet);

      gl.enableVertexAttribArray(positionLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

      gl.enableVertexAttribArray(trapezoidBoundsLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._trapezoidBoundsBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.trapezoidBounds, gl.STATIC_DRAW);
      gl.vertexAttribPointer(trapezoidBoundsLoc, 4, gl.FLOAT, false, 0, 0);

      gl.enableVertexAttribArray(trapezoidBottomLoc);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._trapezoidBottomBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.trapezoidBottom, gl.STATIC_DRAW);
      gl.vertexAttribPointer(trapezoidBottomLoc, 4, gl.FLOAT, false, 0, 0);

      const gradientData = this.parseGradient(gradient, color);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._gradientTexture);

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gradientData.textureWidth,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        gradientData.textureData
      );

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      gl.uniform1i(gl.getUniformLocation(this._program, "gradientTexture"), 0);
      gl.uniform1i(
        gl.getUniformLocation(this._program, "gradientCount"),
        gradientData.gradientCount
      );
      gl.uniform4fv(
        gl.getUniformLocation(this._program, "fallbackColor"),
        gradientData.fallbackColor
      );

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);

      gl.drawElements(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_INT, 0);
    };

    // If we have negativeGradient and separate trapezoid sets, render them separately
    if (hasNegatives && negativeGradient && (positiveTrapezoids.length > 0 || negativeTrapezoids.length > 0)) {
      // Render positive trapezoids with the normal gradient
      renderTrapezoidSet(positiveTrapezoids, params.gradient, params.color);
      
      // Render negative trapezoids with negativeGradient
      renderTrapezoidSet(negativeTrapezoids, negativeGradient, params.color);
    } else {
      // Fallback to rendering all trapezoids with the same gradient (original behavior)
      renderTrapezoidSet(trapezoids, params.gradient, params.color);
    }
    
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error('WebGL error in shadow rendering:', error);
    } else {
      //he he he haw
    }
  }

  /**
   * Draw shadow chart with cutoff gradient
   * @param {Array} individualPoints - Points defining the line
   * @param {Object} params - Rendering parameters with cutoff info
   */
  drawShadowWithCutoff(individualPoints, params) {

    const { cutoffIndex, cutoffTimeValue, cutoffOpacity, originalData, selectionBounds, zero } =
      params;

    this._lastIndividualPoints = null;
    this._lastParams = null;

    let cutoffTime;
    if (cutoffTimeValue !== undefined && cutoffTimeValue !== null) {
      cutoffTime = cutoffTimeValue;
    } else if (Array.isArray(originalData[0]) && originalData[0].length === 2) {
      const baseIndex = Math.floor(cutoffIndex);
      const fraction = cutoffIndex - baseIndex;

      if (fraction === 0 || baseIndex >= originalData.length - 1) {
        const cutoffItem = originalData[Math.min(baseIndex, originalData.length - 1)];
        const cutoffDate = cutoffItem[0];
        cutoffTime = cutoffDate instanceof Date ? cutoffDate.getTime() : cutoffDate;
      } else {
        const currentItem = originalData[baseIndex];
        const nextItem = originalData[baseIndex + 1];
        const currentDate = currentItem[0];
        const nextDate = nextItem[0];
        const currentTime = currentDate instanceof Date ? currentDate.getTime() : currentDate;
        const nextTime = nextDate instanceof Date ? nextDate.getTime() : nextDate;
        cutoffTime = currentTime + fraction * (nextTime - currentTime);
      }
    } else {
      cutoffTime = cutoffIndex;
    }

    const visibleBounds = params.selectionBounds;
    let firstTime, lastTime;
    
    if (visibleBounds && visibleBounds.minX !== undefined && visibleBounds.maxX !== undefined) {
        firstTime = visibleBounds.minX instanceof Date ? visibleBounds.minX.getTime() : visibleBounds.minX;
        lastTime = visibleBounds.maxX instanceof Date ? visibleBounds.maxX.getTime() : visibleBounds.maxX;
    } else {
        const firstItem = originalData[0];
        const lastItem = originalData[originalData.length - 1];
        const firstX = firstItem[0];
        const lastX = lastItem[0];
        
        firstTime = firstX instanceof Date ? firstX.getTime() : firstX;
        lastTime = lastX instanceof Date ? lastX.getTime() : lastX;
    }
    
    const timeDiff = cutoffTime - firstTime;
    const totalTime = lastTime - firstTime;
    const timeRatio = timeDiff / totalTime;

    if (timeRatio < 0) {
      this.draw(individualPoints, { ...params, renderCutoffGradient: false });
    } else if (timeRatio > 1) {
      const reducedOpacityColor = applyReducedOpacity(
        params.color,
        cutoffOpacity
      );
      const translucentGradient = applyReducedOpacityToGradient(
        params.gradient,
        cutoffOpacity
      );
      this.draw(individualPoints, {
        ...params,
        color: reducedOpacityColor,
        gradient: translucentGradient,
        renderCutoffGradient: false,
      });
    } else {
      this.drawSplitShadowTrapezoids(
        individualPoints,
        { ...params, selectionBounds: params.selectionBounds },
        timeRatio,
        cutoffTime
      );
    }
  }

  /**
   * Draw split shadow trapezoids with cutoff
   * @param {Array} individualPoints - Points defining the line
   * @param {Object} params - Rendering parameters
   * @param {number} timeRatio - Position of cutoff in visible range (0-1)
   * @param {number} cutoffTime - Cutoff timestamp
   */
  drawSplitShadowTrapezoids(individualPoints, params, timeRatio, cutoffTime) {
    const { zero, cutoffOpacity, selectionBounds } = params;
    const gl = this._gl;

    const renderWidth = gl.canvas.width;
    const cutoffPixelX = timeRatio * renderWidth;

    const preCutoffPoints = [];
    const postCutoffPoints = [];
    
    for (let i = 0; i < individualPoints.length; i++) {
        const [pixelX, pixelY] = individualPoints[i];
        
        if (pixelX < cutoffPixelX) {
            preCutoffPoints.push(individualPoints[i]);
        } else {
            postCutoffPoints.push(individualPoints[i]);
        }
    }
    
    let ghostPoint = null;
    if (preCutoffPoints.length > 0 && postCutoffPoints.length > 0) {
        const lastPrePoint = preCutoffPoints[preCutoffPoints.length - 1];
        const firstPostPoint = postCutoffPoints[0];
        
        const [x1, y1] = lastPrePoint;
        const [x2, y2] = firstPostPoint;
        
        if (x2 !== x1) {
            const interpolationRatio = (cutoffPixelX - x1) / (x2 - x1);
            const ghostY = y1 + interpolationRatio * (y2 - y1);
            ghostPoint = [cutoffPixelX, ghostY];
            
            preCutoffPoints.push(ghostPoint);
            postCutoffPoints.unshift(ghostPoint);
        }
    }

    if (preCutoffPoints.length >= 2) {
      const reducedOpacityColor = applyReducedOpacity(
        params.color,
        cutoffOpacity
      );
      const gl = this._gl;

      gl.disable(gl.DEPTH_TEST);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      const translucentGradient = applyReducedOpacityToGradient(
        params.gradient,
        cutoffOpacity
      );

      this.draw(preCutoffPoints, {
        ...params,
        color: reducedOpacityColor,
        gradient: translucentGradient,
        renderCutoffGradient: false,
      });
    } else {
    }

    if (postCutoffPoints.length >= 2) {
      this.draw(postCutoffPoints, {
        ...params,
        renderCutoffGradient: false,
      });
    } else {
    }
  }
}
