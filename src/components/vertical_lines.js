import React from 'react';
import CustomPropTypes from '../helpers/custom_prop_types.js';
import PropTypes from 'prop-types';
import StateController from '../state/state_controller.js';
import {useAxisBounds, useSizing} from '../state/hooks.js';

export default React.memo(VerticalLines);

function VerticalLines({ stateController, verticalLines, isRangeGraph, bounds, elementWidth, elementHeight }) {
    bounds = bounds || useAxisBounds(stateController)[0];
    const sizing = useSizing(stateController);

    if (!sizing) {
        return null;
    }

    const relevantVerticalLines = verticalLines.filter(line => {
        if (isRangeGraph && !line.onRangeGraph) {
            return false;
        }

        if (line.onRangeGraphOnly && !isRangeGraph) {
            return false;
        }

        return true;
    });

    if (relevantVerticalLines.length === 0) {
        return null;
    }

    return (
        <div className="grapher-vertical-lines">
            <svg width={elementWidth || sizing.elementWidth} height={elementHeight || sizing.elementHeight}>
                {
                    relevantVerticalLines.map((line, index) => {
                        if (isRangeGraph && typeof line.onRangeGraph === 'object') {
                            line = {
                                ...line,
                                ...line.onRangeGraph
                            };
                        }

                        const xT = (line.x - bounds.minX)/(bounds.maxX - bounds.minX);

                        if (xT < 0 || xT > 1) {
                            return null;
                        }

                        const pixelX = xT * (elementWidth || sizing.elementWidth);
                        if (typeof line.minPixelX === 'number' && pixelX < line.minPixelX) {
                            return null;
                        }

                        if (typeof line.maxPixelX === 'number' && pixelX > line.maxPixelX) {
                            return null;
                        }

                        const lineStyle = {
                            stroke: line.color,
                            strokeWidth: line.width,
                            ...(line.style || {})
                        };

                        const markerStyle = {
                            fill: line.color,
                            ...(line.markerStyle || {})
                        };

                        const textStyle = {
                            ...{
                                fontSize: '12px',
                                fill: line.color,
                                stroke: 'none',
                                textAnchor: 'middle',
                                dominantBaseline: 'hanging'
                            },
                            ...(line.textStyle || {})
                        };

                        let lineTop = 0;
                        if (typeof line.lineTop === 'number') {
                            lineTop = line.lineTop;
                        } else if (line.text) {
                            lineTop = 18;
                        }

                        let textTop = 5;
                        if (typeof line.textTop === 'number') {
                            textTop = line.textTop;
                        }

                        return (
                            <React.Fragment key={index}>
                                <line
                                    x1={pixelX}
                                    y1={lineTop}
                                    x2={pixelX}
                                    y2={(elementHeight || sizing.elementHeight)}
                                    style={lineStyle}
                                />

                                {
                                    line.markTop &&
                                    <polygon
                                        points={`${pixelX - 3},0 ${pixelX + 3},0 ${pixelX},3`}
                                        style={markerStyle}
                                    />
                                }

                                {
                                    line.text &&
                                    <text
                                        x={pixelX}
                                        y={textTop}
                                        style={textStyle}
                                    >
                                        {line.text}
                                    </text>
                                }
                            </React.Fragment>
                        );
                    })
                }
            </svg>
        </div>
    );
}

VerticalLines.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    verticalLines: CustomPropTypes.VerticalLines.isRequired,
    isRangeGraph: PropTypes.bool,
    bounds: PropTypes.object,
    elementWidth: PropTypes.number,
    elementHeight: PropTypes.number
};
