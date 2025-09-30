import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [0, 1, 4, 10, 0],
        showIndividualPoints: true,
        defaultAlwaysTooltipped: true
    },
    {
        data: [2, 4, 6],
        showIndividualPoints: true,
        defaultAlwaysTooltipped: true
    }
];

renderPage(
    <ExamplePage page="values_graph">
        <Grapher
            series={series}
            theme="day"
        />
    </ExamplePage>
);
