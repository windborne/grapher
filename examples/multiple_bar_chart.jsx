import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const barSeries = [
    {
        data: [0, 1, 4, 10, 0],
        rendering: 'bar'
    },
    {
        data: [3, 1, 3, 9, 1],
        rendering: 'bar'
    }
];

renderPage(
    <ExamplePage page="multiple_bar_chart">
        <Grapher
            series={barSeries}
        />
    </ExamplePage>
);
