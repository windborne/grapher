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
        ],
        rangeSelectorWidth: 4
    },
    {
        data: [
            [0, 1],
            [1, 10],
            [6, 4]
        ],
        width: 20
    }
];

renderPage(
    <ExamplePage page="fat_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
