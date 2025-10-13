import {startOfDayInTimezone, timezoneToOffsetMS} from './format';

function placeTick(trueValue, {scale, min, max, inverted, totalSize, precision, formatter, dates, justTime, justDate, formatOptions={} }, opts={}) {
    let scaledValue = trueValue;

    if (scale === 'log') {
        scaledValue = 10**trueValue;
    }

    let percent = (trueValue - min)/(max - min);
    if (inverted) {
        percent = 1.0 - percent;
    }

    let pixelValue = percent * totalSize;
    if (isNaN(pixelValue)) {
        pixelValue = 0;
    }

    return {
        pixelValue,
        trueValue: scaledValue,
        label: formatter(scaledValue, { ...formatOptions, precision, log: scale === 'log', dates, justTime, justDate }),
        size: 'major',
        ...opts
    };
}

function placeTickByPixel(pixelValue, {scale, min, max, inverted, totalSize, precision, formatter, dates, justTime, justDate, formatOptions={} }, opts={}) {
    let percent = pixelValue/totalSize;
    if (inverted) {
        percent = 1.0 - percent;
    }

    let trueValue = percent * (max - min) + min;

    if (scale === 'log') {
        trueValue = Math.pow(10, trueValue);
    }

    return {
        pixelValue,
        trueValue,
        label: formatter(trueValue, { ...formatOptions, precision, log: scale === 'log', dates, justTime, justDate }),
        size: 'major',
        ...opts
    };
}

function roundToEvenNumber(value, tickSpacing) {
    return Math.round(value/tickSpacing)*tickSpacing;
}

function getEvenTickSpacing(span, desiredCount) {
    const subspan = span/desiredCount;

    const precision = -Math.log10(Math.abs(subspan)) + 1;
    const multiplier = (precision - Math.floor(precision)) > 0.5 ? 2 : 1;

    const roundTo = 10**Math.floor(precision) * multiplier;

    return Math.round(subspan * roundTo)/roundTo;
}

function roundToDivisor(value, divisor) {
    if (value <= 1) {
        return 1;
    }

    if (divisor === 1) {
        return Math.round(value);
    }

    if (value >= divisor) {
        return Math.round(value/divisor)*divisor;
    }

    let divisors;
    if (divisor === 24) {
        divisors = [1, 2, 6, 12, 24];
    } else if (divisor === 60) {
        divisors = [1, 2, 5, 10, 15, 30, 60];
    } else {
        throw new Error('Invalid divisor');
    }

    let bestDelta = Infinity;
    let bestDivisor = 1;
    for (let i = 0; i < divisors.length; i++) {
        const delta = Math.abs(divisors[i] - value);
        if (delta < bestDelta) {
            bestDivisor = divisors[i];
            bestDelta = delta;
        }
    }

    return bestDivisor;
}

function getEvenDateTickSpacing(span, desiredCount, unitOverride) {
    const subspan = span / desiredCount;

    if (subspan < 60*1000 && (!unitOverride || unitOverride === 'second')) {
        return {
            amount: roundToDivisor(subspan/1000, 60),
            unit: 's'
        };
    }

    if (subspan < 60*60*1000 && (!unitOverride || unitOverride === 'minute')) {
        return {
            amount: roundToDivisor(subspan/(60*1000), 60),
            unit: 'm'
        };
    }

    if (subspan < 24*60*60*1000 && (!unitOverride || unitOverride === 'hour')) {
        return {
            amount: roundToDivisor(subspan/(60*60*1000), 24),
            unit: 'h'
        };
    }

    if (unitOverride === 'day' || (subspan < 30*24*60*60*1000 && !unitOverride)) {
        return {
            amount: roundToDivisor(subspan/(24*60*60*1000), 1),
            unit: 'd'
        };
    }

    if (subspan > 30*24*60*60*1000 && (!unitOverride || unitOverride === 'month')) {
        return {
            amount: roundToDivisor(subspan/30*24*60*60*1000, 1),
            unit: 'month'
        };
    }

    if (unitOverride === 'year') {
        return {
            amount: roundToDivisor(subspan/365*24*60*60*1000, 1),
            unit: 'year'
        };
    }

    return {
        unit: 'm',
        amount: 60
    };
}

