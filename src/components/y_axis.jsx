import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {calculatePrecision, formatY} from '../helpers/format';
import {Y_AXIS_WIDTH, BIG_Y_AXIS_LABEL_OFFSET} from '../helpers/axis_sizes';
import scaleBounds from '../renderer/scale_bounds';
import getColor from '../helpers/colors';
import placeGrid from '../helpers/place_grid';
import {useAxes, useAxisBounds, useHighlightedSeries, usePrimarySize} from '../state/hooks';
import StateController from '../state/state_controller';
import CustomPropTypes from '../helpers/custom_prop_types';

export default React.memo(YAxis);

function YAxis({ stateController, showAxes, showGrid, showSeriesKey, axis, sideIndex, bodyHeight, theme, grapherID, dragPositionYOffset=0, bigLabels, showAxisColors }) {
    if (!showAxes && !showGrid) {
        return null;
    }

    const { side, scale, axisIndex, label } = useAxes(stateController)[axis.axisIndex];

    const { elementWidth, elementHeight } = usePrimarySize(stateController);
    let { minY, maxY } = useAxisBounds(stateController)[axisIndex];

    const scaledBounds = scaleBounds({ minY, maxY, scale});
    minY = scaledBounds.minY;
    maxY = scaledBounds.maxY;

    const ticks = placeGrid({
        min: minY,
        max: maxY,
        totalSize: elementHeight,
        scale,
        precision: calculatePrecision(maxY - minY),
        formatter: formatY,
        inverted: true,
        expectedLabelSize: bigLabels ? 20 : 10,
        labelPadding: 30
    });

    const colorBoxSize = 10;
    const colorBoxPadding = 4;

    let sidePadding = 5;

    if (scale === 'log') {
        sidePadding = 2;
    }

    const highlightedSeries = useHighlightedSeries(stateController);

    const [draggedSeries, setDraggedSeries] = useState(null);
    const [dragDelta, setDragDelta] = useState({ dx: 0, dy: 0 });

    const startDrag = (event, singleSeries) => {
        let startX = event.clientX;
        let startY = event.clientY;

        if (side === 'left') {
            startX += Y_AXIS_WIDTH;
        }

        if (side === 'right') {
            startX -= Y_AXIS_WIDTH;
        }

        setDragDelta({
            dx: 0,
            dy: 0
        });

        const onMouseMove = (moveEvent) => {
            setDragDelta({
                dx: moveEvent.clientX - startX,
                dy: moveEvent.clientY - startY
            });
        };

        const onMouseUp = (mouseUpEvent) => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            let target = mouseUpEvent.target;
            while (target && !(target.dataset || {}).axisIndex) {
                target = target.parentNode;
            }

            setDraggedSeries(null);
            stateController.finalizeDrag(singleSeries, target && (target.dataset || {}).axisIndex, target && (target.dataset || {}).grapherId);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        setDraggedSeries(singleSeries);
        stateController.markDragStart();
    };

    const highlightedOpacity = theme === 'day' ? 1.0 : 0.5;
    const unhighlightedOpacity = theme === 'day' ? 0.8 : 0.3;

    return (
        <svg className={`axis y-axis y-axis-${side}`}
             data-axis-index={axisIndex}
             data-grapher-id={grapherID}
             style={{
                 width: Y_AXIS_WIDTH,
                 marginLeft: showAxes ? undefined : -Y_AXIS_WIDTH,
                 height: typeof bodyHeight === 'number' ? bodyHeight : undefined
             }}
        >
            {
                showAxes &&
                showAxisColors &&
                axis.series.map((singleSeries, i) => {
                    const height = elementHeight/axis.series.length;

                    console.log('showSeriesKey', showSeriesKey);

                    return (
                        <rect
                            x={side === 'left' ? 0 : 2}
                            y={i*height}
                            width={Y_AXIS_WIDTH - 2}
                            height={height}
                            key={singleSeries.index}
                            fill={getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex)}
                            opacity={singleSeries.index === highlightedSeries ? highlightedOpacity : unhighlightedOpacity}
                            data-element-height={elementHeight}
                            data-series-length={axis.series.length}
                        />
                    );
                })
            }

            {
                showAxes &&
                <path d={`M${side === 'left' ? Y_AXIS_WIDTH-1 : 1},3 V${elementHeight}`} className="axis-line" />
            }

            {
                ticks.map(({ pixelValue, label, size, skipGrid }, i) => {
                    const edge = side === 'left' ? (sideIndex + 1) * Y_AXIS_WIDTH : -sideIndex*Y_AXIS_WIDTH;
                    const length = (side === 'left' ? 1 : - 1) * (elementWidth+1);

                    const classes = ['axis-item', `axis-item-${size}`];
                    if (bigLabels) {
                        classes.push('axis-item-big-labels');
                    }

                    return (
                        <g key={i} className={classes.join(' ')}>
                            {
                                showGrid &&
                                !skipGrid &&
                                <path d={`M${edge},${pixelValue} h${length}`} />
                            }

                            {
                                showGrid &&
                                !skipGrid &&
                                sideIndex > 0 &&
                                <path
                                    d={`M${side === 'left' ? Y_AXIS_WIDTH : 0},${pixelValue} h${(side === 'left' ? 1 : -1) * sideIndex * Y_AXIS_WIDTH}`}
                                    strokeDasharray={'2,2'}
                                />
                            }

                            {
                                showAxes &&
                                <text x={side === 'left' ? Y_AXIS_WIDTH-sidePadding : sidePadding} y={pixelValue}>
                                    {label}
                                </text>
                            }
                        </g>
                    );
                })
            }

            {
                showSeriesKey && showAxes &&
                axis.series.map((singleSeries, i) => {

                    let x = (Y_AXIS_WIDTH - colorBoxSize - colorBoxPadding) + (i % 2 - 1)*(colorBoxSize + colorBoxPadding);
                    let y = -(colorBoxPadding + colorBoxSize) * Math.ceil(axis.series.length / 2) + (colorBoxSize + colorBoxPadding) * Math.floor(i / 2);

                    if (singleSeries === draggedSeries) {
                        x += dragDelta.dx;
                        y += dragDelta.dy - dragPositionYOffset;
                    }

                    return (
                        <rect
                            className="series-color-box"
                            onMouseDown={(event) => startDrag(event, singleSeries)}
                            x={x}
                            y={y}
                            width={colorBoxSize}
                            height={colorBoxSize}
                            key={singleSeries.index}
                            fill={getColor(singleSeries.color, singleSeries.index, singleSeries.multigrapherSeriesIndex)}
                            onMouseOver={() => stateController.setHighlightedSeries(singleSeries.index)}
                            onMouseOut={() => stateController.setHighlightedSeries(null)}
                        />
                    );
                })
            }

            {
                showAxes && !!label &&
                <text
                    className={`y-axis-label${bigLabels ? ' y-axis-big-label' : ''}`}
                    x={side === 'left' ? 10 : Y_AXIS_WIDTH - 10}
                    y={elementHeight/2 + (side === 'left' ? -1 : 1)*(axisIndex + 1)*(bigLabels ? BIG_Y_AXIS_LABEL_OFFSET : 0)}
                    transform={`rotate(${side === 'left' ? -90 : 90}, ${side === 'left' ? 10 : Y_AXIS_WIDTH - 10}, ${elementHeight/2})`}
                >
                    {label}
                </text>
            }
        </svg>
    );
}

YAxis.propTypes = {
    stateController: PropTypes.instanceOf(StateController),
    showAxes: PropTypes.bool.isRequired,
    showGrid: PropTypes.bool.isRequired,
    showAxisColors: PropTypes.bool.isRequired,
    showSeriesKey: PropTypes.bool.isRequired,
    axis: CustomPropTypes.Axis.isRequired,
    sideIndex: PropTypes.number.isRequired,
    bodyHeight: PropTypes.number,
    theme: PropTypes.string,
    grapherID: PropTypes.string,
    dragPositionYOffset: PropTypes.number,
    bigLabels: PropTypes.bool
};
