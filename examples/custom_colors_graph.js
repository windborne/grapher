import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        color: '#FFFFFF',
        data: [
            [0, 1],
            [5, 10],
            [6, 1]
        ]
    },
    {
        color: 'orange',
        data: [
            [0, 1],
            [1, 10],
            [6, 4]
        ]
    }
];

renderPage(
    <ExamplePage page="custom_colors_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
