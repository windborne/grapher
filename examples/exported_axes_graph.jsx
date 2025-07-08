import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const data = [];

for (let i = 0; i < 1000; i++) {
    data.push({
        timestamp: new Date(Date.now() + i * 2*60*1000),
        'sensors.gps.altitude': Math.min(i * 240, 13000),
        'sensors.barometer.altitude': Math.min(i * 240, 13000) + 120,
        'voltage.min': Math.random() * 0.1,
        'voltage.average': Math.random() + 0.1
    });
}

const series = [
    {
        data,
        xKey: 'timestamp',
        yKey: 'sensors.gps.altitude'
    },
    {
        data,
        xKey: 'timestamp',
        yKey: 'sensors.barometer.altitude',
        axis: 'left-1'
    },
    {
        data,
        xKey: 'timestamp',
        yKey: 'voltage.min',
        axis: 'right-0'
    },
    {
        data,
        xKey: 'timestamp',
        yKey: 'voltage.average',
        axis: 'right-1'
    }
];

renderPage(
    <ExamplePage page="exported_axes_graph">
        <Grapher
            series={series}
            onAxisChange={console.log}
        />
    </ExamplePage>
);
