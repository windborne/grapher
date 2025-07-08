import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [0, 1],
            [1, 0],
            [1.5, 2],
            [2, 10],
            [3, 0],
            [4, 0.5]
        ],
        rendering: 'bar',
        zeroLineY: 'bottom'
    }
];

renderPage(
    <ExamplePage page="zeros_bar_chart">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
