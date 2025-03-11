import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [0, 1, 4, 10, 3, -7, -4, 3, 2],
        rendering: 'area',
        gradient: [
            '#0c516e',
            '#006078',
            '#006d79',
            '#007a75',
            '#00896c',
            '#00965a',
            '#35a143',
            '#6aa927',
            '#9aae00',
            '#ccaf00',
            '#ffaa00'
        ],
        zeroLineWidth: 5,
        zeroLineColor: '#111'
    }
];

renderPage(
    <ExamplePage page="gradient_area_chart">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
