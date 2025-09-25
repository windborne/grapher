import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), 5],
            [new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), 8],
            [new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), -4],
            [new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), 6],
            [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), 9],
            [new Date(Date.now() - 5 * 60 * 60 * 1000), -10],
            [new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), 11],
            [new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), 13],
            [new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), 15],
            [new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), -17],
            [new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), 19],
            [new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), 4],
        ],
        rendering: 'area',
        cutoffTime: 'now',
        color: 'rgb(138, 148, 204)',
        gradient: ['transparent'],
        width: 5,
        showIndividualPoints: true,
    }
];

renderPage(
    <ExamplePage page="cutoff_area_graph">
        <Grapher
            series={series}
            webgl={false}
        />
    </ExamplePage>
);
