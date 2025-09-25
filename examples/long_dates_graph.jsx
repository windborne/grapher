import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    { data: [] }
];

for (let i = 0; i < 10000; i++) {
    series[0].data.push([
        new Date(Date.now() + i*1000*60*60),
        Math.cos(i/100)
    ]);
}

renderPage(
    <ExamplePage page="long_dates_graph">
        <Grapher
            series={series}
            timeZone="UTC"
        />
    </ExamplePage>
);
