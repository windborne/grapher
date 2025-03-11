import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

let emitted = false;

const series = [
    {
        data: () => {
            if (emitted) {
                return;
            }

            emitted = true;

            return Kefir.sequentially(500, [[[12, 1]], [[14, -128]], [[18, 46]]]);
        }
    }
];

renderPage(
    <ExamplePage page="generator_function_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
