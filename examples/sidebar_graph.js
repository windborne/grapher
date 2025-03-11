import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [];

for (let i = 0; i < 10; i++) {
    const data = [];
    const slope = 10 - i;

    for (let j = 0; j < 10; j++) {
        data.push(Math.min(j, 5)*slope - Math.max(j - 5, 0)*slope);
    }

    series.push({
        data,
        name: `Series ${i}`
    });
}

renderPage(
    <ExamplePage page="sidebar_graph">
        <Grapher
            series={series}
            defaultShowSidebar={true}
            sidebarEnabled={true}
        />
    </ExamplePage>
);
