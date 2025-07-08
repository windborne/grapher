import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [{
    data: [
        {
            x: 0,
            y: false
        },
        {
            x: 1,
            y: true
        },
        {
            x: 2,
            y: false
        },
        {
            x: 3,
            y: false
        }
    ],
    xKey: 'x',
    yKey: 'y'
}];

renderPage(
    <ExamplePage page="bool_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