function placeNumbersGrid({ min, max, precision, expectedLabelSize, labelPadding, totalSize, scale='linear', formatter, inverted=false, formatOptions }) {
    const paddedLabelSize = expectedLabelSize + 2*labelPadding;

    const ticks = [];
    const placementParams = {scale, min, max, inverted, totalSize, precision, formatter, formatOptions, dates: false };

    const labelCount = Math.floor((totalSize - expectedLabelSize*2)/paddedLabelSize);
    const tickSpacing = getEvenTickSpacing(max - min, labelCount);
    if (tickSpacing > 0) {
        for (let value = roundToEvenNumber(min, tickSpacing); value < max; value += tickSpacing) {
            ticks.push(placeTick(value, placementParams));
        }
    }

    if (ticks.length) {
        if (inverted && ticks[ticks.length - 1].pixelValue > labelPadding) {
            ticks.push(placeTickByPixel(expectedLabelSize / 2, placementParams));
        }
    }

    return ticks.filter(({ pixelValue }) => pixelValue <= totalSize && pixelValue >= 0);
}

function placeDatesGrid({ min, max, precision, expectedLabelSize, labelPadding, totalSize, skipFirst=false, skipLast=false, scale='linear', formatter, inverted=false, formatOptions }) {
    const paddedLabelSize = expectedLabelSize + 2*labelPadding;

    const ticks = [];
    const placementParams = {scale, min, max, inverted, totalSize, precision, formatter, formatOptions, dates: true };

    const { amount, unit } = getEvenDateTickSpacing(max - min, totalSize/paddedLabelSize, formatOptions.unitOverride);

    const justDate = unit === 'month';

    if (!skipFirst) {
        ticks.push(placeTickByPixel(0, {...placementParams, justDate}, {position: 'first'}));
    }

    let currentDate = new Date(min);

    if (unit === 'h') {
        currentDate.setMinutes(0, 0, 0);
    } else if (unit === 'm') {
        currentDate.setSeconds(0, 0);
    } else if (unit === 's') {
        currentDate.setMilliseconds(0);
    } else if (unit === 'month') {
        currentDate = startOfDayInTimezone(currentDate, formatOptions.timeZone);
        currentDate.setDate(1);
    } else if (unit === 'd') {
        currentDate = startOfDayInTimezone(currentDate, formatOptions.timeZone);
    }

    let lastDateString = formatter(currentDate, {...formatOptions, ...placementParams, justDate: true });
    while (currentDate < max) {
        let delta = 24*60*60*1000;

        if (unit === 'h') {
            delta = (amount - currentDate.getHours() % amount)*60*60*1000;
        } else if (unit === 'm') {
            delta = (amount - currentDate.getMinutes() % amount)*60*1000;
        } else if (unit === 's') {
            delta = (amount - currentDate.getSeconds() % amount)*1000;
        } else if (unit === 'month') {
            delta = 0;
            if (currentDate.getMonth() === 11) {
                currentDate = new Date(currentDate.getFullYear() + 1, 0, 1);
            } else {
                currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            }
        } else if (unit === 'year') {
            currentDate = new Date(currentDate.getFullYear() + 1, 0, 0);
        }

        currentDate = new Date(currentDate.valueOf() + delta);

        const justTime = formatter(currentDate, {...formatOptions, ...placementParams, justDate: true }) === lastDateString;

        const tick = placeTick(currentDate, {...placementParams, justTime, justDate});

        if (ticks.length && (tick.pixelValue - ticks[ticks.length - 1].pixelValue) < (expectedLabelSize + (labelPadding || 0))) {
            continue;
        }

        if (tick.pixelValue + expectedLabelSize/2 >= totalSize) {
            continue;
        }

        ticks.push(tick);
        lastDateString = formatter(currentDate, {...formatOptions, ...placementParams, justDate: true });
    }

    const justTime = lastDateString === formatter(max, {...formatOptions, ...placementParams, justDate: true });

    if (!skipLast && ticks[ticks.length - 1].pixelValue + expectedLabelSize < totalSize) {
        ticks.push(placeTickByPixel(totalSize, {...placementParams, justTime, justDate}, {position: 'last'}));
    }

    return ticks.filter(({ pixelValue }) => pixelValue <= totalSize && pixelValue >= 0);
}

