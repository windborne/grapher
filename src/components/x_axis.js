import React from 'react';
import PropTypes from 'prop-types';
import {calculatePrecision, calculateTimePrecision, formatX} from '../helpers/format';
import placeGrid from '../helpers/place_grid';
import {useEnumMap, useHasXEnum, usePrimarySize, useSelection} from '../state/hooks';
import StateController from '../state/state_controller';

export default React.memo(XAxis);

function XAxis({ showAxes, showGrid, stateController, bigLabels, xTickUnit, clockStyle, timeZone, integersOnly }) {
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
        inverseEnumMap
    };

    const minLabel = formatX(minX, {...formatOptions, dates, precision }).toString();
    const maxLabel = formatX(maxX, {...formatOptions, dates, precision }).toString();

    let expectedLabelWidth = Math.max(minLabel.length, maxLabel.length) * 4;
    if (bigLabels) {
        expectedLabelWidth *= 2;
    }

    const labelPadding = 30; // space in between labels in the expected case

    const ticks = placeGrid({
        min: minX,
        max: maxX,
        totalSize: elementWidth,
        precision,
        dates,
        formatter: formatX,
        expectedLabelSize: expectedLabelWidth,
        labelPadding,
        formatOptions
    });

    const xAxisHeight = 20;

    return (
        <svg className="axis x-axis" style={showAxes ? undefined : {marginBottom: -20}}>
            {
                showAxes &&
                <path d={`M-1,0 H${elementWidth}`} className="axis-line" />
            }
            {
                showAxes &&
                <path d={`M-2,1 H${elementWidth + 1}`} className="axis-line-shadow" />
            }

            {
                ticks.map(({ pixelValue, label, size, position, skipGrid }, i) => {
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
                                <path d={`M${pixelValue},1 v6`} className="axis-tick" />
                            }

                            {
                                showGrid && !skipGrid &&
                                <path d={`M${pixelValue},0 v-${elementHeight}`} />
                            }

                            {
                                showAxes &&
                                <text x={pixelValue} y={xAxisHeight - 5}>
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
    integersOnly: PropTypes.bool
};
