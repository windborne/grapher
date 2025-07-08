import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const barSeries = [
    {
        data: [0, 1, 4, 10, 0].map((y, i) =>
            [
                new Date(2020, 7, i),
                y
            ]
        ),
        rendering: 'bar'
    }
];

renderPage(
    <ExamplePage page="dates_bar_chart">
        <Grapher
            series={barSeries}
        />
    </ExamplePage>
);
