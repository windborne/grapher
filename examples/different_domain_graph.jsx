import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [0, 1],
            [5, 10],
            [6, 1]
        ]
    },
    {
        data: [
            [5, 1],
            [7, 10],
            [8, 4]
        ],
        axis: 'right',
        expandYWith: [-10]
    }
];

renderPage(
    <ExamplePage page="different_domain_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
