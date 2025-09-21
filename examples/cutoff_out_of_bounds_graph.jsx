import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page.js';
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
        name: 'left case: out of bounds',
        cutoffTime: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        color: 'rgb(204, 138, 190)',
        width: 2,
        showIndividualPoints: true,
    },
    {
        data: [
            [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), -5],
            [new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), -8],
            [new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), 4],
            [new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), -6],
            [new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), -9],
            [new Date(Date.now() - 5 * 60 * 60 * 1000), 10],
            [new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), -11],
            [new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), -13],
            [new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), -15],
            [new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), 17],
            [new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), -19],
            [new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), -4],
        ],
        name: 'in bounds',
        cutoffTime: new Date(Date.now() + 7.2 * 24 * 60 * 60 * 1000),
        color: 'rgb(205, 171, 103)',
        width: 2,
        showIndividualPoints: true,
    },
    {
        data: [
            [new Date(Date.now() - 10.5 * 24 * 60 * 60 * 1000), 2.5],
            [new Date(Date.now() - 8.5 * 24 * 60 * 60 * 1000), 4],
            [new Date(Date.now() - 6.5 * 24 * 60 * 60 * 1000), -2],
            [new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000), 3],
            [new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000), 4.5],
            [new Date(Date.now() - 5 * 60 * 60 * 1000), -5],
            [new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000), 5.5],
            [new Date(Date.now() + 4.5 * 24 * 60 * 60 * 1000), 6.5],
            [new Date(Date.now() + 6.5 * 24 * 60 * 60 * 1000), 7.5],
            [new Date(Date.now() + 8.5 * 24 * 60 * 60 * 1000), -8.5],
            [new Date(Date.now() + 10.5 * 24 * 60 * 60 * 1000), 9.5],
            [new Date(Date.now() + 12.5 * 24 * 60 * 60 * 1000), 2],
        ],
        name: 'right case: out of bounds',
        cutoffTime: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
        color: 'rgb(204, 138, 151)',
        width: 2,
        showIndividualPoints: true,
    },
];

renderPage(
    <ExamplePage page="cutoff_out_of_bounds_graph">
        <Grapher
            series={series}
            webgl={true}
        />
    </ExamplePage>
);
