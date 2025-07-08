import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    { data: [] }
];

for (let i = 0; i < 7*24*60*60; i += 10*60) {
    series[0].data.push([
        new Date(Date.now() + i*1000),
        Math.cos(i/(3*60*60))
    ]);
}

renderPage(
    <ExamplePage page="marked_dates_graph">
        <Grapher
            series={series}
            clockStyle="12h"
            timeZone="America/New_York"
            markRangeGraphDates={true}
        />
    </ExamplePage>
);
