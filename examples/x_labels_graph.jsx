import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const data = [];

for (let i = 0; i < 25; i++) {
    data.push({
        x: i,
        y: i + Math.random(),
        xLabel: `${i + 1}X`,
        yLabel: `${i}Y`
    });
}

const series = [
    {
        data,
        xKey: 'x',
        yKey: 'y',
        xLabel: 'xLabel',
        yLabel: 'yLabel'
    }
];

renderPage(
    <ExamplePage page="x_labels_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
