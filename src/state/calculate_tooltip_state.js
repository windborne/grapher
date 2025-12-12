import binarySearch from '../helpers/binary_search';
import scaleBounds from '../renderer/scale_bounds';
import getColor from '../helpers/colors';
import flattenSimpleData, {extractXValue, extractYValue} from '../helpers/flatten_simple_data';
import {getBarWidths} from '../renderer/draw_bars';

const DISTANCE_THRESHOLD = 20;

/**
 * Figures out the tooltip state
 *
 * @param {Boolean} mousePresent
 * @param {Number} mouseX
 * @param {Number} mouseY
 * @param {Object} sizing
 * @param {Array<Object>} series
 * @param {Set} alwaysTooltipped
 * @param {Array<Object>} savedTooltips
 * @param {Boolean} [allTooltipped]
 * @param {Number} closestSpacing
 * @return {{mouseX: *, mouseY: *, elementWidth: number, elementHeight: number, tooltips: any[]}}
 */
export default function calculateTooltipState({mousePresent, mouseX, mouseY, sizing, series, alwaysTooltipped, savedTooltips, allTooltipped, closestSpacing }) {
    // filter out saved tooltips for nonexistent series
    savedTooltips = savedTooltips.filter((tooltip) => tooltip.series.axis);

    for (let savedTooltip of savedTooltips) {
        moveTooltip({ mouseX, mouseY, sizing}, savedTooltip);
    }

    if (!mousePresent) {
        return {
            mouseX,
            mouseY,
            elementWidth: sizing.elementWidth,
            elementHeight: sizing.elementHeight,
            tooltips: [...savedTooltips]
        };
    }

    const tooltips = [];

    let minDistance = Infinity;

    for (let i = 0; i < series.length; i++) {
        const singleSeries = series[i];

        if (singleSeries.hidden) {
            continue;
        }

        const axis = singleSeries.axis;

        const scale = axis.scale;
        const bounds = axis.currentBounds;
        const { minY, maxY } = scaleBounds({...bounds, scale });

        const trueX = mouseX/sizing.elementWidth * (bounds.maxX - bounds.minX) + bounds.minX;

        let data = singleSeries.inDataSpace;
        if (singleSeries.ignoreDiscontinuities) {
            data = data.filter((tuple) => typeof tuple[1] === 'number');
        }

        if (data.length === 0) {
            continue;
        }

        let dataMinX = data[0][0];
        let dataMaxX = data[data.length - 1][0];
        
        if (dataMinX instanceof Date) {
            dataMinX = dataMinX.getTime();
        }
        if (dataMaxX instanceof Date) {
            dataMaxX = dataMaxX.getTime();
        }
        
        const dataRange = dataMaxX - dataMinX;
        const padding = 0; 

        if (trueX < dataMinX - padding || trueX > dataMaxX + padding) {
            continue;
        }

        const closestIndex = binarySearch(data, trueX, { returnIndex: true });
        const closestPoint = data[closestIndex];

        if (!closestPoint) {
            continue;
        }

        const [x, y] = closestPoint;

        if (x === null) {
            continue;
        }

        let pixelX = (x - bounds.minX)/(bounds.maxX - bounds.minX) * sizing.elementWidth;
        const pixelY = (1 - ((scale === 'log' ? Math.log10(y) : y) - minY)/(maxY - minY)) * sizing.elementHeight;

        if (pixelY > sizing.elementHeight || pixelY < 0) {
            continue;
        }

        const ignoreYDistanceCheck = alwaysTooltipped.has(singleSeries) || allTooltipped;
        let xDistanceThreshold = DISTANCE_THRESHOLD;
        let yDistanceThreshold = DISTANCE_THRESHOLD;
        let distanceThreshold = DISTANCE_THRESHOLD;

        if (singleSeries.rendering === 'bar') {
            const indexInAxis = singleSeries.axis.series.indexOf(singleSeries);
            const axisSeriesCount = singleSeries.axis.series.length;

            const { totalBarWidth, barWidth } = getBarWidths({
                closestSpacing,
                bounds,
                sizing,
                axisSeriesCount
            });

            // currently, pixelX is the center of all the bars
            // shift it to start at the far left, then shift it to the center of the individual bar
            pixelX -= totalBarWidth/2/sizing.pixelRatio;
            pixelX += (barWidth*(indexInAxis + 0.5))/sizing.pixelRatio;

            xDistanceThreshold = barWidth/2/sizing.pixelRatio;
            yDistanceThreshold = 100;
            distanceThreshold = xDistanceThreshold + yDistanceThreshold;
        }

        const xDistance = Math.abs(pixelX - mouseX);
        const yDistance = Math.abs(pixelY - mouseY);
        const distance = Math.sqrt((xDistance)**2 + (pixelY - mouseY)**2);

        if (!ignoreYDistanceCheck && (xDistance > xDistanceThreshold || yDistance > yDistanceThreshold || distance > distanceThreshold)) {
            continue;
        }

        let xLabel, yLabel;

        const simpleData = singleSeries.simpleData || singleSeries.data;

        const enumLike = simpleData.length && !!singleSeries.hasEnum;
        if (singleSeries.xLabel || singleSeries.yLabel || enumLike) {
            let simplePoint;

            if (simpleData.length === data.length) {
                simplePoint = simpleData[closestIndex];
            } else {
                const flattenedData = flattenSimpleData(simpleData, { series: singleSeries, inDataSpace: data });

                simplePoint = flattenedData[closestIndex][1];
            }

            if (singleSeries.xLabel) {
                xLabel = simplePoint[singleSeries.xLabel];
            } else if (singleSeries.hasXEnum) {
                xLabel = extractXValue(simplePoint, singleSeries);
            }

            if (singleSeries.yLabel) {
                yLabel = simplePoint[singleSeries.yLabel];
            } else if (enumLike) {
                yLabel = extractYValue(simplePoint, singleSeries);
            }
        }

        if (distance < minDistance) {
            minDistance = distance;
        }

        let color = getColor(singleSeries.color, i, singleSeries.multigrapherSeriesIndex);
        if (y < 0 && singleSeries.negativeColor) {
            color = singleSeries.negativeColor;
        } else if (y === 0 && singleSeries.zeroLineColor) {
            color = singleSeries.zeroLineColor;
        }

        const useMouseY = singleSeries.followingMouseTooltip && alwaysTooltipped.has(singleSeries);
        
        tooltips.push({
            pixelWidth: sizing.elementWidth,
            pixelX: pixelX,
            pixelY: useMouseY ? mouseY : (isNaN(pixelY) ? sizing.elementHeight/2 : pixelY),
            x,
            y,
            color,
            distance,
            xDistance,
            index: i,
            series: singleSeries,
            xLabel,
            yLabel,
            fullYPrecision: singleSeries.fullYPrecision,
            ignoreYDistanceCheck
        });
    }

    const unsavedTooltips = tooltips.filter(({ distance, ignoreYDistanceCheck }) => {
        return distance === minDistance || ignoreYDistanceCheck;
    }).sort((a, b) => b.distance - a.distance);

    return {
        mousePresent,
        mouseX,
        mouseY,
        elementWidth: sizing.elementWidth,
        elementHeight: sizing.elementHeight,
        unsavedTooltipsCount: unsavedTooltips.length,
        tooltips: [...savedTooltips, ...unsavedTooltips]
    };
}

