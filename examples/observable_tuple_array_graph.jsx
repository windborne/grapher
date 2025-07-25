/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: Kefir.stream((emitter) => {
            emitter.emit([1, 2, 3, 4, 5].map((value, i) => [new Date(Date.now() + i*100), value]));
            setTimeout(() => {
                emitter.emit([4, 5, 3, 5].map((value, i) => [new Date(Date.now() + i*100), value]));
            }, 1000);
        })
    }
];

renderPage(
    <ExamplePage page="observable_tuple_array_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
