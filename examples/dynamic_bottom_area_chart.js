import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';


const mainData = [
    [0, -1], [0, 2],
    [1, 1], [1, 7],
    [2, -3], [2, 2],
    [3, 3], [3, 9],
    [4, 4], [4, 11],
    [5, 2], [5, 8]
];

const series = [
    {
        data: mainData,
        rendering: 'area',
        hasAreaBottom: true
    },
    {
        data: mainData.map(([x, y], i) =>
            [x, i % 2 === 0 ? y + 1 : y - 1]
        ),
        rendering: 'area',
        hasAreaBottom: true
    }
];

renderPage(
    <ExamplePage page="dynamic_bottom_area_chart">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
