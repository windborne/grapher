import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const barSeries = [
    {
        data: [0, 1, 4, -4, 3, -2, 6],
        rendering: 'bar',
        color: 'yellow',
        negativeColor: 'green',
        zeroLineWidth: 4,
        zeroLineColor: 'red'
    }
];

renderPage(
    <ExamplePage page="negative_bar_chart">
        <Grapher
            series={barSeries}
            xAxisIntegersOnly={true}
        />
    </ExamplePage>
);
