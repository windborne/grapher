/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    {
        data: Kefir.stream((emitter) => {
            emitter.emit({
                timestamp: new Date(),
                values: [1, 2, 3, 4, 5].map((value, i) => [new Date(Date.now() + i*100), value])
            });
            setTimeout(() => {
                emitter.emit({
                    timestamp: new Date(),
                    values: [4, 5, 3, 5].map((value, i) => [new Date(Date.now() + i*100), value])
                });
            }, 1000);
        }),
        xKey: 'timestamp',
        yKey: 'values'
    }
];

renderPage(
    <ExamplePage page="observable_object_array_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
