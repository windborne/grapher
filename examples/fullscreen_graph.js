import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    { data: [] },
    { data: [] }
];

for (let i = 0; i < 10000; i++) {
    series[0].data.push([
        new Date(Date.now() + i*1000),
        Math.cos(i/100)
    ]);

    series[1].data.push([
        new Date(Date.now() + i*1000),
        -Math.cos(i/500)
    ]);
}

document.body.style.margin = '0';

renderPage(
    <ExamplePage page="fullscreen_graph">
        <Grapher
            series={series}
            fullscreen={true}
        />
    </ExamplePage>
);
