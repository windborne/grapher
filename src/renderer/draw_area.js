import pathsFrom from "./paths_from";
import { drawZeroLine } from "./draw_zero_line";
import { DPI_INCREASE } from "./size_canvas";
import { applyReducedOpacity, applyReducedOpacityToGradient } from "../helpers/colors";

/**
 * Draws the data on the canvas
 * Assumes the data is in individual point render space, ie x and y in pixels
 *
 * @param {Array<[number, number]>} individualPoints - data to draw
 * @param {Object} dataInRenderSpace
 * @param {Object} options                           - set of options
 * @param {Object} options.context                   - the context to draw on
 * @param {String} options.color                     - color of the bar to draw
 * @param {{renderWidth: Number, renderHeight: Number}} options.sizing - size of the canvas, in pixels
 * @param {Number} options.zero                      - y coordinate that represents "zero"
 * @param {Boolean} options.hasNegatives             - if any values are negative (in which case should render from zero)
 * @param {Array<String>} [options.gradient]         - an array of stops, from top to bottom of canvas, to draw with
 * @param {String} [options.zeroColor]               - color of the zero line
 * @param {Number} [options.zeroWidth]               - width of the zero line
 * @param {Boolean} [options.showIndividualPoints]   - draw circles at each point
 * @param {String} [options.negativeColor]           - color of the area below zero
 * @param {Number} [options.width]                   - line width
 * @param {Object} [options.inRenderSpaceAreaBottom] - if provided, will use this as the area bottom instead of zero/sizing.renderHeight
 * @private
 */
