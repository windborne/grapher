import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [-1, -1]
    }
];

renderPage(
    <ExamplePage page="flat_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
