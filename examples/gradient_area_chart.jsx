import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: [0, 1, 4, 10, 3, -7, -4, 3, 2],
        rendering: 'area',
        gradient: [
            [0, '#ffff00'],
            [0.5, '#006078'], 
            [0.6, '#006d79'],
            [0.9, '#007a75'],
            [1, '#ffff00']
        ],
        color: 'white',
        negativeColor: 'red',
        negativeGradient: [
            [0, 'white'],
            [0.5, 'white'],
            [0.6, 'yellow'],
            [0.9, 'green'],
            [1, 'red']
        ],
        zeroLineWidth: 5,
        zeroLineColor: '#111',
        showIndividualPoints: true
    }
];

renderPage(
    <ExamplePage page="gradient_area_chart">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