export default function drawArea(
  individualPoints,
  dataInRenderSpace,
  {
    color,
    context,
    sizing,
    zero,
    hasNegatives,
    gradient,
    negativeGradient,
    zeroColor,
    zeroWidth,
    showIndividualPoints,
    negativeColor,
    pointRadius,
    minPointSpacing,
    width,
    highlighted,
    shadowColor = "black",
    shadowBlur = 5,
    inRenderSpaceAreaBottom,
    cutoffIndex,
    cutoffOpacity,
    originalData,
    renderCutoffGradient,
    selectionBounds,
    isPreview,
  }
) {
  if (!context) {
    console.error("Canvas context is null in drawArea");
    return;
  }

  context.fillStyle = color;
  context.shadowColor = shadowColor;
  context.shadowBlur = shadowBlur;

  if (gradient && gradient.length >= 2) {
    const globalGradient = context.createLinearGradient(
      0,
      0,
      0,
      sizing.renderHeight
    );

    for (let i = 0; i < gradient.length; i++) {
      const value = gradient[i];
      if (Array.isArray(value)) {
        globalGradient.addColorStop(value[0], value[1]);
      } else {
        globalGradient.addColorStop(i / (gradient.length - 1), value);
      }
    }

    context.fillStyle = globalGradient;

    if (color === "gradient") {
      context.strokeStyle = globalGradient;
    }
  } else {
    context.fillStyle = color;
  }

  if (!individualPoints.length) {
    return;
  }

  // we want to draw a polygon with a flat line at areaBottom, and then follows the shape of the data
  const areaBottom = hasNegatives ? zero : sizing.renderHeight;

  const shouldSplitAreaPaths = hasNegatives && negativeGradient;
  const areaPaths = pathsFrom(dataInRenderSpace, shouldSplitAreaPaths ? { splitAtY: zero } : undefined);
  const areaBottomPaths =
    inRenderSpaceAreaBottom && pathsFrom(inRenderSpaceAreaBottom, shouldSplitAreaPaths ? { splitAtY: zero } : undefined);

  const linePaths = pathsFrom(dataInRenderSpace, {
    splitAtY: zero,
  });

  if (renderCutoffGradient && cutoffIndex !== undefined && originalData) {
    drawAreaWithCutoff(
      individualPoints,
      areaPaths,
      areaBottomPaths,
      linePaths,
      {
        color,
        context,
        sizing,
        zero,
        hasNegatives,
        gradient,
        zeroColor,
        zeroWidth,
        showIndividualPoints,
        negativeColor,
        pointRadius,
        width,
        highlighted,
        shadowColor,
        shadowBlur,
        inRenderSpaceAreaBottom,
        cutoffIndex,
        cutoffOpacity,
        originalData,
        selectionBounds,
        isPreview,
      }
    );
    return;
  }

  for (let pathI = 0; pathI < areaPaths.length; pathI++) {
    const path = areaPaths[pathI];
    const areaBottomPath = areaBottomPaths && areaBottomPaths[pathI];
    context.beginPath();

    const [firstX, _startY] = path[0];
    const [lastX, _lastY] = path[path.length - 1];

    if (!areaBottomPaths) {
      context.moveTo(firstX, areaBottom);
    }

    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      context.lineTo(x, y);
    }

    if (areaBottomPath && areaBottomPath.length) {
      for (let i = areaBottomPath.length - 1; i >= 0; i--) {
        const [x, y] = areaBottomPath[i];
        context.lineTo(x, y);
      }

      context.lineTo(...path[0]);
    } else {
      context.lineTo(lastX, areaBottom);
    }

    context.fill();
  }

  if (highlighted) {
    width += 2;
  }

  width *= DPI_INCREASE;
  context.strokeStyle = color;
  context.lineWidth = width;

  for (let path of linePaths) {
    if (!path.length) {
      continue;
    }

    if (hasNegatives && negativeColor) {
      let positive = true;
      if (path.length >= 2) {
        positive = path[1][1] <= zero;
      } else {
        positive = path[0][1] <= zero;
      }

      if (positive) {
        context.strokeStyle = color;
      } else {
        context.strokeStyle = negativeColor;
      }
    } else {
      context.strokeStyle = color;
    }

    context.beginPath();

    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];

      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.stroke();
  }

  if (zeroWidth) {
    drawZeroLine(areaBottom, {
      context,
      sizing,
      color,
      zero,
      zeroColor,
      zeroWidth,
    });
  }

  if (showIndividualPoints && !renderCutoffGradient) {
    // Apply point spacing for individual point circles only
    function applyPointSpacing(points, minSpacing) {
      if (!minSpacing || points.length <= 1) {
          return points;
      }
      
      const spacedPoints = [];
      let lastX = -Infinity;
      
      for (const point of points) {
          const [x] = point;
          if (x - lastX >= minSpacing) {
              spacedPoints.push(point);
              lastX = x;
          }
      }
      
      return spacedPoints;
    }

    const pointsToRender = applyPointSpacing(individualPoints, minPointSpacing);
    for (let [x, y] of pointsToRender) {
      // Determine the color for this point
      let pointColor = color;
      if (negativeColor && hasNegatives) {
        if (y === zero && zeroColor) {
          pointColor = zeroColor;
        } else if (y < zero) {
          pointColor = color;
        } else {
          pointColor = negativeColor;
        }
      }
      
      context.fillStyle = pointColor;
      context.beginPath();
      context.arc(x, y, pointRadius || 8, 0, 2 * Math.PI, false);
      context.fill();
    }
  }
}

/**
 * Draws the data on the canvas with cutoff
 * Assumes the data is in individual point render space, ie x and y in pixels
 *
 * @param {Array<[number, number]>} individualPoints - data to draw
 * @param {Object} options                           - set of options
 * @param {Object} options.context                   - the context to draw on
 * @param {String} options.color                     - color of the area to draw
 * @param {{renderWidth: Number, renderHeight: Number}} options.sizing - size of the canvas, in pixels
 * @param {Number} options.zero                      - y coordinate that represents "zero"
 * @param {Boolean} options.hasNegatives             - if any values are negative (in which case should render from zero)
 * @param {Array<String>} [options.gradient]         - an array of stops, from top to bottom of canvas, to draw with
 * @param {String} [options.zeroColor]               - color of the zero line
 * @param {Number} [options.zeroWidth]               - width of the zero line
 * @param {Boolean} [options.showIndividualPoints]   - draw circles at each point
 * @param {String} [options.negativeColor]           - color of the area below zero
 * @param {Number} [options.width]                   - line width
 * @param {Object} [options.inRenderSpaceAreaBottom] - if provided, will use this as the area bottom instead of zero/sizing.renderHeight
 * @private
 */
