import React from 'react';
import PropTypes from 'prop-types';
import CustomPropTypes from '../helpers/custom_prop_types';
import {calculatePrecision, calculateTimePrecision, formatX, timezoneToOffsetMS} from '../helpers/format';
import placeGrid, { placeTimeOnlyGrid, placeDateOnlyGrid } from '../helpers/place_grid';
import {useEnumMap, useHasXEnum, usePrimarySize, useSelection} from '../state/hooks';
import StateController from '../state/state_controller';

export default React.memo(XAxis);

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function numberForX(value) {
    return value instanceof Date ? value.getTime() : value;
}

function getTimeZoneOffset(timeZone, date) {
    if (timeZone && timeZone.toLowerCase && timeZone.toLowerCase() === 'utc') {
        return 0;
    }

    return timezoneToOffsetMS(timeZone || 'local', date);
}

function dateInTimeZone(value, timeZone) {
    const date = new Date(value);
    if (!timeZone || timeZone === 'local') {
        return date;
    }

    const offset = getTimeZoneOffset(timeZone, date);
    const localOffset = timezoneToOffsetMS('local', date);
    if (typeof offset !== 'number' || typeof localOffset !== 'number') {
        return date;
    }

    return new Date(date.valueOf() + offset - localOffset);
}

function timestampFromTimeZoneDate(date, timeZone) {
    if (!timeZone || timeZone === 'local') {
        return date.getTime();
    }

    const offset = getTimeZoneOffset(timeZone, date);
    const localOffset = timezoneToOffsetMS('local', date);
    if (typeof offset !== 'number' || typeof localOffset !== 'number') {
        return date.getTime();
    }

    return date.valueOf() - offset + localOffset;
}

function formatCompactDayLabel(value, timeZone) {
    const intlTimeZone = getIntlTimeZone(timeZone);
    const parts = new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        day: 'numeric',
        timeZone: intlTimeZone
    }).formatToParts(new Date(value));
    const weekday = parts.find(part => part.type === 'weekday')?.value;
    const day = parts.find(part => part.type === 'day')?.value;

    return weekday && day ? `${weekday} ${day}` : parts.map(part => part.value).join('');
}

function formatCompactTimeLabel(value, timeZone) {
    const intlTimeZone = getIntlTimeZone(timeZone);
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        timeZone: intlTimeZone
    }).format(new Date(value)).toLowerCase();
}

function getIntlTimeZone(timeZone) {
    if (!timeZone || timeZone === 'local') {
        return undefined;
    }

    if (timeZone.toLowerCase && timeZone.toLowerCase() === 'utc') {
        return 'UTC';
    }

    return timeZone;
}

function nextAlignedHour(value, intervalHours, timeZone) {
    const date = dateInTimeZone(value, timeZone);
    date.setMinutes(0, 0, 0);

    const alignedHour = Math.ceil(date.getHours() / intervalHours) * intervalHours;
    if (alignedHour >= 24) {
        date.setDate(date.getDate() + 1);
        date.setHours(0, 0, 0, 0);
    } else {
        date.setHours(alignedHour, 0, 0, 0);
    }

    return timestampFromTimeZoneDate(date, timeZone);
}

function buildCompactTimeTicks({ minX, maxX, timeZone }) {
    const span = maxX - minX;
    if (!Number.isFinite(span) || span <= 0) {
        return [];
    }

    if (span >= 48 * HOUR_MS) {
        const firstDay = dateInTimeZone(minX, timeZone);
        firstDay.setHours(0, 0, 0, 0);

        const labels = [];
        for (let tick = timestampFromTimeZoneDate(firstDay, timeZone); tick <= maxX; tick += DAY_MS) {
            if (tick < minX) {
                continue;
            }

            labels.push({
                x: tick,
                label: formatCompactDayLabel(tick, timeZone)
            });
        }

        return labels;
    }

    let intervalHours = 1;
    if (span >= 18 * HOUR_MS) {
        intervalHours = 6;
    } else if (span >= 8 * HOUR_MS) {
        intervalHours = 3;
    }

    const labels = [];
    const interval = intervalHours * HOUR_MS;
    for (let tick = nextAlignedHour(minX, intervalHours, timeZone); tick <= maxX; tick += interval) {
        labels.push({
            x: tick,
            label: formatCompactTimeLabel(tick, timeZone)
        });
    }

    return labels;
}

