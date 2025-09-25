import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), 8],
            [new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), 12],
            [new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 6],
            [new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 9],
            [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 14],
            [new Date(Date.now()), 16],
            [new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 18],
            [new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), 20]
        ],
        rendering: 'shadow',
        cutoffTime: new Date('2025-09-18T01:00:00'), 
        color: 'rgb(138, 204, 158)',
        gradient: [
            [0, 'rgba(138, 204, 158, 0.3)'],
            [0.3, 'rgba(138, 204, 158, 0.1)'],
            [0.6, 'rgba(0, 0, 0, 0)']
        ],
        width: 5,
        showIndividualPoints: true,
    }
];

renderPage(
    <ExamplePage page="cutoff_shadow_graph">
        <Grapher
            series={series}
            webgl={true}
        />
    </ExamplePage>
);
