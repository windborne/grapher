import React from 'react';
import MultiGrapher from '../src/multigrapher.js';
import renderPage from './render_page';
import ExamplePage from './example_page';
import Kefir from 'kefir';

const period = 1000;

const series = [
    {
        data: Kefir.stream((emitter) => {
            for (let i = 500; i >= 0; i--) {
                emitter.emit([[new Date(Date.now() - 150*i), Math.cos((Date.now() - 150*i) / period)]]);
            }

            setInterval(() => {
                emitter.emit([[new Date(Date.now()), Math.cos(Date.now()/period)]]);
            }, 50);
        }),
        width: 3
    },
    {
        data: Kefir.stream((emitter) => {
            for (let i = 500; i >= 0; i--) {
                emitter.emit([[new Date(Date.now() - 150*i), Math.cos((Date.now() - 150*i) / period)**5]]);
            }

            setInterval(() => {
                emitter.emit([[new Date(Date.now()), Math.cos(Date.now()/period)**5]]);
            }, 50);
        }),
        width: 3
    }
];

renderPage(
    <ExamplePage page="observable_multigrapher">
        <MultiGrapher
            series={series}
            bodyHeight={200}
        />
    </ExamplePage>
);
