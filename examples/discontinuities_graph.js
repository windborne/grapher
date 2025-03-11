import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [0, 1, null, 10, 1]
    },
    {
        data: [5, null, 6, 4, 8],
        ignoreDiscontinuities: true
    },
    {
        data: [3, 3, null, 6, null]
    }
];

renderPage(
    <ExamplePage page="discontinuities_graph">
        <Grapher
            series={series}
            defaultShowIndividualPoints={true}
        />
    </ExamplePage>
);
