import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [0, 1, 4, 10, 0].map((point, i) => {
            return [new Date(Date.now() + i*60*1000), point];
        })
    }
];

renderPage(
    <ExamplePage page="small_graph">
        <div style={{ width: 247 }}>
            <Grapher
                series={series}
                bodyHeight={150}
                showSeriesKey={true}
                showRangeSelectors={false}
                showRangeGraph={false}
            />
        </div>
    </ExamplePage>
);
