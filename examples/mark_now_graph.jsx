import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    { data: [] }
];

for (let i = 0; i < 10000; i++) {
    series[0].data.push([
        new Date(Date.now() + (i - 5000)*1000),
        Math.cos(i/100)
    ]);
}

const verticalLines = [
    {
        x: new Date(),
        text: 'NOW',
        style: {
            'strokeDasharray': '4, 4'
        },
        color: '#A6A6A6',
        onRangeGraph: {
            text: 'Now',
            color: '#FFFFFF',
            style: {}
        }
    }
];

renderPage(
    <ExamplePage page="mark_now_graph">
        <Grapher
            series={series}
            verticalLines={verticalLines}
        />
    </ExamplePage>
);
