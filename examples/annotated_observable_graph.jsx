/* eslint-disable no-console */

import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher.jsx';
import renderPage from './render_page';
import ExamplePage from './example_page.jsx';

const series = [
    {
        data: Kefir.stream((emitter) => {
            let i = 0;
            emitter.emit([[i++, Math.random()]]);
            emitter.emit([[i++, Math.random()]]);

            window.pointInterval = setInterval(() => {
                emitter.emit([[i++, Math.random()]]);
            }, 1000);
        })
    }
];

renderPage(
    <ExamplePage page="annotated_observable_graph">
        <Grapher
            series={series}
            annotations={[
                {
                    x: 1,
                    content: 'Annotation on 1'
                },
                {
                    x: 5,
                    content: 'Annotation on 5'
                }
            ]}
            showRangeGraph={false}
        />
    </ExamplePage>
);
