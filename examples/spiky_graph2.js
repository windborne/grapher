import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const data = [];

for (let i = 0; i < 1000; i++) {
    data.push([i, [0, -1, 1][i % 3]]);
}

const series = [
    {
        data
    }
];

renderPage(
    <ExamplePage page="spiky_graph2">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
