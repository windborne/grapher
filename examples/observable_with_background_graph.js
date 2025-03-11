import React from 'react';
import Kefir from 'kefir';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [{
    data: Kefir.stream(async (emitter) => {
        let i = 0;
        const initialData = [15, 25, 32.1, 170, 60.3];

        while (true) { // eslint-disable-line no-constant-condition
            let y = Math.random() * 200;
            if (i < initialData.length) {
                y = initialData[i];
            } else if (Math.random() < 0.1) {
                y = null;
            }

            emitter.emit({ x: new Date(), y });
            i++;
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }),
    xKey: 'x',
    yKey: 'y',
    background: {
        null: 'rgba(255,0,0,0.4)',
        '>= 100': 'rgba(255,115,11,0.4)'
    }
}];

renderPage(
    <ExamplePage page="observable_with_background_graph">
        <Grapher
            series={series}
        />
    </ExamplePage>
);
