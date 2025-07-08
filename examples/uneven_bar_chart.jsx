import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [0, 1],
            [1, 4],
            [1.5, 5],
            [2, 10],
            [3, 0]
        ],
        rendering: 'bar'
    },
    {
        data: [
            [1, 5],
            [2, 3],
            [3, 1],
            [4, 3],
            [5, 9],
            [6, 1],
            [7, 4],
            [8, 2],
            [9, 0],
            [10, 6]
        ],
        rendering: 'bar'
    }
];

renderPage(
    <ExamplePage page="uneven_bar_chart">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
