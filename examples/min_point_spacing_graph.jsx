import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page.js';
import ExamplePage from './example_page.jsx';

const data = [];
for (let i = 0; i < 1000; i++) {
    data.push([i, Math.sin(i / 20) + Math.sin(i / 50) * 0.5 + Math.random() * 0.2]);
}

const series = [
    {
        data: data.map(([x, y]) => [x, -y]),
        showIndividualPoints: true,
        minPointSpacing: 100, 
        color: 'rgb(150, 150, 240)',
        name: 'Spaced Points',
        pointRadius: 10,
        rendering: 'shadow'
    },
    {
        data,
        showIndividualPoints: true,
        color: 'rgb(240, 150, 150)',
        name: 'No Spacing',
        pointRadius: 3,
        rendering: 'shadow',
    }
];

renderPage(
    <ExamplePage page="min_point_spacing_graph">
        <Grapher
            series={series}
            showSeriesKey={true}
            height={400}
            webgl={true}
        />
    </ExamplePage>
);
