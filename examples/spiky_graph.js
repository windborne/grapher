import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const data = [];

for (let i = 0; i < 10000; i++) {
    data.push([i, 0]);
}

data[238][1] = -1;
data[3893][1] = 1000;
data[3894][1] = -0.5;

const series = [
    {
        data
    }
];

renderPage(
    <ExamplePage page="spiky_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
