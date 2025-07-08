import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [{
    data: [
        1,
        3,
        2,
        null,
        5,
        4,
        6
    ],
    background: {
        null: 'rgba(255,0,0,0.4)',
        '>= 4.9': 'rgba(5,53,231,0.4)',
        '<= 3': 'rgba(39,231,5,0.4)'
    }
}];

renderPage(
    <ExamplePage page="coloured_background_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
