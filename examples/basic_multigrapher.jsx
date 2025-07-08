import React from 'react';
import MultiGrapher from '../src/multigrapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const a = [];
const b = [];

for (let i = 0; i < 1000; i++) {
    const x = i / 10;
    a.push([x, x**2]);
    b.push([25+x, (20*Math.cos(x))**3]);
}

const series = [
    {
        name: 'a',
        data: a,
        width: 4
    },
    {
        data: b,
        graph: 1,
        width: 4
    }
];

renderPage(
    <ExamplePage page="basic_multigrapher">
        <MultiGrapher
            series={series}
            bodyHeight={200}
        />
    </ExamplePage>
);
