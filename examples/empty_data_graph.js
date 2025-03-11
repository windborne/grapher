import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [{
    data: []
}];

renderPage(
    <ExamplePage page="empty_data_graph">
        <Grapher
            series={series}
            requireWASM={true}
        />
    </ExamplePage>
);