function placeTimeOnlyGrid({ min, max, precision, expectedLabelSize, labelPadding, totalSize, skipFirst=false, skipLast=false, scale='linear', formatter, inverted=false, formatOptions={} }) {
    const paddedLabelSize = expectedLabelSize + 2*labelPadding;
    const ticks = [];
    const placementParams = { scale, min, max, inverted, totalSize, precision, formatter, formatOptions, dates: true };

    const desiredCount = Math.floor(totalSize/paddedLabelSize);
    const span = max - min;
    
    let unit, amount;
    
    const hourSpan = span / (60 * 60 * 1000);
    const minuteSpan = span / (60 * 1000);
    
    if (hourSpan <= desiredCount * 8) {
        unit = 'h';
        amount = Math.max(1, Math.ceil(hourSpan / desiredCount));
        if (amount <= 6) {
        } else if (amount <= 12) {
            amount = 12;
        } else if (amount <= 24) {
            amount = 24;
        } else {
            amount = Math.ceil(amount / 24) * 24;
        }
    } else {
        unit = 'h';
        amount = 24;
    }
    
    if (!skipFirst) {
        ticks.push(placeTickByPixel(0, {...placementParams, justTime: true}, {position: 'first'}));
    }
    
    let currentDate = new Date(min);
    
    if (unit === 'h') {
        if (amount === 24) {
            currentDate = startOfDayInTimezone(currentDate, formatOptions.timeZone);
        } else {
            const offset = formatOptions.timeZone ? timezoneToOffsetMS(formatOptions.timeZone, currentDate) : 0;
            const localOffset = timezoneToOffsetMS('local', currentDate);
            
            if (offset !== null && localOffset !== null) {
                const adjustedDate = new Date(currentDate.valueOf() + offset - localOffset);
                adjustedDate.setMinutes(0, 0, 0);
                
                if (amount === 12) {
                    const currentHour = adjustedDate.getHours();
                    const alignedHour = currentHour < 12 ? 0 : 12;
                    adjustedDate.setHours(alignedHour);
                } else {
                    const currentHour = adjustedDate.getHours();
                    const alignedHour = Math.floor(currentHour / amount) * amount;
                    adjustedDate.setHours(alignedHour);
                }
                
                currentDate = new Date(adjustedDate.valueOf() - offset + localOffset);
            } else {
                currentDate.setMinutes(0, 0, 0);
                if (amount === 12) {
                    const currentHour = currentDate.getHours();
                    const alignedHour = currentHour < 12 ? 0 : 12;
                    currentDate.setHours(alignedHour);
                } else {
                    const currentHour = currentDate.getHours();
                    const alignedHour = Math.floor(currentHour / amount) * amount;
                    currentDate.setHours(alignedHour);
                }
            }
        }
    } else if (unit === 'm') {
        currentDate.setSeconds(0, 0);
        const currentMinute = currentDate.getMinutes();
        const alignedMinute = Math.floor(currentMinute / amount) * amount;
        currentDate.setMinutes(alignedMinute);
    } else if (unit === 's') {
        currentDate.setMilliseconds(0);
        const currentSecond = currentDate.getSeconds();
        const alignedSecond = Math.floor(currentSecond / amount) * amount;
        currentDate.setSeconds(alignedSecond);
    }
    
    while (currentDate < min) {
        if (unit === 'h') {
            currentDate = new Date(currentDate.valueOf() + amount * 60 * 60 * 1000);
        } else if (unit === 'm') {
            currentDate = new Date(currentDate.valueOf() + amount * 60 * 1000);
        } else if (unit === 's') {
            currentDate = new Date(currentDate.valueOf() + amount * 1000);
        }
    }
    
    while (currentDate < max) {
        const tick = placeTick(currentDate, {...placementParams, justTime: true});
        
        const reservedSpaceForLast = expectedLabelSize + labelPadding;
        const maxPixelForMiddleTicks = totalSize - reservedSpaceForLast;
        
        if (ticks.length && (tick.pixelValue - ticks[ticks.length - 1].pixelValue) < (expectedLabelSize + labelPadding)) {
        } else if (tick.pixelValue + expectedLabelSize < maxPixelForMiddleTicks) {
            ticks.push(tick);
        } else {
            break;
        }
        
        if (unit === 'h') {
            currentDate = new Date(currentDate.valueOf() + amount * 60 * 60 * 1000);
        } else if (unit === 'm') {
            currentDate = new Date(currentDate.valueOf() + amount * 60 * 1000);
        } else if (unit === 's') {
            currentDate = new Date(currentDate.valueOf() + amount * 1000);
        } else {
            break;
        }
    }
    
    if (!skipLast) {
        const lastTick = placeTick(max, {...placementParams, justTime: true}, {position: 'last'});
        if (ticks.length === 0 || (lastTick.pixelValue - ticks[ticks.length - 1].pixelValue) >= (expectedLabelSize + labelPadding/2)) {
            ticks.push(lastTick);
        } else {
            ticks[ticks.length - 1] = lastTick;
        }
    }
    
    return ticks.filter(({ pixelValue }) => pixelValue <= totalSize && pixelValue >= 0);
}