function drawAreaWithCutoff(
  individualPoints,
  areaPaths,
  areaBottomPaths,
  linePaths,
  {
    color,
    context,
    sizing,
    zero,
    hasNegatives,
    gradient,
    zeroColor,
    zeroWidth,
    showIndividualPoints,
    negativeColor,
    pointRadius,
    width,
    highlighted,
    shadowColor,
    shadowBlur,
    inRenderSpaceAreaBottom,
    cutoffIndex,
    cutoffOpacity,
    originalData,
    selectionBounds,
    isPreview,
  }
) {
  let cutoffTime;
  if (typeof originalData[0] === "object" && originalData[0].length === 2) {
    const baseIndex = Math.floor(cutoffIndex);
    const fraction = cutoffIndex - baseIndex;

    if (fraction === 0 || baseIndex >= originalData.length - 1) {
      const cutoffDate =
        originalData[Math.min(baseIndex, originalData.length - 1)][0];
      cutoffTime =
        cutoffDate instanceof Date ? cutoffDate.getTime() : cutoffDate;
    } else {
      const currentDate = originalData[baseIndex][0];
      const nextDate = originalData[baseIndex + 1][0];
      const currentTime =
        currentDate instanceof Date ? currentDate.getTime() : currentDate;
      const nextTime = nextDate instanceof Date ? nextDate.getTime() : nextDate;
      cutoffTime = currentTime + fraction * (nextTime - currentTime);
    }
  } else {
    cutoffTime = cutoffIndex;
  }

  let firstTime, lastTime;
  if (isPreview && selectionBounds) {
    firstTime = selectionBounds.minX instanceof Date ? selectionBounds.minX.getTime() : selectionBounds.minX;
    lastTime = selectionBounds.maxX instanceof Date ? selectionBounds.maxX.getTime() : selectionBounds.maxX;
  } else {
    firstTime = originalData[0][0] instanceof Date ? originalData[0][0].getTime() : originalData[0][0];
    lastTime = originalData[originalData.length - 1][0] instanceof Date ? 
      originalData[originalData.length - 1][0].getTime() : originalData[originalData.length - 1][0];
  }

  const timeRatio = (cutoffTime - firstTime) / (lastTime - firstTime);

  if (timeRatio < 0) {
    for (let pathI = 0; pathI < areaPaths.length; pathI++) {
      const path = areaPaths[pathI];
      const areaBottomPath = areaBottomPaths && areaBottomPaths[pathI];

      renderEntireArea(path, areaBottomPath, {
        color,
        context,
        sizing,
        zero,
        hasNegatives,
        gradient,
        zeroColor,
        zeroWidth,
        highlighted,
        shadowColor,
        shadowBlur,
        inRenderSpaceAreaBottom,
      });
    }
  } else if (timeRatio > 1) {
    const reducedOpacityGradient = gradient
      ? applyReducedOpacityToGradient(gradient, cutoffOpacity)
      : null;
    for (let pathI = 0; pathI < areaPaths.length; pathI++) {
      const path = areaPaths[pathI];
      const areaBottomPath = areaBottomPaths && areaBottomPaths[pathI];

      renderEntireArea(path, areaBottomPath, {
        color: applyReducedOpacity(color, cutoffOpacity),
        context,
        sizing,
        zero,
        hasNegatives,
        gradient: reducedOpacityGradient,
        zeroColor,
        zeroWidth,
        highlighted,
        shadowColor,
        shadowBlur,
        inRenderSpaceAreaBottom,
      });
    }
  } else {
    if (isPreview) {
      for (let pathI = 0; pathI < areaPaths.length; pathI++) {
        const path = areaPaths[pathI];
        const areaBottomPath = areaBottomPaths && areaBottomPaths[pathI];

        if (!path.length) {
          continue;
        }

        const renderCutoffIndex = timeRatio * path.length;
        const splitIndex = Math.floor(renderCutoffIndex);
        const fraction = renderCutoffIndex - splitIndex;

        let ghostPoint = null;
        if (splitIndex < path.length - 1 && fraction > 0) {
          const [x1, y1] = path[splitIndex];
          const [x2, y2] = path[splitIndex + 1];
          ghostPoint = [x1 + fraction * (x2 - x1), y1 + fraction * (y2 - y1)];
        }

        const shouldRenderPre =
          splitIndex > 0 || (splitIndex === 0 && fraction > 0);

        if (shouldRenderPre) {
          const preCutoffPath = path.slice(0, splitIndex + 1);
          if (ghostPoint && splitIndex < path.length - 1) {
            preCutoffPath.push(ghostPoint);
          }

          const preCutoffAreaBottomPath = areaBottomPath
            ? areaBottomPath.slice(0, splitIndex + 1)
            : null;
          if (
            ghostPoint &&
            preCutoffAreaBottomPath &&
            splitIndex < areaBottomPath.length - 1
          ) {
            const bottomGhostPoint = [ghostPoint[0], zero];
            preCutoffAreaBottomPath.push(bottomGhostPoint);
          }

          const reducedOpacityGradient = gradient
            ? applyReducedOpacityToGradient(gradient, cutoffOpacity)
            : null;
          renderEntireArea(preCutoffPath, preCutoffAreaBottomPath, {
            color: applyReducedOpacity(color, cutoffOpacity),
            context,
            sizing,
            zero,
            hasNegatives,
            gradient: reducedOpacityGradient,
            zeroColor,
            zeroWidth,
            highlighted,
            shadowColor,
            shadowBlur,
            inRenderSpaceAreaBottom,
          });
        }

        const shouldRenderPost =
          splitIndex < path.length - 1 ||
          (splitIndex === path.length - 1 && fraction === 0);

        if (shouldRenderPost) {
          const postCutoffPath = [];
          if (ghostPoint && splitIndex < path.length - 1) {
            postCutoffPath.push(ghostPoint);
          }
          postCutoffPath.push(...path.slice(splitIndex + 1));

          const postCutoffAreaBottomPath = [];
          if (
            ghostPoint &&
            areaBottomPath &&
            splitIndex < areaBottomPath.length - 1
          ) {
            const bottomGhostPoint = [ghostPoint[0], zero];
            postCutoffAreaBottomPath.push(bottomGhostPoint);
          }
          if (areaBottomPath) {
            postCutoffAreaBottomPath.push(
              ...areaBottomPath.slice(splitIndex + 1)
            );
          }

          renderEntireArea(
            postCutoffPath,
            postCutoffAreaBottomPath.length ? postCutoffAreaBottomPath : null,
            {
              color,
              context,
              sizing,
              zero,
              hasNegatives,
              gradient,
              zeroColor,
              zeroWidth,
              highlighted,
              shadowColor,
              shadowBlur,
              inRenderSpaceAreaBottom,
            }
          );
        }
      }

      if (linePaths && linePaths.length > 0) {
        drawLinesWithCutoff(linePaths, timeRatio, {
          color,
          context,
          hasNegatives,
          negativeColor,
          zero,
          width,
          highlighted,
          cutoffOpacity,
        });
      }

      if (
        showIndividualPoints &&
        individualPoints &&
        individualPoints.length > 0
      ) {
        drawPointsWithCutoffByRatio(individualPoints, timeRatio, {
          color,
          context,
          negativeColor,
          hasNegatives,
          zero,
          zeroColor,
          pointRadius,
          cutoffOpacity,
        });
      }
    } else {
      if (!selectionBounds) {
        for (let pathI = 0; pathI < areaPaths.length; pathI++) {
          const path = areaPaths[pathI];
          const areaBottomPath = areaBottomPaths && areaBottomPaths[pathI];

          renderEntireArea(path, areaBottomPath, {
            color,
            context,
            sizing,
            zero,
            hasNegatives,
            gradient,
            zeroColor,
            zeroWidth,
            highlighted,
            shadowColor,
            shadowBlur,
            inRenderSpaceAreaBottom,
          });
        }
      } else {
        const visibleMinTime =
          selectionBounds.minX instanceof Date
            ? selectionBounds.minX.getTime()
            : selectionBounds.minX;
        const visibleMaxTime =
          selectionBounds.maxX instanceof Date
            ? selectionBounds.maxX.getTime()
            : selectionBounds.maxX;

        if (cutoffTime < visibleMinTime) {
          // cutoff before visible range - render entire area normally
          for (let pathI = 0; pathI < areaPaths.length; pathI++) {
            const path = areaPaths[pathI];
            const areaBottomPath = areaBottomPaths && areaBottomPaths[pathI];

            renderEntireArea(path, areaBottomPath, {
              color,
              context,
              sizing,
              zero,
              hasNegatives,
              gradient,
              zeroColor,
              zeroWidth,
              highlighted,
              shadowColor,
              shadowBlur,
              inRenderSpaceAreaBottom,
            });
          }
        } else if (cutoffTime > visibleMaxTime) {
          // cutoff after visible range - render entire area with reduced opacity
          const reducedOpacityGradient = gradient
            ? applyReducedOpacityToGradient(gradient, cutoffOpacity)
            : null;
          for (let pathI = 0; pathI < areaPaths.length; pathI++) {
            const path = areaPaths[pathI];
            const areaBottomPath = areaBottomPaths && areaBottomPaths[pathI];

            renderEntireArea(path, areaBottomPath, {
              color: applyReducedOpacity(color, cutoffOpacity),
              context,
              sizing,
              zero,
              hasNegatives,
              gradient: reducedOpacityGradient,
              zeroColor,
              zeroWidth,
              highlighted,
              shadowColor,
              shadowBlur,
              inRenderSpaceAreaBottom,
            });
          }
        } else {
          // cutoff within visible range - calculate position relative to visible bounds
          const visibleTimeRatio =
            (cutoffTime - visibleMinTime) / (visibleMaxTime - visibleMinTime);

          for (let pathI = 0; pathI < areaPaths.length; pathI++) {
            const path = areaPaths[pathI];
            const areaBottomPath = areaBottomPaths && areaBottomPaths[pathI];

            if (!path.length) {
              continue;
            }

            const renderCutoffIndex = visibleTimeRatio * path.length;
            const splitIndex = Math.floor(renderCutoffIndex);
            const fraction = renderCutoffIndex - splitIndex;

            // create ghost point for continuity if needed
            let ghostPoint = null;
            if (splitIndex < path.length - 1 && fraction > 0) {
              const [x1, y1] = path[splitIndex];
              const [x2, y2] = path[splitIndex + 1];
              ghostPoint = [
                x1 + fraction * (x2 - x1),
                y1 + fraction * (y2 - y1),
              ];
            }

            // render pre-cutoff area with reduced opacity
            const shouldRenderPre =
              splitIndex > 0 || (splitIndex === 0 && fraction > 0);

            if (shouldRenderPre) {
              renderAreaSegment(
                path,
                areaBottomPath,
                splitIndex,
                ghostPoint,
                true,
                {
                  color: applyReducedOpacity(color, cutoffOpacity),
                  context,
                  sizing,
                  zero,
                  hasNegatives,
                  gradient,
                  areaBottomPaths,
                }
              );
            }

            // render post-cutoff area with normal opacity
            const shouldRenderPost = splitIndex < path.length - 1;

            if (shouldRenderPost) {
              renderAreaSegment(
                path,
                areaBottomPath,
                splitIndex,
                ghostPoint,
                false,
                {
                  color,
                  context,
                  sizing,
                  zero,
                  hasNegatives,
                  gradient,
                  areaBottomPaths,
                }
              );
            }
          }
        }
      }
    }

    // draw outline lines with cutoff
    if (timeRatio >= 0 && timeRatio <= 1 && !isPreview) {
      if (selectionBounds) {
        const visibleMinTime =
          selectionBounds.minX instanceof Date
            ? selectionBounds.minX.getTime()
            : selectionBounds.minX;
        const visibleMaxTime =
          selectionBounds.maxX instanceof Date
            ? selectionBounds.maxX.getTime()
            : selectionBounds.maxX;

        // test case time
        if (cutoffTime < visibleMinTime) {
          // cutoff before visible range - draw lines normally
          drawLinesNormally(linePaths, {
            color,
            context,
            hasNegatives,
            negativeColor,
            width,
            highlighted,
          });
        } else if (cutoffTime > visibleMaxTime) {
          // cutoff after visible range - draw lines with reduced opacity (to match area)
          const reducedColor = applyReducedOpacity(color, cutoffOpacity);
          const reducedNegativeColor = negativeColor
            ? applyReducedOpacity(negativeColor, cutoffOpacity)
            : negativeColor;
          drawLinesNormally(linePaths, {
            color: reducedColor,
            context,
            hasNegatives,
            negativeColor: reducedNegativeColor,
            width,
            highlighted,
          });
        } else {
          // cutoff within visible range - split lines at cutoff
          const visibleTimeRatio =
            (cutoffTime - visibleMinTime) / (visibleMaxTime - visibleMinTime);
          drawLinesWithCutoff(linePaths, visibleTimeRatio, {
            color,
            context,
            hasNegatives,
            negativeColor,
            zero,
            width,
            highlighted,
            cutoffOpacity,
          });
        }
      } else {
        // no bounds available - draw lines normally
        drawLinesNormally(linePaths, {
          color,
          context,
          hasNegatives,
          negativeColor,
          width,
          highlighted,
        });
      }
    } else if (!isPreview) {
      // draw lines normally without cutoff
      drawLinesNormally(linePaths, {
        color,
        context,
        hasNegatives,
        negativeColor,
        width,
        highlighted,
      });
    }

    // draw other elements (zero line, points) normally
    if (zeroWidth) {
      const areaBottom = hasNegatives ? zero : sizing.renderHeight;
      drawZeroLine(areaBottom, {
        context,
        sizing,
        color,
        zero,
        zeroColor,
        zeroWidth,
      });
    }

    if (showIndividualPoints && !isPreview) {
      if (timeRatio >= 0 && timeRatio <= 1) {
        if (selectionBounds) {
          const visibleMinTime =
            selectionBounds.minX instanceof Date
              ? selectionBounds.minX.getTime()
              : selectionBounds.minX;
          const visibleMaxTime =
            selectionBounds.maxX instanceof Date
              ? selectionBounds.maxX.getTime()
              : selectionBounds.maxX;

         //test case time
          if (cutoffTime < visibleMinTime) {
            // cutoff before visible range - draw points normally
            drawPointsNormally(individualPoints, {
              color,
              context,
              negativeColor,
              hasNegatives,
              zero,
              zeroColor,
              pointRadius,
            });
          } else if (cutoffTime > visibleMaxTime) {
            // cutoff after visible range - draw points with reduced opacity
            const reducedColor = applyReducedOpacity(color, cutoffOpacity);
            const reducedNegativeColor = negativeColor
              ? applyReducedOpacity(negativeColor, cutoffOpacity)
              : negativeColor;
            const reducedZeroColor = zeroColor
              ? applyReducedOpacity(zeroColor, cutoffOpacity)
              : zeroColor;
            drawPointsNormally(individualPoints, {
              color: reducedColor,
              context,
              negativeColor: reducedNegativeColor,
              hasNegatives,
              zero,
              zeroColor: reducedZeroColor,
              pointRadius,
            });
          } else {
            // cutoff within visible range - split points at cutoff
            const visibleTimeRatio =
              (cutoffTime - visibleMinTime) / (visibleMaxTime - visibleMinTime);
            drawPointsWithCutoffByRatio(individualPoints, visibleTimeRatio, {
              color,
              context,
              negativeColor,
              hasNegatives,
              zero,
              zeroColor,
              pointRadius,
              cutoffOpacity,
            });
          }
        } else {
          // no bounds available - draw points normally
          drawPointsNormally(individualPoints, {
            color,
            context,
            negativeColor,
            hasNegatives,
            zero,
            zeroColor,
            pointRadius,
          });
        }
      } else {
        // cutoff outside data range - draw points normally
        drawPointsNormally(individualPoints, {
          color,
          context,
          negativeColor,
          hasNegatives,
          zero,
          zeroColor,
          pointRadius,
        });
      }
    } 
  }
}

