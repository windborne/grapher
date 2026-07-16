import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';

// Demonstrates pointShape: fixed per-series shapes, and a per-point shape
// function that styles points on ONE line by a field in the datum (the
// mixed-data-source case, e.g. satellite vs mesh-radio telemetry).

const START = new Date('2026-06-16T00:00:00Z').getTime();
const MINUTE_MS = 60 * 1000;

function makeMixedSourceSeries() {
    const data = [];

    for (let i = 0; i < 120; i++) {
        data.push({
            timestamp: new Date(START + i * 10 * MINUTE_MS),
            value: 12000 + Math.sin(i / 12) * 3000 + Math.sin(i / 47) * 1200,
            source: i % 3 === 0 ? 'satellite' : 'mesh'
        });
    }

    return {
        data,
        xKey: 'timestamp',
        yKey: 'value',
        name: 'Altitude (blue circle=satellite, orange square=mesh)',
        color: 'steelblue',
        showIndividualPoints: true,
        pointRadius: 5,
        minPointSpacing: 14,
        pointShape: (datum) => (datum && datum.source === 'satellite' ? 'circle' : 'square'),
        pointColor: (datum) => (datum && datum.source === 'satellite' ? null : '#e0a458')
    };
}

function makeFixedShapeSeries(shape, offset, color) {
    const data = [];

    for (let i = 0; i < 120; i++) {
        data.push([
            new Date(START + i * 10 * MINUTE_MS),
            offset + Math.cos(i / 15) * 1500
        ]);
    }

    return {
        data,
        name: shape,
        color,
        showIndividualPoints: true,
        pointRadius: 5,
        minPointSpacing: 18,
        pointShape: shape
    };
}

const series = [
    makeMixedSourceSeries(),
    makeFixedShapeSeries('triangle', 4000, 'coral'),
    makeFixedShapeSeries('diamond', 1000, 'mediumseagreen')
];

renderPage(
    <Grapher
        series={series}
        height={420}
    />
);
