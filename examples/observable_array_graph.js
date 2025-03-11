/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: Kefir.stream((emitter) => {
            emitter.emit([1, 2, 3, 4, 5]);
            setTimeout(() => {
                emitter.emit([4, 5, 3, 5]);
            });
        })
    }
];

renderPage(
    <ExamplePage page="observable_array_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
