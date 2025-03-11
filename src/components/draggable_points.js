import React from 'react';
import CustomPropTypes from '../helpers/custom_prop_types.js';
import PropTypes from 'prop-types';
import StateController from '../state/state_controller.js';
import {LINE_COLORS} from '../helpers/colors.js';
import {useAxisBounds, useSizing} from '../state/hooks.js';

export default React.memo(DraggablePoints);

function DraggablePoints({ stateController, draggablePoints, onPointDrag, onDraggablePointsDoubleClick }) {
    const bounds = useAxisBounds(stateController)[0];
    const sizing = useSizing(stateController);

    if (!sizing) {
        return null;
    }

    const onPointlessDoubleClick = onDraggablePointsDoubleClick && ((event) => {
        const newXT = (event.clientX - sizing.boundingRect.left)/sizing.elementWidth;
        const newYT = 1 - (event.clientY - sizing.boundingRect.top)/sizing.elementHeight;

        onDraggablePointsDoubleClick(event, {
            x: newXT*(bounds.maxX - bounds.minX) + bounds.minX,
            y: newYT*(bounds.maxY - bounds.minY) + bounds.minY
        });
    });

    return (
        <div className="grapher-draggable-points" onDoubleClick={onPointlessDoubleClick}>
            <svg width={sizing.elementWidth} height={sizing.elementHeight}>
                {
                    draggablePoints.map((point, index) => {
                        const xT = (point.x - bounds.minX)/(bounds.maxX - bounds.minX);
                        const yT = (1 - (point.y - bounds.minY)/(bounds.maxY - bounds.minY));

                        if (xT < 0 || xT > 1 || yT < 0 || yT > 1) {
                            return null;
                        }

                        const pixelX = xT * sizing.elementWidth;
                        const pixelY = yT * sizing.elementHeight;

                        const radius = point.radius || 5;
                        const fillColor = point.fillColor || LINE_COLORS[0];
                        const strokeColor = point.strokeColor || 'white';
                        const strokeWidth = point.strokeWidth || 1;

                        const onMouseDown = (event) => {
                            event.stopPropagation();

                            if (!onPointDrag) {
                                return;
                            }

                            const xOffset = pixelX - event.clientX;
                            const yOffset = pixelY - event.clientY;

                            const onMouseMove = (moveEvent) => {
                                const newXT = (moveEvent.clientX + xOffset)/sizing.elementWidth;
                                const newYT = 1 - (moveEvent.clientY + yOffset)/sizing.elementHeight;

                                onPointDrag({
                                    index,
                                    point,
                                    x: newXT*(bounds.maxX - bounds.minX) + bounds.minX,
                                    y: newYT*(bounds.maxY - bounds.minY) + bounds.minY
                                }, moveEvent);
                            };

                            const onMouseUp = () => {
                                window.removeEventListener('mousemove', onMouseMove);
                                window.removeEventListener('mouseup', onMouseUp);
                            };

                            window.addEventListener('mousemove', onMouseMove);
                            window.addEventListener('mouseup', onMouseUp);
                        };

                        const onClick = point.onClick && ((event) => {
                            point.onClick(event, point);
                        });

                        const onDoubleClick = point.onDoubleClick && ((event) => {
                            event.stopPropagation();
                            point.onDoubleClick(event, point);
                        });

                        return (
                            <circle
                                key={index}
                                cx={pixelX}
                                cy={pixelY}
                                r={radius}
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth={strokeWidth}
                                onMouseDown={onMouseDown}
                                onClick={onClick}
                                onDoubleClick={onDoubleClick}
                            />
                        );
                    })
                }
            </svg>
        </div>
    );
}

DraggablePoints.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    draggablePoints: CustomPropTypes.DraggablePoints.isRequired,
    onPointDrag: PropTypes.func,
    onDraggablePointsDoubleClick: PropTypes.func
};
