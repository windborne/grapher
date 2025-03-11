import React from 'react';
import Grapher from '../src/grapher';
import renderPage from './render_page';
import ExamplePage from './example_page';
import {formatX} from '../src/helpers/format';

const series = [
    { data: [] },
    { data: [] }
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

const firstDate = series[0].data[0][0];
const lastDate = series[0].data[series[0].data.length - 1][0];

const testZones = [
    'America/Los_Angeles',
    'America/New_York',
    'Asia/Shanghai',
    'Pacific/Chatham',
    'America/Phoenix',
    'Asia/Kathmandu',
    'Pacific/Kiritimati',
    'Pacific/Niue',
    'Antarctica/Casey',
    'Europe/London',
    'Asia/Tehran',
    'America/Argentina/Buenos_Aires'
];

const sampleDates = [
    new Date('2024-02-01T10:00:00Z'),
    new Date('2024-07-01T10:00:00Z')
];

const expected = {
    'America/Los_Angeles': {
        feb: '2/1/2024 02:00',
        jul: '7/1/2024 03:00'
    },
    'America/New_York': {
        feb: '2/1/2024 05:00',
        jul: '7/1/2024 06:00'
    },
    'Asia/Shanghai': {
        feb: '2/1/2024 18:00',
        jul: '7/1/2024 18:00'
    },
    'Pacific/Chatham': {
        feb: '2/1/2024 23:45',
        jul: '7/1/2024 22:45'
    },
    'America/Phoenix': {
        feb: '2/1/2024 03:00',
        jul: '7/1/2024 03:00'
    },
    'Asia/Kathmandu': {
        feb: '2/1/2024 15:45',
        jul: '7/1/2024 15:45'
    },
    'Pacific/Kiritimati': {
        feb: '2/2/2024 00:00',
        jul: '7/2/2024 00:00'
    },
    'Pacific/Niue': {
        feb: '1/31/2024 23:00',
        jul: '6/30/2024 23:00'
    },
    'Antarctica/Casey': {
        feb: '2/1/2024 18:00',
        jul: '7/1/2024 18:00'
    },
    'Europe/London': {
        feb: '2/1/2024 10:00',
        jul: '7/1/2024 11:00'
    },
    'Asia/Tehran': {
        feb: '2/1/2024 13:30',
        jul: '7/1/2024 13:30'
    },
    'America/Argentina/Buenos_Aires': {
        feb: '2/1/2024 07:00',
        jul: '7/1/2024 07:00'
    }
};

renderPage(
    <ExamplePage page="dates_timezone_graph">
        <Grapher
            series={series}
            defaultBoundsCalculator="lastHour"
            clockStyle="12h"
            timeZone="America/New_York"
        />

        <table className="table">
            <thead>
            <tr>
                <th>Timezone</th>
                <th>First Date</th>
                <th>Last Date</th>
            </tr>
            </thead>

            <tbody>
            <tr>
                <td>Local</td>
                <td>{firstDate.toLocaleString()}</td>
                <td>{lastDate.toLocaleString()}</td>
            </tr>
            <tr>
                <td>UTC</td>
                <td>{firstDate.toISOString()}</td>
                <td>{lastDate.toISOString()}</td>
            </tr>
            </tbody>
        </table>

        <br />
        <br />

        <table className="table">
            <thead>
            <tr>
                <th>Timezone</th>
                <th>2024-02-01 10Z</th>
                <th>Expected Feb</th>
                <th>Feb matches</th>
                <th>2024-07-01 10Z</th>
                <th>Expected Jul</th>
                <th>Jul matches</th>
            </tr>
            </thead>

            <tbody>
            {
                testZones.map(zone => (
                    <tr key={zone}>
                        <td>{zone}</td>
                        <td>{formatX(sampleDates[0], {dates: true, timeZone: zone})}</td>
                        <td>{expected[zone].feb}</td>
                        <td>{formatX(sampleDates[0], {dates: true, timeZone: zone}) === expected[zone].feb ? '✅' : '❌'}</td>
                        <td>{formatX(sampleDates[1], {dates: true, timeZone: zone})}</td>
                        <td>{expected[zone].jul}</td>
                        <td>{formatX(sampleDates[1], {dates: true, timeZone: zone}) === expected[zone].jul ? '✅' : '❌'}</td>
                    </tr>
                ))
            }
            </tbody>
        </table>
    </ExamplePage>
);
