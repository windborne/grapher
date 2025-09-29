import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3],
        rendering: 'shadow', 
        color: 'rgba(0, 160, 128, 1)',
        // no gradient specified - should use default (half opacity of color)
        width: 2,
        showIndividualPoints: true,
    }
];

renderPage(
    <ExamplePage page="default_gradient_shadow_chart">
        <Grapher
            series={series}
            showGrid={true}
            webgl={true}
        />
    </ExamplePage>
);
