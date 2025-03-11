import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [
            [0, 1],
            [2, 10],
            [3, 1]
        ]
    },
    {
        data: [
            [7, 1],
            [8, 10],
            [9, 4]
        ]
    }
];

renderPage(
    <ExamplePage page="non_overlapping_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
