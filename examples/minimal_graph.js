import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: [0, 1, 4, 10, 0]
    }
];

renderPage(
    <ExamplePage page="minimal_graph">
        <Grapher
            series={series}
            showAxes={false}
            showGrid={false}
            showRangeGraph={false}
            showRangeSelectors={false}
            showSeriesKey={false}
            showTooltips={false}
            boundsSelectionEnabled={false}
        />
    </ExamplePage>
);
