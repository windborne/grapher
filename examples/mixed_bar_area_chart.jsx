import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const now = Date.now();
const HOUR = 60 * 60 * 1000;

function hourlyObjects(days, valueFn) {
    const data = [];
    for (let h = 0; h < days * 24; h++) {
        data.push({ x: new Date(now + h * HOUR), y: valueFn(h) });
    }
    return data;
}

function areaObjects(days, bottomFn, topFn) {
    const data = [];
    for (let h = 0; h < days * 24; h++) {
        const time = new Date(now + h * HOUR);
        data.push({ x: time, y: bottomFn(h) });
        data.push({ x: time, y: topFn(h) });
    }
    return data;
}

const ensP0_P100 = areaObjects(
    10,
    (h) => Math.max(0, 0.2 + Math.sin(h / 6) * 0.5 - Math.random() * 0.3),
    (h) => 4 + Math.sin(h / 6) * 2 + Math.random() * 0.8
);

const ensP25_P75 = areaObjects(
    10,
    (h) => Math.max(0, 1.0 + Math.sin(h / 6) * 0.8),
    (h) => 3.0 + Math.sin(h / 6) * 1.2
);

const wmPrecip = hourlyObjects(10, (h) => Math.max(0, 2 + Math.sin(h / 6) * 1.5 + Math.random() * 0.5));
const gfsPrecip = hourlyObjects(10, (h) => Math.max(0, 1.5 + Math.cos(h / 8) * 1.2 + Math.random() * 0.4));
const metarObs = hourlyObjects(5, (h) => Math.max(0, 1.8 + Math.sin(h / 5) * 1.0 + Math.random() * 0.6));

const precipSeries = [
    {
        name: 'Ensemble P0–P100',
        data: ensP0_P100,
        rendering: 'area',
        hasAreaBottom: true,
        type: 'objects',
        xKey: 'x',
        yKey: 'y',
        xUnixDates: true,
        color: 'rgba(76, 120, 220, 0.15)',
        hideFromKey: true,
        defaultAlwaysTooltipped: false,
        showIndividualPoints: true,
        pointRadius: 3,
        cutoffTime: 'now',
        width: 0,
    },
    {
        name: 'Ensemble P25–P75',
        data: ensP25_P75,
        rendering: 'area',
        hasAreaBottom: true,
        type: 'objects',
        xKey: 'x',
        yKey: 'y',
        xUnixDates: true,
        color: 'rgba(76, 120, 220, 0.25)',
        hideFromKey: true,
        defaultAlwaysTooltipped: false,
        showIndividualPoints: true,
        pointRadius: 3,
        cutoffTime: 'now',
        width: 0,
    },
    {
        name: 'WM Precip',
        data: wmPrecip,
        rendering: 'bar',
        type: 'objects',
        xKey: 'x',
        yKey: 'y',
        xUnixDates: true,
        color: '#4c78dc',
        width: 1,
        pointRadius: 5,
        defaultAlwaysTooltipped: true,
        followingMouseTooltip: true,
        showIndividualPoints: true,
        cutoffTime: 'now',
    },
    {
        name: 'GFS Precip',
        data: gfsPrecip,
        rendering: 'bar',
        type: 'objects',
        xKey: 'x',
        yKey: 'y',
        xUnixDates: true,
        color: '#a67e22',
        width: 1,
        pointRadius: 5,
        defaultAlwaysTooltipped: true,
        followingMouseTooltip: true,
        showIndividualPoints: true,
        cutoffTime: 'now',
        cutoffOpacity: 0.4,
    },
    {
        name: 'METAR Obs',
        data: metarObs,
        rendering: 'bar',
        type: 'objects',
        xKey: 'x',
        yKey: 'y',
        xUnixDates: true,
        color: '#27ae60',
        width: 1,
        pointRadius: 5,
        defaultAlwaysTooltipped: true,
        followingMouseTooltip: true,
        showIndividualPoints: true,
        cutoffTime: 'now',
        cutoffOpacity: 0.4,
    },
];

renderPage(
    <ExamplePage page="mixed_bar_area_chart">
        <Grapher
            series={precipSeries}
            webgl={false}
        />
    </ExamplePage>
);