function ticksWithPixels({ ticks, minX, maxX, elementWidth }) {
    return ticks.map((tick) => {
        const x = numberForX(tick.x);
        const pixelValue = ((x - minX) / (maxX - minX)) * elementWidth;
        const position = pixelValue > elementWidth - 60 ? 'last' : 'normal';

        return {
            ...tick,
            pixelValue,
            position,
            size: 'custom'
        };
    }).filter(({ pixelValue }) => pixelValue >= 0 && pixelValue <= elementWidth);
}

function getCustomTicks({ xAxisTicks, minX, maxX, dates, elementWidth, elementHeight, clockStyle, timeZone }) {
    if (!xAxisTicks || xAxisTicks === 'auto') {
        return null;
    }

    let ticks;
    if (xAxisTicks === 'compact-time') {
        if (!dates) {
            return null;
        }
        ticks = buildCompactTimeTicks({ minX, maxX, timeZone });
    } else if (typeof xAxisTicks === 'function') {
        ticks = xAxisTicks({ minX, maxX, dates, elementWidth, elementHeight, clockStyle, timeZone });
    } else {
        ticks = xAxisTicks;
    }

    if (!Array.isArray(ticks)) {
        return null;
    }

    return ticksWithPixels({ ticks, minX, maxX, elementWidth });
}

function XAxis({ showAxes, showGrid, stateController, bigLabels, xTickUnit, clockStyle, timeZone, integersOnly, formatXAxisLabel, xAxisTicks }) {
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
    const customTicks = getCustomTicks({
        xAxisTicks,
        minX,
        maxX,
        dates,
        elementWidth,
        elementHeight,
        clockStyle,
        timeZone
    });

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
                customTicks && customTicks.map(({ pixelValue, label, size, position, skipGrid }, i) => {

                    const singleTick = customTicks.length === 1;
                    
                    if (isNaN(pixelValue)) {
                        return null;
                    }

                    const classes = ['axis-item', `axis-item-${size}`, `axis-item-${position}`];
                    if (bigLabels) {
                        classes.push('axis-item-big-labels');
                    }
                    
                    return (
                        <g key={`custom-${i}`} className={classes.join(' ')}>
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
                                    x={(position === 'last' && !singleTick) ? pixelValue - 3 : pixelValue + 3} 
                                    y={dates ? 25 : xAxisHeight - 5} 
                                    textAnchor={(position === 'last' && !singleTick) ? 'end' : 'start'}
                                    className='x-axis-text x-axis-custom-text'
                                >
                                    {label}
                                </text>
                            }
                        </g>
                    );
                })
            }

            {/* Render time ticks in first row */}
            {
                !customTicks && dates && timeTicks && timeTicks.map(({ pixelValue, label, size, position, skipGrid }, i) => {

                    const singleTick = timeTicks.length === 1;
                    
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
                                    x={(position === 'last' && !singleTick) ? pixelValue - 3 : pixelValue + 3} 
                                    y={12} 
                                    textAnchor={(position === 'last' && !singleTick) ? 'end' : 'start'}
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
                !customTicks && dates && dateTicks && dateTicks.map(({ pixelValue, label, size, position, trueValue }, i) => {
                    
                    if (isNaN(pixelValue)) {
                        return null;
                    }

                    const classes = ['axis-item', `axis-item-${size}`, `axis-item-${position}`];
                    if (bigLabels) {
                        classes.push('axis-item-big-labels');
                    }

                    let timezoneLabel = undefined;
                    if (timeZone) {
                        if (i === 0) {
                            timezoneLabel = timeZone.toLowerCase() === 'utc' ? 'UTC' : timeZone;
                        }
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
                                    <tspan className='x-axis-date-label'>
                                        {label}
                                    </tspan>
                                    {timezoneLabel && (
                                        <tspan className='x-axis-timezone-label'>
                                            {' '}({timezoneLabel})
                                        </tspan>
                                    )}
                                </text>
                            }
                        </g>
                    );
                })
            }
            
            {/* Render regular ticks for non-date data */}
            {
                !customTicks && !dates && regularTicks && regularTicks.map(({ pixelValue, label, size, position, skipGrid }, i) => {
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
    formatXAxisLabel: PropTypes.func,
    xAxisTicks: CustomPropTypes.XAxisTicks
};