function placeDateOnlyGrid({ min, max, precision, expectedLabelSize, labelPadding, totalSize, skipFirst=false, skipLast=false, scale='linear', formatter, inverted=false, formatOptions={} }) {
    const paddedLabelSize = expectedLabelSize + 2*labelPadding;
    const ticks = [];
    
    const minYear = new Date(min).getFullYear();
    const maxYear = new Date(max).getFullYear();
    const spanMultipleYears = minYear !== maxYear;

    const customDateFormatter = (date, options) => {
        const timeZone = formatOptions.timeZone;
        const result = formatter(date, { ...options, dates: true, justMonthAndDay: !spanMultipleYears, justDate: spanMultipleYears, timeZone });
        return result;
    };
    
    const placementParams = { scale, min, max, inverted, totalSize, precision, formatter: customDateFormatter, formatOptions, dates: true };
    
    const span = max - min;
    const hourSpan = span / (60 * 60 * 1000);
    
    let { amount, unit } = getEvenDateTickSpacing(span, totalSize/paddedLabelSize, formatOptions.unitOverride);
    
    if ((unit === 'h' || unit === 'm' || unit === 's') && hourSpan >= 48) {
        unit = 'd';
        amount = Math.max(1, Math.ceil(hourSpan / 24 / Math.floor(totalSize/paddedLabelSize)));
    } else if ((unit === 'h' || unit === 'm' || unit === 's') && hourSpan < 48) {
        const startTick = placeTick(min, {...placementParams, justDate: true}, {position: 'first'});
        const endTick = placeTick(max, {...placementParams, justDate: true}, {position: 'last'});
        
        const ticks = [startTick];
        if ((endTick.pixelValue - startTick.pixelValue) >= (expectedLabelSize + labelPadding)) {
            ticks.push(endTick);
        }
        
        return ticks.filter(({ pixelValue }) => pixelValue <= totalSize && pixelValue >= 0);
    }
    
    if (!skipFirst) {
        ticks.push(placeTickByPixel(0, {...placementParams, justDate: true}, {position: 'first'}));
    }
    
    let currentDate = new Date(min);
    
    if (unit === 'month') {
        currentDate = startOfDayInTimezone(currentDate, formatOptions.timeZone);
        currentDate.setDate(1);
    } else if (unit === 'd') {
        currentDate = startOfDayInTimezone(currentDate, formatOptions.timeZone);
    }
    
    while (currentDate < max) {
        let delta = 24*60*60*1000;
        
        if (unit === 'month') {
            delta = 0;
            if (currentDate.getMonth() === 11) {
                currentDate = new Date(currentDate.getFullYear() + 1, 0, 1);
            } else {
                currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
            }
        } else if (unit === 'year') {
            currentDate = new Date(currentDate.getFullYear() + 1, 0, 1);
            delta = 0;
        } else if (unit === 'd') {
            delta = amount * 24 * 60 * 60 * 1000;
        }
        
        if (delta > 0) {
            currentDate = new Date(currentDate.valueOf() + delta);
        }
        
        const tick = placeTick(currentDate, {...placementParams, justDate: true});
        
        const reservedSpaceForLast = expectedLabelSize + labelPadding;
        const maxPixelForMiddleTicks = totalSize - reservedSpaceForLast;
        
        if (ticks.length && (tick.pixelValue - ticks[ticks.length - 1].pixelValue) < (expectedLabelSize + (labelPadding || 0))) {
            continue;
        }
        
        if (tick.pixelValue + expectedLabelSize < maxPixelForMiddleTicks) {
            ticks.push(tick);
        } else {
            break;
        }
    }
    
    if (!skipLast) {
        const lastTick = placeTick(max, {...placementParams, justDate: true}, {position: 'last'});
        if (ticks.length === 0 || (lastTick.pixelValue - ticks[ticks.length - 1].pixelValue) >= (expectedLabelSize + labelPadding/2)) {
            ticks.push(lastTick);
        } else {
            ticks[ticks.length - 1] = lastTick;
        }
    }

    if (ticks.length === 0 && hourSpan >= 48) {
        ticks.push(placeTickByPixel(0, {...placementParams, justDate: true}, {position: 'first'}));
    }
    
    return ticks.filter(({ pixelValue }) => pixelValue <= totalSize && pixelValue >= 0);
}

export { placeTimeOnlyGrid, placeDateOnlyGrid };

export default function placeGrid(opts) {
    if (opts.dates) {
        return placeDatesGrid(opts);
    } else {
        return placeNumbersGrid(opts);
    }
}
