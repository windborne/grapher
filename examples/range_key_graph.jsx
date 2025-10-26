import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

function randomBetween(a, b) {
    return a + Math.random() * (b - a);
}

const dataWithRanges = [];
const amplitude = 15;
const offset = 20;
const period = 32;

for (let day = 1; day <= 100; day++) {
    const phase = (2 * Math.PI * day) / period;
    let avg = Math.sin(phase) * amplitude + offset + randomBetween(-3, 3) - day / 2;
    let delta = 3 + randomBetween(-0.5, 1.5);

    let min = avg - delta;
    let max = avg + delta;

    dataWithRanges.push({
        x: day,
        y: avg ,
        range: { min, max },
    });
}

const series = [
    {
        data: dataWithRanges,
        type: 'objects',
        xKey: 'x',
        yKey: 'y',
        rangeKey: 'range',
        name: '',
        color: '#ffb6c1'
    },
];

renderPage(
    <ExamplePage title="Range Key Graph">
        <Grapher series={series} height={400} showAxes={true} showGrid={true} showSeriesKey={true} showRangeSelectors={true} autoscaleYAxis={true} />
    </ExamplePage>
);