function renderEntireArea(
  path,
  areaBottomPath,
  {
    color,
    context,
    sizing,
    zero,
    hasNegatives,
    gradient,
  }
) {
  context.fillStyle = color;

  if (gradient && gradient.length >= 2) {
    const globalGradient = context.createLinearGradient(
      0,
      0,
      0,
      sizing.renderHeight
    );
    for (let i = 0; i < gradient.length; i++) {
      const value = gradient[i];
      if (Array.isArray(value)) {
        globalGradient.addColorStop(value[0], value[1]);
      } else {
        globalGradient.addColorStop(i / (gradient.length - 1), value);
      }
    }
    context.fillStyle = globalGradient;
  } else {
  }

  const areaBottom = hasNegatives ? zero : sizing.renderHeight;

  context.beginPath();

  const [firstX, _startY] = path[0];
  const [lastX, _lastY] = path[path.length - 1];

  if (!areaBottomPath) {
    context.moveTo(firstX, areaBottom);
  }

  for (let i = 0; i < path.length; i++) {
    const [x, y] = path[i];
    context.lineTo(x, y);
  }

  if (areaBottomPath && areaBottomPath.length) {
    for (let i = areaBottomPath.length - 1; i >= 0; i--) {
      const [x, y] = areaBottomPath[i];
      context.lineTo(x, y);
    }
    context.lineTo(...path[0]);
  } else {
    context.lineTo(lastX, areaBottom);
  }

  context.fill();
}

