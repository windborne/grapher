import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [-3, 1, -4, 1, -5, 9, -2, 6, -5, 3, -5, 8, 9, -7, -9, 3],
        rendering: 'shadow', 
        color: 'rgb(150, 106, 206)',
        gradient: ['rgba(150, 106, 206, 0.3)', 'rgba(150, 106, 206, 0.1)', 'rgba(0, 0, 0, 0)'],
        width: 2,
        showIndividualPoints: true,
        zeroLineWidth: 3,
        zeroLineColor: '#fff',
    },
];

renderPage(
    <ExamplePage page="negative_shadow_chart">
        <Grapher
            series={series}
            showGrid={true}
            webgl={true}
        />
    </ExamplePage>
);
