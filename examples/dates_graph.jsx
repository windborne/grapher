import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

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

renderPage(
    <ExamplePage page="dates_graph">
        <Grapher
            series={series}
            defaultBoundsCalculator="lastHour"
            clockStyle="12h"
            timeZone="utc"
        />
    </ExamplePage>
);
