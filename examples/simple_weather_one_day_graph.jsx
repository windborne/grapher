import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const ANCHOR_TIME = new Date('2026-06-16T16:00:00-07:00').getTime();
const HOUR_MS = 60 * 60 * 1000;
const SAMPLE_STEP_HOURS = 0.5;

function temperatureAt(hour) {
    const diurnal = Math.sin(((hour - 7) / 24) * Math.PI * 2) * 8;
    const synoptic = Math.sin(hour / 17) * 2.5;
    const mesoscale = Math.sin(hour / 3.4) * 1.4;

    return 64 + diurnal + synoptic + mesoscale;
}

function makeTemperatureSeries(hoursBefore, hoursAfter) {
    const data = [];

    for (let hour = -hoursBefore; hour <= hoursAfter; hour += SAMPLE_STEP_HOURS) {
        data.push([
            new Date(ANCHOR_TIME + hour * HOUR_MS),
            temperatureAt(hour)
        ]);
    }

    return [{
        data,
        name: 'Temperature',
        unitText: '\u00b0F',
        color: '#C4513E',
        shadowColor: 'rgba(196, 81, 62, 0.3)',
        width: 4
    }];
}

function boundsSelector(label, minHour, maxHour) {
    return {
        label,
        calculator: () => ({
            minX: new Date(ANCHOR_TIME + minHour * HOUR_MS),
            maxX: new Date(ANCHOR_TIME + maxHour * HOUR_MS)
        })
    };
}

renderPage(
    <ExamplePage page="simple_weather_one_day_graph">
        <Grapher
            series={makeTemperatureSeries(12, 36)}
            height={340}
            preset="simple"
            timeZone="America/Los_Angeles"
            currentTime={ANCHOR_TIME + 8 * HOUR_MS}
            customBoundsSelectors={[boundsSelector('24h', -2, 22)]}
            defaultBoundsCalculator="24h"
            yAxisTicks="temperature-f"
        />
    </ExamplePage>
);
