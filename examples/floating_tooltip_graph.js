import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [0, 1, 4, 10, 0].map((point, i) => {
            return [new Date(Date.now() + i*60*1000), point];
        }),
        defaultAlwaysTooltipped: true
    }
];

renderPage(
    <ExamplePage page="floating_tooltip_graph">
        <br />
        <br />
        <br />
        <br />

        <Grapher
            series={series}
            width={150}
            bodyHeight={150}
            showSeriesKey={false}
            showRangeSelectors={false}
            showRangeGraph={false}
            showAxes={false}
            showGrid={false}
            tooltipOptions={{
                floating: true,
                alwaysFixedPosition: true
            }}
        />
    </ExamplePage>
);
