import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [];

for (let i = 0; i < 10; i++) {
    const data = [];
    const slope = Math.floor(Math.random() * 10);

    for (let j = 0; j < 10; j++) {
        data.push(Math.min(j, 5)*slope - Math.max(j - 5, 0)*slope);
    }

    series.push({
        data
    });
}

renderPage(
    <ExamplePage page="lots_of_lines_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
