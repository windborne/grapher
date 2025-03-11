import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import CustomPropTypes from '../helpers/custom_prop_types';
import GraphBodyRenderer from '../renderer/graph_body_renderer';
import Tooltip from './tooltip';
import ContextMenu from './context_menu';
import StateController from '../state/state_controller';
import {
    useAnnotationState,
    useAutoscaleY,
    useAxes,
    useMaxPrecision,
    useShowingAnnotations,
    useTooltipState,
    useContextMenu
} from '../state/hooks';
import Annotations from './annotations.js';
import DraggablePoints from './draggable_points.js';
import VerticalLines from './vertical_lines.js';

export default React.memo(GraphBody);

function GraphBody({ stateController, webgl, bodyHeight, boundsSelectionEnabled, showTooltips, tooltipOptions, checkIntersection, draggablePoints, onPointDrag, onDraggablePointsDoubleClick, verticalLines, clockStyle, timeZone }) {
    const canvasEl = useCallback((el) => {
        if (stateController.primaryRenderer) {
            stateController.primaryRenderer.dispose();
        }

        if (!el) {
            return;
        }

        const renderer = new GraphBodyRenderer({
            stateController: stateController,
            canvasElement: el,
            webgl,
            checkIntersection
        });

        stateController.primaryRenderer = renderer;
        renderer.resize();
    }, [webgl, stateController]);


    const [boundsSelection, setBoundsSelection] = useState({
        showing: false,
        start: {},
        style: {}
    });

    const autoscaleY = useAutoscaleY(stateController);

    const axisCount = useAxes(stateController).length;

    const tooltip = useTooltipState(stateController);
    const maxPrecision = useMaxPrecision(stateController);
    const showAnnotations = useShowingAnnotations(stateController);
    const annotationState = useAnnotationState(stateController);
    const contextMenu = useContextMenu(stateController);

    const onMouseDown = (event) => {
        if (!boundsSelectionEnabled) {
            return;
        }

        let currentNode = event.target;
        for (let i = 0; i < 10 && currentNode; i++) {
            if (currentNode.classList.contains('grapher-tooltip')) {
                return;
            }
            currentNode = currentNode.parentNode;
        }

        const boundingRect = stateController.primaryRenderer.boundingRect;

        const start = {
            x: event.clientX - boundingRect.left,
            y: event.clientY - boundingRect.top
        };


        setBoundsSelection({
            showing: true,
            start,
            style: {
                left: start.x,
                top: start.y,
                width: 0,
                height: 0
            }
        });

        const onMouseUp = (event) => {
            window.removeEventListener('mouseup', onMouseUp);

            if (!boundsSelectionEnabled) {
                return;
            }

            const x = event.clientX - boundingRect.left;
            const y = event.clientY - boundingRect.top;

            stateController.setBoundsFromSelection({
                minPixelX: Math.min(x, start.x),
                maxPixelX: Math.max(x, start.x),
                minPixelY: Math.min(y, start.y),
                maxPixelY: Math.max(y, start.y)
            });

            setBoundsSelection({
                showing: false,
                style: {}
            });
        };

        window.addEventListener('mouseup', onMouseUp);
    };

    const onMouseMove = (event) => {
        if (boundsSelection.showing) {
            const boundingRect = stateController.primaryRenderer.boundingRect;
            const x = event.clientX - boundingRect.left;
            const y = event.clientY - boundingRect.top;

            setBoundsSelection(({ start }) => {
                return {
                    showing: true,
                    start,
                    style: {
                        left: Math.min(x, start.x),
                        top: autoscaleY ? 0 : Math.min(y, start.y),
                        width: Math.abs(x - start.x),
                        height: autoscaleY ? boundingRect.height : Math.abs(y - start.y)
                    }
                };
            });
        }
    };

    useEffect(() => {
        const onScroll = () => {
            if (!showTooltips) {
                return;
            }

            stateController.recalculateTooltips();
        };

        const onGlobalMouseMove = (event) => {
            if (!showTooltips) {
                return;
            }

            stateController.setTooltipMousePosition({
                clientX: event.clientX,
                clientY: event.clientY,
                shiftKey: event.shiftKey
            });
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('mousemove', onGlobalMouseMove, { passive: true });

        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('mousemove', onGlobalMouseMove);
        };
    }, []);

    const onMouseLeave = () => {
        stateController.setContextMenuMousePosition({
            showing: false
        });
    };

    const onClick = (event) => {
        stateController.registerClick({
            clientX: event.clientX,
            clientY: event.clientY
        });

        if (tooltipOptions && tooltipOptions.savingDisabled) {
            stateController.clearSavedTooltips();
            return;
        }

        // if it's NOT a child of 'grapher-context-menu', close the context menu
        if (!event.target.closest('.grapher-context-menu')) {
            stateController.setContextMenuMousePosition({
                showing: false
            });
        }

        if (!window.getSelection || window.getSelection().type !== 'Range') {
            stateController.toggleTooltipSaved();
        }
    };
    const onDoubleClick = () => {
        stateController.clearSavedTooltips();
    };
    
    const onContextMenu = (event) => {
        event.preventDefault();
        stateController.setContextMenuMousePosition({
            clientX: event.clientX,
            clientY: event.clientY,
            showing: true
        });
    };

    return (
        <div className="graph-body graph-body-primary"
             onMouseMove={onMouseMove}
             onMouseLeave={onMouseLeave}
             onMouseDown={onMouseDown}
             onClick={onClick}
             onDoubleClick={onDoubleClick}
             onContextMenu={onContextMenu}
             style={typeof bodyHeight === 'number' ? { height: bodyHeight } : undefined}
        >
            <canvas ref={canvasEl} />

            {
                showTooltips &&
                <Tooltip
                    axisCount={axisCount}
                    maxPrecision={maxPrecision}
                    clockStyle={clockStyle}
                    timeZone={timeZone}
                    {...(tooltipOptions || {})}
                    {...tooltip}
                />
            }

            {
                contextMenu.showing &&
                <ContextMenu
                    contextMenu={contextMenu}
                />
            }

            {
                showAnnotations &&
                <Annotations
                    bodyHeight={bodyHeight}
                    annotationState={annotationState}
                />
            }

            {
                verticalLines &&
                <VerticalLines
                    stateController={stateController}
                    verticalLines={verticalLines}
                />
            }

            {
                draggablePoints &&
                <DraggablePoints
                    stateController={stateController}
                    draggablePoints={draggablePoints}
                    onPointDrag={onPointDrag}
                    onDraggablePointsDoubleClick={onDraggablePointsDoubleClick}
                />
            }

            {
                boundsSelectionEnabled && boundsSelection.showing &&
                <div className="bounds-selection"
                     style={boundsSelection.style}
                />
            }
        </div>
    );
}

GraphBody.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    webgl: PropTypes.bool,
    checkIntersection: PropTypes.bool,
    bodyHeight: PropTypes.number,
    boundsSelectionEnabled: PropTypes.bool.isRequired,
    showTooltips: PropTypes.bool.isRequired,
    tooltipOptions: CustomPropTypes.TooltipOptions,
    verticalLines: CustomPropTypes.VerticalLines,
    draggablePoints: CustomPropTypes.DraggablePoints,
    onPointDrag: PropTypes.func,
    onDraggablePointsDoubleClick: PropTypes.func,
    clockStyle: PropTypes.oneOf(['12h', '24h']),
    timeZone: PropTypes.string
};
