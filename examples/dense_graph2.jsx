import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page.js';
import ExamplePage from './example_page.jsx';

const data = [[0, 0]];

//fourier series cuz it kinda looks like the balloon altitude charts
for (let i = 45000; i < 50000; i++) {
    let sum = 1;
    for (let n = 1; n <= 20; n += 2) {
        sum += Math.sin(n * i / 100) / n;
    }
    data.push([i, (4/Math.PI) * sum]);
}

const series = [
    {
        data
    }
];

renderPage(
    <ExamplePage page="dense_graph2">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
