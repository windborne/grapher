import React from 'react';
import PropTypes from 'prop-types';
import {calculatePrecision, calculateTimePrecision, formatX} from '../helpers/format';
import placeGrid, { placeTimeOnlyGrid, placeDateOnlyGrid } from '../helpers/place_grid';
import {useEnumMap, useHasXEnum, usePrimarySize, useSelection} from '../state/hooks';
import StateController from '../state/state_controller';

export default React.memo(XAxis);

function XAxis({ showAxes, showGrid, stateController, bigLabels, xTickUnit, clockStyle, timeZone, integersOnly, formatXAxisLabel }) {
    if (!showAxes && !showGrid) {
        return null;
    }

    const { elementWidth, elementHeight } = usePrimarySize(stateController);
    const {minX, maxX, dates} = useSelection(stateController);
    const hasXEnum = useHasXEnum(stateController);
    const enumMap = useEnumMap(stateController);

    let precision;
    if (dates) {
        precision = calculateTimePrecision(minX, maxX);
    } else {
        precision = calculatePrecision(maxX - minX);
    }

    let inverseEnumMap = null;
    if (hasXEnum) {
        inverseEnumMap = {};
        for (const [key, value] of Object.entries(enumMap)) {
            inverseEnumMap[value] = key;
        }
    }

    const formatOptions = {
        unitOverride: xTickUnit,
        clockStyle,
        timeZone,
        integersOnly,
        inverseEnumMap,
        formatter: formatXAxisLabel
    };

    const minLabel = formatX(minX, {...formatOptions, dates, precision }).toString();
    const maxLabel = formatX(maxX, {...formatOptions, dates, precision }).toString();

    let expectedLabelWidth = Math.max(minLabel.length, maxLabel.length);
    if (bigLabels) {
        expectedLabelWidth *= 2;
    }

    const labelPadding = 30;

    let timeTicks = null;
    let dateTicks = null;
    let regularTicks = null;
    
    if (dates) {
        timeTicks = placeTimeOnlyGrid({
            min: minX,
            max: maxX,
            totalSize: elementWidth,
            precision,
            expectedLabelSize: expectedLabelWidth,
            labelPadding: labelPadding * 0.8,
            formatter: formatXAxisLabel || formatX,
            formatOptions
        });
        
        dateTicks = placeDateOnlyGrid({
            min: minX,
            max: maxX,
            totalSize: elementWidth,
            precision,
            expectedLabelSize: expectedLabelWidth * 2,
            labelPadding: labelPadding * 1.5,
            formatter: formatXAxisLabel || formatX,
            formatOptions
        });
    } else {
        regularTicks = placeGrid({
            min: minX,
            max: maxX,
            totalSize: elementWidth,
            precision,
            dates,
            formatter: formatXAxisLabel || formatX,
            expectedLabelSize: expectedLabelWidth,
            labelPadding,
            formatOptions
        });
    }

    const xAxisHeight = dates ? 30 : 20;

    return (
        <svg className={`axis x-axis${dates ? ' x-axis-dual' : ''}`} style={showAxes ? undefined : {marginBottom: -20}}>
            {
                showAxes &&
                <path d={`M-1,0 H${elementWidth}`} className="axis-line" />
            }

            {/* Render time ticks in first row */}
            {
                dates && timeTicks && timeTicks.map(({ pixelValue, label, size, position, skipGrid }, i) => {
                    if (isNaN(pixelValue)) {
                        return null;
                    }

                    const classes = ['axis-item', `axis-item-${size}`, `axis-item-${position}`];
                    if (bigLabels) {
                        classes.push('axis-item-big-labels');
                    }
                    
                    return (
                        <g key={`time-${i}`} className={classes.join(' ')}>
                            {
                                showAxes &&
                                <path d={`M${pixelValue},1 v12`} className="axis-tick" />
                            }

                            {
                                showGrid && !skipGrid &&
                                <path d={`M${pixelValue},0 v-${elementHeight}`} />
                            }

                            {
                                showAxes &&
                                <text 
                                    x={position === 'last' ? pixelValue - 3 : pixelValue + 3} 
                                    y={12} 
                                    textAnchor={position === 'last' ? 'end' : 'start'}
                                    className='x-axis-text x-axis-time-text'
                                >
                                    {label}
                                </text>
                            }
                        </g>
                    );
                })
            }
            
            {/* Render date ticks in second row */}
            {
                dates && dateTicks && dateTicks.map(({ pixelValue, label, size, position }, i) => {
                    if (isNaN(pixelValue)) {
                        return null;
                    }

                    const classes = ['axis-item', `axis-item-${size}`, `axis-item-${position}`];
                    if (bigLabels) {
                        classes.push('axis-item-big-labels');
                    }

                    return (
                        <g key={`date-${i}`} className={classes.join(' ')}>
                            {
                                showAxes &&
                                <text 
                                    x={position === 'last' ? pixelValue - 3 : pixelValue + 3} 
                                    y={25} 
                                    textAnchor={position === 'last' ? 'end' : 'start'}
                                    className='x-axis-text x-axis-date-text'
                                >
                                    {label}
                                </text>
                            }
                        </g>
                    );
                })
            }
            
            {/* Render regular ticks for non-date data */}
            {
                !dates && regularTicks && regularTicks.map(({ pixelValue, label, size, position, skipGrid }, i) => {
                    if (isNaN(pixelValue)) {
                        return null;
                    }

                    const classes = ['axis-item', `axis-item-${size}`, `axis-item-${position}`];
                    if (bigLabels) {
                        classes.push('axis-item-big-labels');
                    }

                    return (
                        <g key={i} className={classes.join(' ')}>
                            {
                                showAxes &&
                                <path d={`M${pixelValue},1 v12`} className="axis-tick" />
                            }

                            {
                                showGrid && !skipGrid &&
                                <path d={`M${pixelValue},0 v-${elementHeight}`} />
                            }

                            {
                                showAxes &&
                                <text 
                                    x={position === 'last' ? pixelValue - 3 : pixelValue + 3} 
                                    y={xAxisHeight - 5} 
                                    textAnchor={position === 'last' ? 'end' : 'start'}
                                    className='x-axis-text'
                                >
                                    {label}
                                </text>
                            }
                        </g>
                    );
                })
            }
        </svg>
    );
}

XAxis.propTypes = {
    stateController: PropTypes.instanceOf(StateController).isRequired,
    showAxes: PropTypes.bool.isRequired,
    showGrid: PropTypes.bool.isRequired,
    bigLabels: PropTypes.bool,
    xTickUnit: PropTypes.oneOf(['year']),
    clockStyle: PropTypes.oneOf(['12h', '24h']),
    timeZone: PropTypes.string,
    integersOnly: PropTypes.bool,
    formatXAxisLabel: PropTypes.func
};
