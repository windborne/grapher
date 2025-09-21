import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page.js';
import ExamplePage from './example_page.jsx';

const baseTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
const dataPoints = [];

for (let i = 0; i < 15; i++) {
    const time = new Date(baseTime + i * 24 * 60 * 60 * 1000);
    const baseValue = Math.sin(i * 0.5) * 10 + 15;
    const variation = Math.random() * 6 - 3;
    
    dataPoints.push([time, baseValue + variation]);
    dataPoints.push([time, baseValue + variation + 8 + Math.random() * 4]);
}

const secondaryDataPoints = dataPoints.map(([time, value], index) => {
    const offset = index % 2 === 0 ? -2 : 3;
    return [time, value + offset + Math.sin(index * 0.3) * 2];
});

const series = [
    {
        data: dataPoints,
        rendering: 'area',
        hasAreaBottom: true,
        cutoffTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        color: 'rgba(34, 139, 34, 0.9)',
        gradient: [
            [0, 'rgba(34, 139, 34, 0.5)'],
            [0.5, 'rgba(34, 139, 34, 0.75)'],
            [1, 'rgba(34, 139, 34, 0.9)']
        ],
        width: 3,
        showIndividualPoints: true
    },
    {
        data: secondaryDataPoints,
        rendering: 'area',
        hasAreaBottom: true,
        cutoffTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        color: 'rgba(255, 69, 0, 0.8)',
        gradient: [
            [0, 'rgba(255, 69, 0, 0.1)'],
            [0.5, 'rgba(255, 69, 0, 0.4)'],
            [1, 'rgba(255, 69, 0, 0.7)']
        ],
        width: 3,
        showIndividualPoints: true
    }
];

renderPage(
    <ExamplePage page="cutoff_dynamic_bottom_area">
        <Grapher
            series={series}
            webgl={false}
        />
    </ExamplePage>
);