/**
 * Recalculates the tooltip position, given the new sizing, bounds, etc.
 *
 * @param {Number} mouseX
 * @param {Number} mouseY
 * @param {Object} sizing
 * @param {Object} tooltip          - The tooltip object to move
 */
export function moveTooltip({ mouseX, mouseY, sizing }, tooltip) {
    const { x, y } = tooltip;

    const scale = tooltip.series.axis.scale;
    const bounds = tooltip.series.axis.currentBounds;
    const { minY, maxY } = scaleBounds({...bounds, scale });

    const pixelX = (x - bounds.minX)/(bounds.maxX - bounds.minX) * sizing.elementWidth;
    const pixelY = (1 - ((scale === 'log' ? Math.log10(y) : y) - minY)/(maxY - minY)) * sizing.elementHeight;

    const distance = Math.sqrt((pixelX - mouseX)**2 + (pixelY - mouseY)**2);
    const xDistance = Math.abs(pixelX - mouseX);

    Object.assign(tooltip, {
        pixelWidth: sizing.elementWidth,
        pixelX: pixelX,
        pixelY: isNaN(pixelY) ? sizing.elementHeight/2 : pixelY,
        xDistance,
        distance
    });
}

export function toggleTooltipSaved({ currentTooltips, savedTooltips }) {
    if (!currentTooltips.length) {
        return savedTooltips;
    }

    const lastTooltip = currentTooltips[currentTooltips.length - 1];
    if (lastTooltip.xDistance > DISTANCE_THRESHOLD || (!lastTooltip.ignoreYDistanceCheck && lastTooltip.distance > DISTANCE_THRESHOLD)) {
        return savedTooltips;
    }

    const currentTooltipIndex = savedTooltips.findIndex((tooltip) => {
        return tooltip.x === lastTooltip.x && tooltip.y === lastTooltip.y;
    });

    if (currentTooltipIndex === -1) {
        return [...savedTooltips, lastTooltip];
    } else {
        return savedTooltips.filter((_, index) => index !== currentTooltipIndex);
    }
}
