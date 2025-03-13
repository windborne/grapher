import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';

const series = [
    { data: [], name: 'Series 1' },
    { data: [], name: 'Series 2' }
];

for (let i = 0; i < 10000; i++) {
    series[0].data.push([
        new Date(Date.now() + i*1000),
        Math.cos(i/100)
    ]);

    series[1].data.push([
        new Date(Date.now() + i*1000),
        -Math.cos(i/500)
    ]);
}

function CustomTooltip({x, y, label}) {
    const style = {
        backgroundColor: 'white',
        border: '1px solid black',
        padding: '5px',
        borderRadius: '5px',
        marginLeft: '5px',
        transform: 'translateY(-50%)',
        width: 'max-content'
    }

    return (
        <div style={style}>
            <b>{label}</b> <br/>
            x: {x.toLocaleString()}<br/>
            y: {y.toFixed(2)}<br/>
        </div>
    )
}


const tooltipOptions = {
    customTooltip: CustomTooltip
};

renderPage(
    <ExamplePage page="custom_tooltips_graph">
        <Grapher
            series={series}
            defaultBoundsCalculator="lastHour"
            clockStyle="12h"
            timeZone="utc"
            tooltipOptions={tooltipOptions}
        />
    </ExamplePage>
);
