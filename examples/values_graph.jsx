import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [2, -3, -1, -2, 1, 0, -3, -4, 0, 1, 0],
        showIndividualPoints: true,
        defaultAlwaysTooltipped: true
    },
];

renderPage(
    <ExamplePage page="values_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