function renderAreaSegment(
  path,
  areaBottomPath,
  splitIndex,
  ghostPoint,
  isPreCutoff,
  { color, context, sizing, zero, hasNegatives, gradient, areaBottomPaths }
) {
  context.fillStyle = color;

  if (gradient && gradient.length >= 2) {
    const globalGradient = context.createLinearGradient(
      0,
      0,
      0,
      sizing.renderHeight
    );
    for (let i = 0; i < gradient.length; i++) {
      const value = gradient[i];
      if (Array.isArray(value)) {
        const gradientColor = isPreCutoff
          ? applyReducedOpacity(value[1], 0.35)
          : value[1];
        globalGradient.addColorStop(value[0], gradientColor);
      } else {
        const gradientColor = isPreCutoff
          ? applyReducedOpacity(value, 0.35)
          : value;
        globalGradient.addColorStop(i / (gradient.length - 1), gradientColor);
      }
    }
    context.fillStyle = globalGradient;
  } else {
  }

  const areaBottom = hasNegatives ? zero : sizing.renderHeight;

  context.beginPath();

  if (isPreCutoff) {
    const endIndex = ghostPoint ? splitIndex + 1 : splitIndex;
    const [firstX] = path[0];

    if (!areaBottomPaths) {
      context.moveTo(firstX, areaBottom);
    }

    for (let i = 0; i <= endIndex && i < path.length; i++) {
      const [x, y] = i === endIndex && ghostPoint ? ghostPoint : path[i];
      context.lineTo(x, y);
    }

    if (areaBottomPath && areaBottomPath.length) {
      for (let i = Math.min(endIndex, areaBottomPath.length - 1); i >= 0; i--) {
        const [x, y] = areaBottomPath[i];
        context.lineTo(x, y);
      }
      context.lineTo(...path[0]);
    } else {
      const lastPoint = ghostPoint || path[endIndex] || path[path.length - 1];
      context.lineTo(lastPoint[0], areaBottom);
    }
  } else {
    const startIndex = ghostPoint ? splitIndex : splitIndex + 1;
    const startPoint = ghostPoint || path[startIndex];

    if (startPoint) {
      context.moveTo(startPoint[0], areaBottom);

      if (ghostPoint) {
        context.lineTo(...ghostPoint);
      }
      for (let i = startIndex; i < path.length; i++) {
        context.lineTo(...path[i]);
      }

      if (areaBottomPath && areaBottomPath.length) {
        for (
          let i = areaBottomPath.length - 1;
          i >= Math.max(startIndex, 0);
          i--
        ) {
          const [x, y] = areaBottomPath[i];
          context.lineTo(x, y);
        }
        if (ghostPoint) {
          context.lineTo(ghostPoint[0], areaBottom);
        }
      } else {
        const [lastX] = path[path.length - 1];
        context.lineTo(lastX, areaBottom);
      }
    }
  }

  context.fill();
}

