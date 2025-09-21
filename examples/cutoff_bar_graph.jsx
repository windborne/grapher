import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 12],
            [new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 19],
            [new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 8],
            [new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 15],
            [new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 7],
            [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 22],
            [new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), 25],
            [new Date(Date.now()), 28],
            [new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), 30]
        ],
        rendering: 'bar',
        cutoffTime: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000),
        color: '#9b59b6'
    }
];

renderPage(
    <ExamplePage page="cutoff_bar_graph">
        <Grapher
            series={series}
            webgl={false}
        />
    </ExamplePage>
);
