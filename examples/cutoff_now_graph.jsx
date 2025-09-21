import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), 10],
            [new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), 15],
            [new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 8],
            [new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 12],
            [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 18],
            [new Date(Date.now()), 20],
            [new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 22],
            [new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), 25]
        ],
        cutoffTime: 'now',
        color: '#3498db',
        width: 5,
        showIndividualPoints: true,
    }
];

renderPage(
    <ExamplePage page="cutoff_now_graph">
        <Grapher
            series={series}
            title="Line Chart with Cutoff at 'Now'"
        />
    </ExamplePage>
);
