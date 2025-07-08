import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const data = [];
const count = 199;
for (let i = 0; i < count; i++) {
    data.push([i, 0]);
}

data.push([count, -1]);

const series = [
    {
       data
    }
];

renderPage(
    <ExamplePage page="change_at_end_graph">
        <Grapher
            series={series}
            showSeriesKey={false}
            showRangeSelectors={false}
            showRangeGraph={false}
            defaultShowIndividualPoints={true}
            // requireWASM={true}
            width={data.length}
        />
    </ExamplePage>
);
