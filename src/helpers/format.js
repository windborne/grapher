export function calculatePrecision(value) {
    return Math.max(-Math.log10(Math.abs(value)) + 2, 0);
}

export function calculateTimePrecision(minDate, maxDate) {
    minDate = new Date(minDate);
    maxDate = new Date(maxDate);

    const range = maxDate.valueOf() - minDate.valueOf();
    if (range < 3*1000) {
        return 'ms';
    } else if (range < 10*60*1000) {
        return 's';
    } else {
        return 'm';
    }
}

export function roundToPrecision(value, precision=null) {
    if (precision === null) {
        precision = calculatePrecision(value);
    }

    if (isNaN(precision) || precision > 100) {
        return value.toString();
    }

    const rounded = value.toFixed(Math.ceil(precision));
    let stripped = rounded;
    if (rounded.includes('.')) {
        stripped = stripped.replace(/\.?0+$/g, '');
    }

    if (stripped === '') {
        return '0';
    }

    return stripped;
}

const DATE_TIME_FORMATTERS = {};

/**
 * Given a timezone string, gets the offset relative to utc in milliseconds
 * For example, America/New_York in winter is GMT-05:00, so it evaluates to -5*60*60*1000
 *
 * @param {String} timeZone - the time zone string
 * @param {Date} sampleDate - a date to use in the conversions, since it can be time-of-year dependent with Daylight Savings Time
 * @return {number|null}
 */
function timezoneToOffsetMS(timeZone, sampleDate) {
    try { // formats are finicky, so give up rather than abort rendering
        let datetimeFormatter = DATE_TIME_FORMATTERS[timeZone];
        if (!datetimeFormatter) {
            let properTimeZone = timeZone;
            if (!timeZone || timeZone === 'local') {
                properTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            }

            datetimeFormatter = new Intl.DateTimeFormat('en-US', {
                timeZone: properTimeZone,
                timeZoneName: 'longOffset'
            });
            DATE_TIME_FORMATTERS[timeZone] = datetimeFormatter;
        }

        const parts = datetimeFormatter.formatToParts(sampleDate);
        const offsetPart = parts.find(part => part.type === 'timeZoneName');

        if (!offsetPart) {
            return null;
        }

        if (offsetPart.value === 'GMT') {
            return 0;
        }

        if (!/^GMT[+-]\d{2}:\d{2}$/.test(offsetPart.value)) {
            return null;
        }

        const [hours, minutes] = offsetPart.value.slice(3).split(':');

        return parseInt(hours)*60*60*1000 + parseInt(minutes)*60*1000;
    } catch (e) {
        console.error(new Error(`Could not parse timezone offset for ${sampleDate} in ${timeZone}`)); // eslint-disable-line no-console
        console.error(e); // eslint-disable-line no-console
        return null;
    }
}

/**
 * Gets the Date object that represents the start of day in a given timezone
 * Note that this is still a native date object, so it will be in the local timezone
 * Its timestamp, however, will correspond to the start of the day in the given timezone
 *
 * @param date
 * @param timezone
 * @return {Date}
 */
export function startOfDayInTimezone(date, timezone) {
    if (!timezone) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        return startOfDay;
    }

    const offset = timezoneToOffsetMS(timezone, date); // ms between timezone and utc
    let startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const difference = startOfDay.valueOf() - date.valueOf();

    // if we would have gone forward a day when offset is taken into account, we need to go back a day again
    if (difference > offset) {
        startOfDay = new Date(startOfDay.valueOf() - 24*60*60*1000);
    }

    return new Date(startOfDay.valueOf() - offset);
}

function formatTime(time, {precision, justTime, justDate, justMonthAndDay, unitOverride, clockStyle='24h', timeZone}) {
    const utc = timeZone && timeZone.toLowerCase() === 'utc';
    if (timeZone && !utc && timeZone !== 'local' && window.Intl && window.Intl.DateTimeFormat) {
        const offset = timezoneToOffsetMS(timeZone, time);
        const localOffset = timezoneToOffsetMS('local', time);

        if (typeof offset === 'number' && typeof localOffset === 'number') {
            time = new Date(time.valueOf() + offset - localOffset);
        }
    }

    const year = utc ? time.getUTCFullYear() : time.getFullYear();
    const month = (utc ? time.getUTCMonth() : time.getMonth()) + 1;
    const day = utc ? time.getUTCDate() :  time.getDate();

    if (unitOverride === 'year') {
        return year.toString();
    }

    if (justDate) {
        return utc ? `${month}/${day}/${year}` : time.toLocaleDateString();
    }

    if (justMonthAndDay) {
        // eg Jan 19
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[month - 1]} ${day}`;
    }

    const hours = utc ? time.getUTCHours() : time.getHours();
    const minutes = utc ? time.getUTCMinutes() : time.getMinutes();
    const seconds = utc ? time.getUTCSeconds() : time.getSeconds();
    const milliseconds = utc ? time.getUTCMilliseconds() : time.getMilliseconds();

    let timeString;

    if (clockStyle === '12h') {
        timeString = `${((hours + 11) % 12 + 1).toString()}:${minutes.toString().padStart(2, '0')}`;
    } else {
        timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    if (precision === 's' || precision === 'ms') {
        timeString += `:${seconds.toString().padStart(2, '0')}`;
    }

    if (precision === 'ms') {
        timeString += `.${milliseconds.toString().padStart(3, '0')}`;
    }

    if (clockStyle === '12h') {
        timeString += hours >= 12 ? 'pm' : 'am';
    }

    if (justTime) {
        return timeString;
    }

    if (utc) {
        timeString += ' UTC';
    }

    return (utc ? `${month}/${day}/${year}` : time.toLocaleDateString()) + ' ' + timeString;
}

export function formatX(x, {dates=false, precision=null, justTime=false, justDate=false, justMonthAndDay=false, clockStyle='24h', unitOverride, timeZone, integersOnly=false, inverseEnumMap}={}) {
    if (dates && !(x instanceof Date)) {
        x = new Date(x);

        if (isNaN(x)) {
            return 'Invalid Date';
        }
    }

    if (x instanceof Date) {
        return formatTime(x, {precision, justTime, justDate, justMonthAndDay, unitOverride, clockStyle, timeZone});
    }

    if (isNaN(x)) {
        return 'NaN';
    }

    if (inverseEnumMap) {
        if (Math.abs(x - Math.round(x)) > 1e-10) {
            return '';
        }

        return inverseEnumMap[Math.round(x)];
    }

    if (integersOnly && Math.abs(x - Math.round(x)) > 1e-10) {
        return '';
    }

    return roundToPrecision(x, precision);
}

export function formatY(y, {precision=null, log=false}={}) {
    if (y === null) {
        return 'null';
    }

    if (isNaN(y)) {
        return 'NaN';
    }

    if (log) {
        return `10^${roundToPrecision(Math.log10(y), precision)}`;
    }

    return roundToPrecision(y, precision);
}
