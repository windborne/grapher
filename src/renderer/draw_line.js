import {DPI_INCREASE} from './size_canvas';
import pathsFrom from './paths_from';
import { applyReducedOpacity } from "../helpers/colors";

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

export default function drawLine(dataInRenderSpace, {
    color, width=1, context, shadowColor='black', shadowBlur=5, dashed=false, dashPattern=null, highlighted=false, showIndividualPoints=false, pointRadius, minPointSpacing, getIndividualPoints, getRanges, cutoffIndex, cutoffOpacity, originalData, renderCutoffGradient, currentBounds, selectionBounds, rendering, isPreview, negativeColor, hasNegatives, zero, zeroColor
}) {
    if (!context) {
        console.error("Canvas context is null in drawLine");
        return;
    }
    
    if (!context.setLineDash) {
        console.error('drawLine called with WebGL context instead of 2D context');
        return;
    }
    
    if (highlighted) {
        width += 2;
    }
    width *= DPI_INCREASE;

    context.strokeStyle = color;
    context.lineWidth = width;
    context.shadowColor = shadowColor;
    context.shadowBlur = shadowBlur;

    if (dashed) {
        context.setLineDash(dashPattern || [5, 5]);
    } else {
        context.setLineDash([]);
    }

    // Split paths at zero line if negativeColor is specified
    const paths = pathsFrom(dataInRenderSpace, hasNegatives && negativeColor ? { splitAtY: zero } : undefined);

    for (let path of paths) {
        if (renderCutoffGradient && cutoffIndex !== undefined && originalData) {
            let cutoffTime;
            if (typeof originalData[0] === 'object' && originalData[0].length === 2) {
                const baseIndex = Math.floor(cutoffIndex);
                const fraction = cutoffIndex - baseIndex;
                
                if (fraction === 0 || baseIndex >= originalData.length - 1) {
                    const cutoffDate = originalData[Math.min(baseIndex, originalData.length - 1)][0];
                    cutoffTime = cutoffDate instanceof Date ? cutoffDate.getTime() : cutoffDate;
                } else {
                    const currentDate = originalData[baseIndex][0];
                    const nextDate = originalData[baseIndex + 1][0];
                    const currentTime = currentDate instanceof Date ? currentDate.getTime() : currentDate;
                    const nextTime = nextDate instanceof Date ? nextDate.getTime() : nextDate;
                    cutoffTime = currentTime + fraction * (nextTime - currentTime);
                }
            } else {
                cutoffTime = cutoffIndex; 
            }
            
            if (isPreview) {
                const firstTime = originalData[0][0] instanceof Date ? originalData[0][0].getTime() : originalData[0][0];
                const lastTime = originalData[originalData.length - 1][0] instanceof Date ? 
                    originalData[originalData.length - 1][0].getTime() : originalData[originalData.length - 1][0];
                const timeRatio = (cutoffTime - firstTime) / (lastTime - firstTime);
                
                if (timeRatio < 0) {
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
                } else if (timeRatio > 1) {
                    const reducedColor = applyReducedOpacity(color, cutoffOpacity);
                    context.strokeStyle = reducedColor;
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
                } else {
                    const renderCutoffIndex = timeRatio * (path.length - 1);
                    const splitIndex = Math.floor(renderCutoffIndex);
                    const fraction = renderCutoffIndex - splitIndex;
                    
                    let ghostPoint = null;
                    if (splitIndex < path.length - 1 && fraction > 0) {
                        const [x1, y1] = path[splitIndex];
                        const [x2, y2] = path[splitIndex + 1];
                        ghostPoint = [
                            x1 + fraction * (x2 - x1),
                            y1 + fraction * (y2 - y1)
                        ];
                    }
                    
                    if (splitIndex > 0 || (splitIndex === 0 && fraction > 0)) {
                        const reducedColor = applyReducedOpacity(color, cutoffOpacity);
                        context.strokeStyle = reducedColor;
                        context.lineWidth = width;
                        context.beginPath();
                        
                        for (let i = 0; i <= splitIndex; i++) {
                            const [x, y] = path[i];
                            if (i === 0) {
                                context.moveTo(x, y);
                            } else {
                                context.lineTo(x, y);
                            }
                        }
                        
                        if (ghostPoint) {
                            context.lineTo(ghostPoint[0], ghostPoint[1]);
                        }
                        
                        context.stroke();
                    }
                    
                    if (splitIndex < path.length - 1) {
                        context.strokeStyle = color;
                        context.lineWidth = width;
                        context.beginPath();
                        
                        if (ghostPoint) {
                            context.moveTo(ghostPoint[0], ghostPoint[1]);
                        } else {
                            context.moveTo(path[splitIndex + 1][0], path[splitIndex + 1][1]);
                        }
                        
                        for (let i = splitIndex + 1; i < path.length; i++) {
                            const [x, y] = path[i];
                            context.lineTo(x, y);
                        }
                        
                        context.stroke();
                    }
                }
            } else {
                if (!selectionBounds) {
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
                continue;
            }
            
            const visibleMinTime = selectionBounds.minX instanceof Date ? selectionBounds.minX.getTime() : selectionBounds.minX;
            const visibleMaxTime = selectionBounds.maxX instanceof Date ? selectionBounds.maxX.getTime() : selectionBounds.maxX;
            
            if (cutoffTime < visibleMinTime) {
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
            } else if (cutoffTime > visibleMaxTime) {
                const reducedColor = applyReducedOpacity(color, cutoffOpacity);
                context.strokeStyle = reducedColor;
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
                context.strokeStyle = color;
            } else {
                const timeRatio = (cutoffTime - visibleMinTime) / (visibleMaxTime - visibleMinTime);
                const renderCutoffIndex = timeRatio * path.length;
            
            const preCutoffPath = [];
            const postCutoffPath = [];
            let ghostPoint = null;
            
            if (renderCutoffIndex > 0 && renderCutoffIndex < path.length - 1) {
                const beforeIndex = Math.floor(renderCutoffIndex);
                const afterIndex = Math.ceil(renderCutoffIndex);
                
                if (beforeIndex !== afterIndex) {
                    const fraction = renderCutoffIndex - beforeIndex;
                    const beforePoint = path[beforeIndex];
                    const afterPoint = path[afterIndex];
                    
                    ghostPoint = [
                        beforePoint[0] + fraction * (afterPoint[0] - beforePoint[0]),
                        beforePoint[1] + fraction * (afterPoint[1] - beforePoint[1])
                    ];
                    
                } else {
                    ghostPoint = path[renderCutoffIndex];
                }
            }
            
            for (let i = 0; i < path.length; i++) {
                if (i < renderCutoffIndex) {
                    preCutoffPath.push(path[i]);
                } else {
                    postCutoffPath.push(path[i]);
                }
            }
            
            if (ghostPoint) {
                if (preCutoffPath.length > 0) {
                    preCutoffPath.push(ghostPoint);
                }
                if (postCutoffPath.length > 0) {
                    postCutoffPath.unshift(ghostPoint);
                }
            }
            
            if (preCutoffPath.length > 1) {
                const reducedColor = applyReducedOpacity(color, cutoffOpacity);
                context.strokeStyle = reducedColor;
                context.lineWidth = width;
                context.beginPath();
                for (let i = 0; i < preCutoffPath.length; i++) {
                    const [x, y] = preCutoffPath[i];
                    if (i === 0) {
                        context.moveTo(x, y);
                    } else {
                        context.lineTo(x, y);
                    }
                }
                context.stroke();
            }
            
            if (postCutoffPath.length > 1) {
                context.strokeStyle = color;
                context.lineWidth = width;
                context.beginPath();
                for (let i = 0; i < postCutoffPath.length; i++) {
                    const [x, y] = postCutoffPath[i];
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
        } else {
            if (hasNegatives && negativeColor) {
                let positive = true;
                if (path.length >= 2) {
                    positive = path[1][1] <= zero;
                } else if (path.length > 0) {
                    positive = path[0][1] <= zero;
                }
                context.strokeStyle = positive ? color : negativeColor;
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
    }

    if (getRanges) {
        const ranges = getRanges();

        context.lineWidth = width;
        context.strokeStyle = color;
        context.setLineDash([]);
        const horizontalBarWidth = 8 * DPI_INCREASE;

        for (let range of ranges) {
            if (!range) {
                continue;
            }

            const { pixelX, pixelMinY, pixelMaxY } = range;

            if (pixelMinY !== null) {
                context.beginPath();
                context.moveTo(pixelX - (horizontalBarWidth / 2), pixelMinY);
                context.lineTo(pixelX + (horizontalBarWidth / 2), pixelMinY);
                context.stroke();
            }

            if (pixelMaxY !== null) {
                context.beginPath();
                context.moveTo(pixelX - (horizontalBarWidth / 2), pixelMaxY);
                context.lineTo(pixelX + (horizontalBarWidth / 2), pixelMaxY);
                context.stroke();
            }

            if (pixelMinY === null || pixelMaxY === null) {
                continue;
            }

            context.beginPath();
            context.moveTo(pixelX, pixelMinY);
            context.lineTo(pixelX, pixelMaxY);
            context.stroke();
        }
    }

    if (showIndividualPoints) {
        const individualPoints = getIndividualPoints();

        if (renderCutoffGradient && cutoffIndex !== undefined && originalData && selectionBounds) {
            const visibleBounds = selectionBounds;
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
            
            let cutoffTime;
            if (typeof cutoffIndex === 'string' && cutoffIndex === 'now') {
                cutoffTime = Date.now();
            } else if (typeof originalData[0] === 'object' && originalData[0].length === 2) {
                const baseIndex = Math.floor(cutoffIndex);
                const fraction = cutoffIndex - baseIndex;
                
                if (fraction === 0 || baseIndex >= originalData.length - 1) {
                    const cutoffDate = originalData[Math.min(baseIndex, originalData.length - 1)][0];
                    cutoffTime = cutoffDate instanceof Date ? cutoffDate.getTime() : cutoffDate;
                } else {
                    const currentDate = originalData[baseIndex][0];
                    const nextDate = originalData[baseIndex + 1][0];
                    const currentTime = currentDate instanceof Date ? currentDate.getTime() : currentDate;
                    const nextTime = nextDate instanceof Date ? nextDate.getTime() : nextDate;
                    cutoffTime = currentTime + fraction * (nextTime - currentTime);
                }
            } else {
                cutoffTime = cutoffIndex; 
            }
            
            if (cutoffTime !== null) {
                const timeDiff = cutoffTime - firstTime;
                const totalTime = lastTime - firstTime;
                const timeRatio = timeDiff / totalTime;
                
                if (timeRatio > 1) {
                    const spacedPoints = applyPointSpacing(individualPoints, minPointSpacing);
                    for (let i = 0; i < spacedPoints.length; i++) {
                        const [x, y] = spacedPoints[i];
                        
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
                        
                        const { applyReducedOpacity } = require("../helpers/colors");
                        const reducedOpacityColor = applyReducedOpacity(pointColor, cutoffOpacity);
                        context.fillStyle = reducedOpacityColor;
                        context.beginPath();
                        context.arc(x, y, pointRadius || 8, 0, 2 * Math.PI, false);
                        context.fill();
                    }
                    return;
                }
            }
            
            if (isPreview) {
                const visibleMinTime = selectionBounds.minX instanceof Date ? selectionBounds.minX.getTime() : selectionBounds.minX;
                const visibleMaxTime = selectionBounds.maxX instanceof Date ? selectionBounds.maxX.getTime() : selectionBounds.maxX;
                
                const spacedPoints = applyPointSpacing(individualPoints, minPointSpacing);
                for (let i = 0; i < spacedPoints.length; i++) {
                    const [x, y] = spacedPoints[i];
                    
                    let isBeforeCutoff = false;
                    if (cutoffTime < visibleMinTime) {
                        isBeforeCutoff = false;
                    } else if (cutoffTime > visibleMaxTime) {
                        isBeforeCutoff = (rendering !== 'shadow');
                    } else {
                        const visibleCutoffRatio = (cutoffTime - visibleMinTime) / (visibleMaxTime - visibleMinTime);
                        const cutoffPixelX = visibleCutoffRatio * context.canvas.width;
                        isBeforeCutoff = x < cutoffPixelX;
                    }
                    
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
                    
                    if (isBeforeCutoff) {
                        const reducedOpacityColor = applyReducedOpacity(pointColor, cutoffOpacity);
                        context.fillStyle = reducedOpacityColor;
                    } else {
                        context.fillStyle = pointColor;
                    }
                    
                    context.beginPath();
                    context.arc(x, y, pointRadius || 8, 0, 2 * Math.PI, false);
                    context.fill();
                }
            } else if (!selectionBounds) {
                const spacedPoints = applyPointSpacing(individualPoints, minPointSpacing);
                for (let i = 0; i < spacedPoints.length; i++) {
                    const [x, y] = spacedPoints[i];
                    
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
            } else {
                const visibleMinTime = selectionBounds.minX instanceof Date ? selectionBounds.minX.getTime() : selectionBounds.minX;
                const visibleMaxTime = selectionBounds.maxX instanceof Date ? selectionBounds.maxX.getTime() : selectionBounds.maxX;
                
                const spacedPoints = applyPointSpacing(individualPoints, minPointSpacing);
                for (let i = 0; i < spacedPoints.length; i++) {
                    const [x, y] = spacedPoints[i];
                    
                    let isBeforeCutoff = false;
                    if (cutoffTime < visibleMinTime) {
                        isBeforeCutoff = false;
                    } else if (cutoffTime > visibleMaxTime) {
                        isBeforeCutoff = (rendering !== 'shadow');
                    } else {
                        const visibleCutoffRatio = (cutoffTime - visibleMinTime) / (visibleMaxTime - visibleMinTime);
                        const cutoffPixelX = visibleCutoffRatio * context.canvas.width;
                        isBeforeCutoff = x < cutoffPixelX;
                    }
                    
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
                    
                    if (isBeforeCutoff) {
                        const reducedOpacityColor = applyReducedOpacity(pointColor, cutoffOpacity);
                        context.fillStyle = reducedOpacityColor;
                    } else {
                        context.fillStyle = pointColor;
                    }
                    
                    context.beginPath();
                    context.arc(x, y, pointRadius || 8, 0, 2 * Math.PI, false);
                    context.fill();
                }
            }
        } else {
            const spacedPoints = applyPointSpacing(individualPoints, minPointSpacing);
            for (let i = 0; i < spacedPoints.length; i++) {
                const [x, y] = spacedPoints[i];
                
                // Determine point color based on position relative to zero
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
}
