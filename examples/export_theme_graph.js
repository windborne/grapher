import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

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
        yKey: 'sensors.barometer.altitude'
    },
    {
        data,
        xKey: 'timestamp',
        yKey: 'voltage.min',
        axis: 'right'
    },
    {
        data,
        xKey: 'timestamp',
        yKey: 'voltage.average',
        axis: 'right'
    }
];

renderPage(
    <ExamplePage page="export_theme_graph">
        <Grapher
            series={series}
            theme="export"
            sidebarEnabled={true}
            bigLabels={true}
            defaultLineWidth={4}
        />
    </ExamplePage>
);
