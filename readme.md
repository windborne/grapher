
# WindBorne Grapher

[![npm version](https://img.shields.io/npm/v/@windborne/grapher.svg)](https://www.npmjs.com/package/@windborne/grapher)
[![npm downloads](https://img.shields.io/npm/dm/@windborne/grapher.svg)](https://www.npmjs.com/package/@windborne/grapher)

Powerful, performant graphing.

**Grapher** is designed primarily for internal infrastructure with lots of data and lots of axes. 
Key features include:
 - *Performance*. Grapher can render a million points in 100ms and support new data coming in at hundreds of points per second without degraded performance.
 - *Async data sources*. Grapher supports observables directly as well as generator functions to generate data on the fly
 - *Axis management*. Series can be moved between axes and new axes created with ease.
 - *Long data ranges*.

You _shouldn't_ use this package if:
 - *You need to support older browsers*. While it may work in older browsers, no guarantees are made. 
   New features will be used as they become available without regard for maintaining legacy support. 
 - *You don't want to add a react dependency* (though the rendering engine may be used without react). 
 - *Asset size is a big concern*. Despite not having dependencies, this is a relatively heavy engine compared to alternatives.

## As a developer importing this package

### Installing

`npm install @windborne/grapher`.

It also requires React version 16.8 or greater as a peer dependency

### Importing
The simplest option is to import it from the root. 
```ecmascript 6
import Grapher from '@windborne/grapher';
```

This uses the webpacked version and allows you to not worry about any other dependencies.
However, since relative imports won't work, neither will the optional WASM extensions.
For most applications, WASM extensions won't be necessary, but if there are strong performance 
requirements, you should consider them.

#### Importing with WASM extensions
To use the Rust WASM extensions, you should import the component itself.
```ecmascript 6
import Grapher from '@windborne/grapher/src/grapher';
```

However, this will require that you have the dependencies needed to build the whole project. 
You can find a full list in the package.json devDependencies, but they can be summarized as follows:
 - React and babel (include @babel/polyfill, @babel/preset-react, etc). You likely already have this in your project
 - Sass support (eg node-sass, sass-loader)
 - Webgl loader (webpack-glsl-loader)

# Grapher Component

### Props

Like any other React component, Grapher is primarily configured via props. Refer to the [GrapherProps](#grapherprops) schema for complete type information.

### Series Data Formats

Grapher supports multiple data formats within a series:

1. **Array of y-values**: Simple array where index is used as x-value
2. **Array of [x,y] tuples**: Each point defined as [x, y] pair
3. **Array of objects**: Objects with properties for x and y values (as per the xKey and yKey properties)
4. **Observable**: Object with an observe method, which may emit tuples or objects
5. **Generator function**: Function that generates an array data points as a function of zoom

### <a id="grapherprops"></a>Schema `GrapherProps`

| Prop | Type | Required |
|------|------|----------|
| **series** | [SeriesData](#seriesdata)`[]` | **✓** |
| id | `string` | ✗ |
| webgl | `boolean` | ✗ |
| requireWASM | `boolean` | ✗ |
| checkIntersection | `boolean` | ✗ |
| onAxisChange | `(axes: any) => void` | ✗ |
| onRenderTime | `(time: number) => void` | ✗ |
| exportStateController | `(controller: any) => void` | ✗ |
| onPointDrag | `(point: any) => void` | ✗ |
| onDraggablePointsDoubleClick | `(point: any) => void` | ✗ |
| onPointClick | `(point: any) => void` | ✗ |
| timingFrameCount | `number` | ✗ |
| stateControllerInitialization | `object` | ✗ |
| syncPool | `SyncPool` | ✗ |
| dragPositionYOffset | `number` | ✗ |
| theme | `'day' \| 'night' \| 'export'` | ✗ |
| title | `string` | ✗ |
| fullscreen | `boolean` | ✗ |
| bodyHeight | `number` | ✗ |
| height | `number \| string` | ✗ |
| width | `number \| string` | ✗ |
| showAxes | `boolean` | ✗ |
| showRangeGraph | `boolean` | ✗ |
| showRangeSelectors | `boolean` | ✗ |
| showSeriesKey | `boolean` | ✗ |
| showTooltips | `boolean` | ✗ |
| showGrid | `boolean` | ✗ |
| showAxisColors | `boolean` | ✗ |
| bigLabels | `boolean` | ✗ |
| xTickUnit | `'year'` | ✗ |
| formatXAxisLabel | `(value: any) => string` | ✗ |
| xAxisIntegersOnly | `boolean` | ✗ |
| clockStyle | `'12h' \| '24h'` | ✗ |
| timeZone | `string` | ✗ |
| markRangeGraphDates | `boolean` | ✗ |
| boundsSelectionEnabled | `boolean` | ✗ |
| customBoundsSelectors | [CustomBoundsSelector](#customboundsselector)`[]` | ✗ |
| customBoundsSelectorsOnly | `boolean` | ✗ |
| sidebarEnabled | `boolean` | ✗ |
| defaultBoundsCalculator | `string` | ✗ |
| percentile | `number` | ✗ |
| defaultShowAnnotations | `boolean` | ✗ |
| defaultShowOptions | `boolean` | ✗ |
| defaultShowIndividualPoints | `boolean` | ✗ |
| defaultShowSidebar | `boolean` | ✗ |
| defaultLineWidth | `number` | ✗ |
| tooltipOptions | [TooltipOptions](#tooltipoptions) | ✗ |
| annotations | [Annotation](#annotation)`[]` | ✗ |
| draggablePoints | [DraggablePoint](#draggablepoint)`[]` | ✗ |
| verticalLines | [VerticalLine](#verticalline)`[]` | ✗ |

### <a id="seriesdata"></a>Schema `SeriesData`

| Prop | Type | Required |
|------|------|----------|
| **data** | `any[] \| Observable \| Function` | **✓** |
| type | `'values' \| 'tuples' \| 'objects' \| 'tuple_observable' \| 'object_observable' \| 'infer'` | ✗ |
| xKey | `string` | ✗ |
| yKey | `string` | ✗ |
| xUnixDates | `boolean` | ✗ |
| color | `string \| number` | ✗ |
| name | `string` | ✗ |
| xLabel | `string` | ✗ |
| yLabel | `string` | ✗ |
| rendering | `'line' \| 'bar' \| 'area' \| 'shadow'` | ✗ |
| ignoreDiscontinuities | `boolean` | ✗ |
| dashed | `boolean` | ✗ |
| dashPattern | `number[]` | ✗ |
| width | `number` | ✗ |
| axis | `string \| object` | ✗ |
| rangeSelectorWidth | `number` | ✗ |
| expandYWith | `number[]` | ✗ |
| defaultAlwaysTooltipped | `boolean` | ✗ |
| square | `boolean` | ✗ |
| shiftXBy | `number` | ✗ |
| graph | `number` | ✗ |
| background | `object` | ✗ |
| hideFromKey | `boolean` | ✗ |
| showIndividualPoints | `boolean` | ✗ |
| negativeColor | `string` | ✗ |
| gradient | `string[] \| [number, string][]` | ✗ |
| zeroLineWidth | `number` | ✗ |
| zeroLineColor | `string` | ✗ |
| zeroLineY | `number \| 'bottom'` | ✗ |
| pointRadius | `number` | ✗ |
| tooltipWidth | `number` | ✗ |
| hasAreaBottom | `boolean` | ✗ |
| shadowColor | `string` | ✗ |
| rangeKey | `string` | ✗ |
| cutoffTime | `number \| Date \| 'now'` | ✗ |

### <a id="tooltipoptions"></a>Schema `TooltipOptions`

| Prop | Type | Required |
|------|------|----------|
| includeSeriesLabel | `boolean` | ✗ |
| includeXLabel | `boolean` | ✗ |
| includeYLabel | `boolean` | ✗ |
| includeXValue | `boolean` | ✗ |
| includeYValue | `boolean` | ✗ |
| floating | `boolean` | ✗ |
| alwaysFixedPosition | `boolean` | ✗ |
| floatPosition | `'top' \| 'bottom'` | ✗ |
| floatDelta | `number` | ✗ |
| savingDisabled | `boolean` | ✗ |
| customTooltip | `React.ComponentType<any>` | ✗ |
| combineTooltips | `boolean \| number` | ✗ |

### <a id="customboundsselector"></a>Schema `CustomBoundsSelector`

| Prop | Type | Required |
|------|------|----------|
| **label** | `string` | **✓** |
| **calculator** | `(globalBounds?: any) => any` | **✓** |
| datesOnly | `boolean` | ✗ |

### <a id="annotation"></a>Schema `Annotation`

| Prop | Type | Required |
|------|------|----------|
| x | `string \| number \| Date` | ✗ |
| startX | `string \| number \| Date` | ✗ |
| endX | `string \| number \| Date` | ✗ |
| series | `string[]` | ✗ |
| content | `string` | ✗ |
| lineOnly | `boolean` | ✗ |

### <a id="draggablepoint"></a>Schema `DraggablePoint`

| Prop | Type | Required |
|------|------|----------|
| **x** | `number` | **✓** |
| **y** | `number` | **✓** |
| radius | `number` | ✗ |
| fillColor | `string` | ✗ |
| strokeColor | `string` | ✗ |
| strokeWidth | `number` | ✗ |
| onClick | `(point: `[DraggablePoint](#draggablepoint)`) => void` | ✗ |
| onDoubleClick | `(point: `[DraggablePoint](#draggablepoint)`) => void` | ✗ |

### <a id="verticalline"></a>Schema `VerticalLine`

| Prop | Type | Required |
|------|------|----------|
| **x** | `number` | **✓** |
| color | `string` | ✗ |
| lineTop | `number` | ✗ |
| width | `number` | ✗ |
| markTop | `boolean` | ✗ |
| style | `object` | ✗ |
| markerStyle | `object` | ✗ |
| text | `string` | ✗ |
| textTop | `number` | ✗ |
| textStyle | `object` | ✗ |
| minPixelX | `number` | ✗ |
| maxPixelX | `number` | ✗ |
| onRangeGraph | `boolean \| object` | ✗ |
| onRangeGraphOnly | `boolean` | ✗ |

## Developing
Other than an `npm install`, you'll need to install rust and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/).

## License
All rights reserved.

This library uses icons from FontAwesome, licensed via https://fontawesome.com/license. No changes were made, nor does Font Awesome endorse this use.
