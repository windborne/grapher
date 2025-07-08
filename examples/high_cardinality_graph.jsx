import React from 'react';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    { data: [] }
];

const cardinality = 10**6;

for (let i = 0; i < cardinality; i++) {
    series[0].data.push([
        new Date(Date.now() + i*1000),
        Math.cos(i/(cardinality/100))
    ]);
}

renderPage(
    <ExamplePage page="high_cardinality_graph">
        <Grapher
            series={series}
            onRenderTime={(time, timing) => console.log(`Rendered 10^${Math.log10(cardinality)} points in ${time.toFixed(2)}ms`, timing)}
        />
        <div style={{textAlign: 'center'}}>
            <i>Open javascript console to see timing log</i>
        </div>
    </ExamplePage>
);
