import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [[0, 97], [1, 97], [2, 97], [3, 97], [4, 96], [5, 97], [6, 97], [7, 97], [8, 97], [9, 97], [10, 97], [11, 96], [12, 96], [13, 97], [14, 97], [15, 97], [16, 97], [17, 97], [18, 97], [19, 96]]
    }
];

renderPage(
    <ExamplePage page="tuples_graph">
        <Grapher
            series={series}
            webgl={true}
        />
    </ExamplePage>
);
