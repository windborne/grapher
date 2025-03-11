import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {Y_AXIS_WIDTH} from '../helpers/axis_sizes';
import StateController from '../state/state_controller';
import {
    useAlwaysTooltipped,
    useAxes,
    useHighlightedSeries,
    useLeftAxisCount,
    usePrimarySize,
    useRightAxisCount,
    useSeries, useShowingOptions
} from '../state/hooks';
import SeriesKeyItem from './series_key_item';
import SeriesKeyAxisContainer from './series_key_axis_container';

function calculateStyles({stateController, keyWidth}) {
    const rightAxisCount = useRightAxisCount(stateController);
    const leftAxisCount = useLeftAxisCount(stateController);
    const showingOptions = useShowingOptions(stateController);

    let marginRight = Y_AXIS_WIDTH*rightAxisCount;
    if (rightAxisCount > 0) {
        marginRight += 5;
    }

    marginRight += 250;

    if (showingOptions) {
        marginRight += 70;
    }

    let marginLeft = Y_AXIS_WIDTH*leftAxisCount;

    if (leftAxisCount > 0) {
        marginLeft += 5;
    }

    marginLeft = Math.max(marginRight, marginLeft);
    marginRight = Math.max(marginRight, marginLeft);

    let marginBottom;

    const { elementWidth } = usePrimarySize(stateController);

    const shouldBreak = elementWidth - marginLeft - marginRight < keyWidth;

    if (shouldBreak) {
        marginLeft = 0;
        marginRight = 0;
        marginBottom = 10;
    }

    return { marginRight, marginLeft, marginBottom };
}

export default React.memo(SeriesKey);

function SeriesKey({ stateController, theme, draggingY, grapherID, dragPositionYOffset=0 }) {
    const series = useSeries(stateController);
    const [draggedSeries, setDraggedSeries] = useState(null);
    const [dragPosition, setDragPosition] = useState({
        x: 0,
        y: 0
    });

    const highlightedSeries = useHighlightedSeries(stateController);

    const keyRef = useRef(null);
    const [keyWidth, setKeyWidth] = useState(series.map(({ name, yKey }, i) => (name || yKey || i).toString().length).reduce((a, b) => a + b, 0) * 5);

    let sizeCalculationHandle;
    useEffect(() => {
        if (keyRef.current) {
            cancelAnimationFrame(sizeCalculationHandle);

            sizeCalculationHandle = requestAnimationFrame(() => {
                if (!keyRef.current) { // has become invalid in the last frame
                    return;
                }

                const width = [...keyRef.current.querySelectorAll('.series-key-axis-container')]
                    .map((el) => el.clientWidth)
                    .reduce((a, b) => a + b, 0);
                setKeyWidth(width);
            });
        }
    }, [series, keyRef.current]);

    const style = calculateStyles({ stateController, keyWidth });

    const axes = useAxes(stateController);
    const alwaysTooltipped = useAlwaysTooltipped(stateController);

    const startDragging = (event, singleSeries) => {
        let seriesKeyEl = event.target;
        while (seriesKeyEl && seriesKeyEl.className !== 'series-key') {
            seriesKeyEl = seriesKeyEl.parentNode;
        }
        const targetLeft = event.target.getBoundingClientRect().left;
        let seriesKeyLeft = seriesKeyEl.getBoundingClientRect().left;
        let seriesKeyMarginLeft = seriesKeyEl.style.marginLeft;

        const startX = event.clientX;
        const startY = event.clientY;
        const clientStartX = event.clientX;
        const clientStartY = event.clientY;

        setDraggedSeries(singleSeries);
        setDragPosition({
            x: event.clientX - startX + (targetLeft - seriesKeyLeft) - 2,
            y: event.clientY - startY + 1
        });

        const onMouseMove = (moveEvent) => {
            if (seriesKeyEl.style.marginLeft !== seriesKeyMarginLeft) {
                seriesKeyLeft = seriesKeyEl.getBoundingClientRect().left;
                seriesKeyMarginLeft = seriesKeyEl.style.marginLeft;
            }

            setDragPosition({
                x: moveEvent.clientX - startX + (targetLeft - seriesKeyLeft) - 2,
                y: moveEvent.clientY - startY + 1
            });
        };

        const onMouseUp = (mouseUpEvent) => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);

            let target = mouseUpEvent.target;
            while (target && !(target.dataset || {}).axisIndex && !(target.dataset || {}).grapherId) {
                target = target.parentNode;
            }

            setDraggedSeries(null);
            stateController.finalizeDrag(singleSeries, target && (target.dataset || {}).axisIndex, target && (target.dataset || {}).grapherId);

            if (mouseUpEvent.clientX === clientStartX && mouseUpEvent.clientY === clientStartY) {
                stateController.toggleAlwaysTooltipped(singleSeries, mouseUpEvent.shiftKey);
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        stateController.markDragStart();
    };

    return (
        <div className="series-key" style={style} ref={keyRef}>
            {
                draggingY &&
                <div
                    className="series-key-axis-container"
                    data-axis-index="new-left"
                    data-grapher-id={grapherID}
                />
            }

            {
                axes.map((axis, i) => {
                    if (!axis.series.length && axes.length > 1) {
                        return null;
                    }

                    return (
                        <SeriesKeyAxisContainer
                            key={i}
                            label={axis.label}
                            axisIndex={axis.axisIndex}
                            scale={axis.scale}
                            stateController={stateController}
                            grapherID={grapherID}
                        >
                            {
                                axis.series.map((singleSeries) => {
                                    if (singleSeries.hideFromKey) {
                                        return null;
                                    }

                                    return (
                                        <SeriesKeyItem
                                            key={singleSeries.index}
                                            series={singleSeries}
                                            i={singleSeries.index}
                                            onMouseDown={(event, toggleTooltipped) => startDragging(event, singleSeries, toggleTooltipped)}
                                            theme={theme}
                                            stateController={stateController}
                                            highlighted={highlightedSeries === singleSeries.index || alwaysTooltipped.has(singleSeries)}
                                        />
                                    );
                                })
                            }
                        </SeriesKeyAxisContainer>
                    );
                })
            }

            {
                draggingY &&
                <div
                    className="series-key-axis-container"
                    data-axis-index="new-right"
                    data-grapher-id={grapherID}
                />
            }

            {
                draggedSeries &&
                <SeriesKeyItem
                    style={{
                        left: dragPosition.x,
                        top: dragPosition.y - dragPositionYOffset,
                        position: 'absolute',
                        pointerEvents: 'none',
                        zIndex: 1
                    }}
                    series={draggedSeries}
                    i={draggedSeries.index}
                    theme={theme}
                    stateController={stateController}
                />
            }
        </div>
    );
}

SeriesKey.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    theme: PropTypes.string.isRequired,
    draggingY: PropTypes.bool.isRequired,
    grapherID: PropTypes.string,
    dragPositionYOffset: PropTypes.number
};
