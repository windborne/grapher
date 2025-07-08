import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [{
    data: [
        {
            x: 0,
            y: 'beans'
        },
        {
            x: 1,
            y: 'beans'
        },
        {
            x: 2,
            y: 'potatos'
        },
        {
            x: 3,
            y: 'beans'
        }
    ],
    xKey: 'x',
    yKey: 'y'
}];

renderPage(
    <ExamplePage page="enum_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
