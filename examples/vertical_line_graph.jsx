import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [
            [0, 0],
            [1, 1],
            [2, 0],
            [3, 3],
            [4, 0],
            [5, 5],
            [6, 0]
        ]
    }
];

renderPage(
    <ExamplePage page="vertical_line_graph">
        <Grapher
            series={series}
            verticalLines={[
                {
                    x: 2.5,
                    markTop: true
                },
                {
                    x: 5,
                    color: 'red'
                }
            ]}
        />
    </ExamplePage>
);
