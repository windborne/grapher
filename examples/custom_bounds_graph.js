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

const start = Date.now();

const customBoundsSelectors = [{
    label: 'beans',
    calculator: () => {
        return {
            minX: new Date(start + 1000*1000),
            maxX: new Date(start + 3000*1000)
        };
    }
}];

renderPage(
    <ExamplePage page="custom_bounds_graph">
        <Grapher
            series={series}
            customBoundsSelectors={customBoundsSelectors}
            defaultBoundsCalculator="beans"
        />
    </ExamplePage>
);
