import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const barSeries = [
    {
        data: [0, 1, 4, 10, 3],
        rendering: 'bar'
    }
];

renderPage(
    <ExamplePage page="simple_bar_chart">
        <Grapher
            series={barSeries}
            xAxisIntegersOnly={true}
        />
    </ExamplePage>
);
