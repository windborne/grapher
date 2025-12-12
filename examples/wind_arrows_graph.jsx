import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const makeWindPoint = (timestamp, speed, dir) => ({
    timestamp: new Date(timestamp),
    wind_x: speed * Math.cos(dir),
    wind_y: speed * Math.sin(dir)
})

const series = [
    {
        data: Array.from({ length: 24 }).map((_, i) => makeWindPoint(Date.now() + i * 1000000, 20 + i * i, i * 0.2 * Math.PI)),
        windXKey: 'wind_x',
        windYKey: 'wind_y',
        xKey: 'timestamp',
        defaultAlwaysTooltipped: true
    }
];

renderPage(
    <ExamplePage page="wind_arrows_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
