import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';
import seriesData from './series.json';

const customBoundsSelectors = [
    {
        label: '3d',
        calculator: () => ({
            minX: new Date('2026-03-28T00:00:00Z'),
            maxX: new Date('2026-03-31T00:00:00Z'),
        }),
    },
];

renderPage(
    <ExamplePage page="mixed_bar_area_chart">
        <Grapher
            series={seriesData}
            webgl={false}
            customBoundsSelectors={customBoundsSelectors}
            defaultBoundsCalculator="3d"
        />
    </ExamplePage>
);
