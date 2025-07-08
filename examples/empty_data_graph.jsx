import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

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
