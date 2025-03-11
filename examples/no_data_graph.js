import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [];

renderPage(
    <ExamplePage page="no_data_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
