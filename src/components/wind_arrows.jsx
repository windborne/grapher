import React from 'react';
import PropTypes from 'prop-types';
import { usePrimarySize, useSelection, useSeries } from '../state/hooks';
import StateController from '../state/state_controller';

export default React.memo(WindArrows);

function DefaultWindArrow({ windX, windY }) {
    const arrowSize = 8;
    const angle = (-Math.atan2(windY, windX) + Math.PI / 2) * 180 / Math.PI;

    return (
        <g transform={`rotate(${angle})`}>
            <line
                x1={0}
                y1={-arrowSize / 2}
                x2={0}
                y2={arrowSize / 2}
                stroke="currentColor"
                strokeWidth={1.5}
            />
            <path
                d={`M${-arrowSize / 3},${arrowSize / 4} L0,${arrowSize / 2} L${arrowSize / 3},${arrowSize / 4}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </g>
    );
}

function WindArrows({ stateController }) {
    const { elementWidth } = usePrimarySize(stateController);
    const { minX, maxX } = useSelection(stateController);
    const series = useSeries(stateController);

    const windSeries = series.filter(s => s.windDirections && s.windDirections.length > 0 && !s.hidden);

    if (windSeries.length === 0) {
        return null;
    }

    let minSpeed = Infinity;
    let maxSpeed = -Infinity;
    for (const singleSeries of windSeries) {
        const { windData } = singleSeries;
        if (!windData) continue;
        for (const wind of windData) {
            if (!wind) continue;
            const speed = Math.sqrt(wind.x * wind.x + wind.y * wind.y);
            if (speed < minSpeed) minSpeed = speed;
            if (speed > maxSpeed) maxSpeed = speed;
        }
    }
    const speedRange = maxSpeed - minSpeed || 1;

    const arrows = [];
    const arrowSpacing = 30;
    let lastArrowX = -arrowSpacing;

    for (const singleSeries of windSeries) {
        const { inDataSpace, windDirections, windData, windComp: CustomArrow } = singleSeries;
        if (!inDataSpace || !windDirections) continue;

        const Comp = CustomArrow || DefaultWindArrow;

        for (let i = 0; i < inDataSpace.length; i++) {
            const [x] = inDataSpace[i];
            const direction = windDirections[i];

            if (direction === null) continue;

            let xValue = x instanceof Date ? x.valueOf() : x;
            let minXValue = minX instanceof Date ? minX.valueOf() : minX;
            let maxXValue = maxX instanceof Date ? maxX.valueOf() : maxX;

            if (xValue < minXValue || xValue > maxXValue) continue;

            const pixelX = ((xValue - minXValue) / (maxXValue - minXValue)) * elementWidth;

            if (pixelX - lastArrowX < arrowSpacing) continue;
            lastArrowX = pixelX;

            const wind = windData ? windData[i] : null;
            const windX = wind ? wind.x : Math.cos(direction);
            const windY = wind ? wind.y : Math.sin(direction);
            const speed = Math.sqrt(windX * windX + windY * windY);
            const speedPercentile = (speed - minSpeed) / speedRange;

            arrows.push(
                <g key={`${singleSeries.name || i}-${i}`} transform={`translate(${pixelX}, 10)`}>
                    <Comp windX={windX} windY={windY} speed={speed} speedPercentile={speedPercentile} />
                </g>
            );
        }
    }

    if (arrows.length === 0) {
        return null;
    }

    return (
        <svg className="wind-arrows" style={{ height: 20, width: elementWidth, display: 'block' }}>
            {arrows}
        </svg>
    );
}

WindArrows.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired
};

