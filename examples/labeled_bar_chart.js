import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const barSeries = [
    {
        data: [
            ['Ducks', 7],
            ['Geese', 3],
            ['Chickens', 5],
            ['Turkeys', 2]
        ],
        rendering: 'bar'
    }
];

renderPage(
    <ExamplePage page="labeled_bar_chart">
        <Grapher
            series={barSeries}
        />
    </ExamplePage>
);
