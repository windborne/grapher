import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const data = [];

for (let i = 0; i < 10000; i++) {
    data.push([i, Math.random()]);
}

const series = [
    {
        data
    }
];

renderPage(
    <ExamplePage page="dense_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
