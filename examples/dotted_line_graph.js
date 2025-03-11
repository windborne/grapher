import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [
            [0, 1],
            [1, 10],
            [2, 5],
            [10, 5]
        ],
        color: 1
    },
    {
        data: [
            [10, 5],
            [20, 5]
        ],
        color: 1,
        dashed: true
    }
];

renderPage(
    <ExamplePage page="dotted_line_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
