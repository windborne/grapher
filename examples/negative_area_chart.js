import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [0, 1, 4, 10, 3, -7, -4, 3, 2],
        rendering: 'area'
    }
];

renderPage(
    <ExamplePage page="negative_area_chart">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
