import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

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