function drawPointsNormally(
  individualPoints,
  { color, context, negativeColor, hasNegatives, zero, zeroColor, pointRadius }
) {
  if (!individualPoints || !Array.isArray(individualPoints)) {
    return;
  }

  for (let i = 0; i < individualPoints.length; i++) {
    const [x, y] = individualPoints[i];

    let pointColor = color;
    if (negativeColor && hasNegatives) {
      if (y === zero && zeroColor) {
        pointColor = zeroColor;
      } else if (y < zero) {
        pointColor = color;
      } else {
        pointColor = negativeColor;
      }
    }

    context.fillStyle = pointColor;
    context.beginPath();
    context.arc(x, y, pointRadius || 8, 0, 2 * Math.PI, false);
    context.fill();
  }
}

function drawLinesNormally(
  linePaths,
  { color, context, hasNegatives, negativeColor, width, highlighted }
) {
  if (!linePaths || !Array.isArray(linePaths)) {
    return;
  }

  if (highlighted) {
    width += 2;
  }
  width *= DPI_INCREASE;

  for (let path of linePaths) {
    if (!path.length) continue;

    context.strokeStyle = hasNegatives && negativeColor ? negativeColor : color;
    context.lineWidth = width;
    context.beginPath();
    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      if (i === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }
    context.stroke();
  }
}

