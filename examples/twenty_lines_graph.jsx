import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [];

for (let y = 0; y < 20; y++) {
    series.push({
        name: `Line Name ${y + 1}`,
        data: [...Array(20).keys()].map((x) => [x, y])
    });
}

console.log(series);

renderPage(
    <ExamplePage page="twenty_lines_graph">
        <Grapher
            series={series}
            // theme={'day'}
        />
    </ExamplePage>
);
