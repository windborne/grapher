import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

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
            [0, 1],
            [1, 10],
            [6, 4]
        ]
    }
];

renderPage(
    <ExamplePage page="multiline_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
