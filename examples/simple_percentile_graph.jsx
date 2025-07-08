import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const data = [];
for (let i = 0; i < 1000; i++) {
    data.push([i, i/10]);
}

const series = [
    {
        data
    }
];

renderPage(
    <ExamplePage page="simple_percentile_graph">
        <Grapher
            series={series}
            percentile={90}
        />
    </ExamplePage>
);