function drawLinesWithCutoff(
  linePaths,
  timeRatio,
  {
    color,
    context,
    hasNegatives,
    negativeColor,
    zero,
    width,
    highlighted,
    cutoffOpacity,
  }
) {
  if (!linePaths || !Array.isArray(linePaths)) {
    return;
  }

  if (highlighted) {
    width += 2;
  }
  width *= DPI_INCREASE;

  const cutoffPixelX = timeRatio * context.canvas.width;
  const preCutoffPaths = [];
  const postCutoffPaths = [];

  for (let path of linePaths) {
    if (!path.length) continue;

    const prePath = [];
    const postPath = [];
    let ghostPoint = null;
    let splitIndex = -1;

    for (let i = 0; i < path.length; i++) {
      const [x, y] = path[i];
      
      if (x < cutoffPixelX) {
        prePath.push([x, y]);
        splitIndex = i;
      } else {
        postPath.push([x, y]);
      }
    }

    if (prePath.length > 0 && postPath.length > 0) {
      const lastPrePoint = prePath[prePath.length - 1];
      const firstPostPoint = postPath[0];
      const [x1, y1] = lastPrePoint;
      const [x2, y2] = firstPostPoint;
      
      if (x2 !== x1) {
        const fraction = (cutoffPixelX - x1) / (x2 - x1);
        ghostPoint = [cutoffPixelX, y1 + fraction * (y2 - y1)];
        prePath.push(ghostPoint);
        postPath.unshift(ghostPoint);
      }
    }

    if (prePath.length > 0) {
      preCutoffPaths.push(prePath);
    }
    if (postPath.length > 0) {
      postCutoffPaths.push(postPath);
    }
  }

  if (preCutoffPaths.length > 0) {
    const reducedColor = applyReducedOpacity(color, cutoffOpacity);
    context.strokeStyle = reducedColor;
    context.lineWidth = width;

    for (let path of preCutoffPaths) {
      if (path.length > 1) {
        context.beginPath();
        for (let i = 0; i < path.length; i++) {
          const [x, y] = path[i];
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();
      }
    }
  }

  if (postCutoffPaths.length > 0) {
    context.strokeStyle = hasNegatives && negativeColor ? negativeColor : color;
    context.lineWidth = width;

    for (let path of postCutoffPaths) {
      if (path.length > 1) {
        context.beginPath();
        for (let i = 0; i < path.length; i++) {
          const [x, y] = path[i];
          if (i === 0) {
            context.moveTo(x, y);
          } else {
            context.lineTo(x, y);
          }
        }
        context.stroke();
      }
    }
  }
}

function drawPointsWithCutoffByRatio(
  individualPoints,
  timeRatio,
  {
    color,
    context,
    negativeColor,
    hasNegatives,
    zero,
    zeroColor,
    pointRadius,
    cutoffOpacity,
  }
) {
  if (!individualPoints || !Array.isArray(individualPoints)) {
    return;
  }

  const canvasWidth = context.canvas.width;
  const cutoffPixelX = timeRatio * canvasWidth;

  for (let i = 0; i < individualPoints.length; i++) {
    const [x, y] = individualPoints[i];

    const isBeforeCutoff = x < cutoffPixelX;

    let pointColor = color;
    if (isBeforeCutoff) {
      pointColor = applyReducedOpacity(color, cutoffOpacity);
    }

    if (negativeColor && hasNegatives) {
      if (y === zero && zeroColor) {
        pointColor = zeroColor;
      } else if (y < zero) {
        pointColor = isBeforeCutoff
          ? applyReducedOpacity(color, cutoffOpacity)
          : color;
      } else {
        pointColor = isBeforeCutoff
          ? applyReducedOpacity(negativeColor, cutoffOpacity)
          : negativeColor;
      }
    }

    context.fillStyle = pointColor;
    context.beginPath();
    context.arc(x, y, pointRadius || 8, 0, 2 * Math.PI, false);
    context.fill();
  }
}
