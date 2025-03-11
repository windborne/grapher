import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const data = [];
for (let i = 0; i < 500; i++) {
    data.push([i, Math.random() * 100]);
}

const barSeries = [
    {
        data,
        rendering: 'bar'
    }
];

renderPage(
    <ExamplePage page="many_bar_chart">
        <Grapher
            series={barSeries}
        />
    </ExamplePage>
);
