import React from 'react';
import CustomPropTypes from '../helpers/custom_prop_types.js';
import PropTypes from 'prop-types';
import StateController from '../state/state_controller.js';
import {useAxisBounds, useSizing} from '../state/hooks.js';

export default React.memo(VerticalLines);

function VerticalLines({ stateController, verticalLines }) {
    const bounds = useAxisBounds(stateController)[0];
    const sizing = useSizing(stateController);

    if (!sizing) {
        return null;
    }

    return (
        <div className="grapher-vertical-lines">
            <svg width={sizing.elementWidth} height={sizing.elementHeight}>
                {
                    verticalLines.map((line, index) => {
                        const xT = (line.x - bounds.minX)/(bounds.maxX - bounds.minX);

                        if (xT < 0 || xT > 1) {
                            return null;
                        }

                        const pixelX = xT * sizing.elementWidth;

                        const lineStyle = {
                            stroke: line.color,
                            strokeWidth: line.width,
                            ...(line.style || {})
                        };

                        const markerStyle = {
                            fill: line.color,
                            ...(line.markerStyle || {})
                        };

                        return (
                            <React.Fragment key={index}>
                                <line
                                    x1={pixelX}
                                    y1={0}
                                    x2={pixelX}
                                    y2={sizing.elementHeight}
                                    style={lineStyle}
                                />

                                {
                                    line.markTop &&
                                    <polygon
                                        points={`${pixelX - 3},0 ${pixelX + 3},0 ${pixelX},3`}
                                        style={markerStyle}
                                    />
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
    verticalLines: CustomPropTypes.VerticalLines.isRequired
};
