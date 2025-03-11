import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [0, 1, 4, 10, 0]
    }
];

renderPage(
    <ExamplePage page="tooltip_options_graph">
        <Grapher
            series={series}
            tooltipOptions={{
                includeSeriesLabel: false,
                includeXLabel: false,
                includeYLabel: true,
                includeXValue: true,
                includeYValue: true
            }}
        />
    </ExamplePage>
);
