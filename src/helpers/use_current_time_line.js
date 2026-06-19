import {useEffect, useMemo, useState} from 'react';

const ONE_MINUTE_MS = 60 * 1000;

export default function useCurrentTimeLine({ markCurrentTime, currentTime }) {
    const overrideX = typeof markCurrentTime === 'object' ? markCurrentTime.x : undefined;
    const useLiveCurrentTime = !!markCurrentTime && typeof currentTime === 'undefined' && typeof overrideX === 'undefined';
    const [liveCurrentTime, setLiveCurrentTime] = useState(() => Date.now());

    useEffect(() => {
        if (!useLiveCurrentTime) {
            return undefined;
        }

        setLiveCurrentTime(Date.now());
        const interval = setInterval(() => {
            setLiveCurrentTime(Date.now());
        }, ONE_MINUTE_MS);

        return () => {
            clearInterval(interval);
        };
    }, [useLiveCurrentTime]);

    return useMemo(() => {
        if (!markCurrentTime) {
            return null;
        }

        const color = 'rgba(22, 22, 30, 0.32)';
        const overrides = typeof markCurrentTime === 'object' ? markCurrentTime : {};
        const currentTimeValue = typeof currentTime === 'undefined' ? liveCurrentTime : currentTime;
        const baseLine = {
            x: currentTimeValue instanceof Date ? currentTimeValue.getTime() : currentTimeValue,
            datesOnly: true,
            color,
            width: 1,
            text: 'NOW',
            lineTop: 0,
            textPosition: 'bottom',
            textGapPadding: 4,
            lineGapAroundText: true,
            style: {
                strokeDasharray: '4, 5'
            },
            textStyle: {
                fill: color,
                fontSize: '11px',
                fontWeight: 650,
                textAnchor: 'middle'
            }
        };

        return {
            ...baseLine,
            ...overrides,
            style: {
                ...baseLine.style,
                ...(overrides.style || {})
            },
            textStyle: {
                ...baseLine.textStyle,
                ...(overrides.textStyle || {})
            }
        };
    }, [currentTime, liveCurrentTime, markCurrentTime]);
}
