
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
6. **Wind data**: Objects with wind x/y components (via windXKey and windYKey). The y-value becomes wind speed and direction arrows are displayed above the x-axis.

### <a id="grapherprops"></a>Schema `GrapherProps`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| **series** | [SeriesData](#seriesdata)`[]` | **✓** | The data for the graph and is the only property that is truly required. See "Series Data Formats" section for more details. |
| id | `string` | ✗ | Unique identifier for the grapher instance. |
| webgl | `boolean` | ✗ | If true, will render with WebGL rather than a 2D context. This is more performant, but uses more resources. |
| requireWASM | `boolean` | ✗ | If true, will wait until the WASM extensions are ready before it renders. This can be useful when your app has expensive initialization. |
| checkIntersection | `boolean` | ✗ | Controls intersection observer usage for performance optimization. |
| onAxisChange | `(axes: any) => void` | ✗ | Called every time the axes change. Receives an array of objects with the `axis` property set to {left, right}-{index}. Useful for saving state between reloads. |
| onRenderTime | `(time: number) => void` | ✗ | Called every time the grapher renders with diagnostic information about how long rendering took. |
| exportStateController | `(controller: any) => void` | ✗ | Callback that receives the state controller instance for external manipulation. |
| onPointDrag | `(point: any) => void` | ✗ | Callback function that fires when draggable points are moved. |
| onDraggablePointsDoubleClick | `(point: any) => void` | ✗ | Callback function that fires when draggable points are double-clicked. |
| onPointClick | `(point: any) => void` | ✗ | Click handler for data points. |
| timingFrameCount | `number` | ✗ | Sets the number of frames for when the state controller's `averageLoopTime` method is called. |
| stateControllerInitialization | `object` | ✗ | Options for initializing the internal state controller. |
| syncPool | `SyncPool` | ✗ | For synchronizing with other grapher instances. |
| dragPositionYOffset | `number` | ✗ | Y-offset for drag positioning, used in multigrapher. |
| theme | `'day' \| 'night' \| 'export'` | ✗ | Sets the theme of grapher. You can also override any CSS property directly in a stylesheet. |
| title | `string` | ✗ | Sets the title text for the graph. |
| fullscreen | `boolean` | ✗ | If true, displays the graph in fullscreen mode. |
| bodyHeight | `number` | ✗ | Sets the height of the graph body (i.e., excluding range graph, series controls, etc.). |
| height | `number \| string` | ✗ | Sets the height of the entire graph. |
| width | `number \| string` | ✗ | Sets the width of the graph. |
| showAxes | `boolean` | ✗ | Whether to show the axes on the graph. |
| showRangeGraph | `boolean` | ✗ | Whether to show the smaller range graph below the main graph. |
| showRangeSelectors | `boolean` | ✗ | Whether to show the top bar with range selection (e.g., "last day" button) and other options. |
| showSeriesKey | `boolean` | ✗ | Whether to show the key of which series have which colors. |
| showTooltips | `boolean` | ✗ | Whether to display tooltips when hovering over data points. |
| showGrid | `boolean` | ✗ | Whether to show grid lines on the graph. |
| showAxisColors | `boolean` | ✗ | Whether to color-code axes based on the series they represent. |
| bigLabels | `boolean` | ✗ | If true, uses larger text for labels. |
| xTickUnit | `'year'` | ✗ | Specifies the unit for x-axis ticks. Currently supports 'year'. |
| formatXAxisLabel | `(value: any) => string` | ✗ | A custom function to format the x-axis labels. This function should take a single argument (the raw x-value) and return a string to display as the label. |
| xAxisIntegersOnly | `boolean` | ✗ | If true, only displays integer values on the x-axis. |
| clockStyle | `'12h' \| '24h'` | ✗ | Format for displaying time, either '12h' or '24h'. |
| timeZone | `string` | ✗ | Time zone for date/time display. Can be 'local', 'utc', or a full timezone string. |
| markRangeGraphDates | `boolean` | ✗ | Whether to mark significant dates on the range graph. |
| boundsSelectionEnabled | `boolean` | ✗ | Whether to enable the bounds selection feature. |
| customBoundsSelectors | [CustomBoundsSelector](#customboundsselector)`[]` | ✗ | Array of custom range selector objects with label, calculator, and optional datesOnly properties. |
| customBoundsSelectorsOnly | `boolean` | ✗ | If true, only displays custom bounds selectors. |
| sidebarEnabled | `boolean` | ✗ | Whether to enable the sidebar. |
| defaultBoundsCalculator | `string` | ✗ | String identifier for the default bounds calculator to use. |
| percentile | `number` | ✗ | Sets the percentile value for calculations. |
| defaultShowAnnotations | `boolean` | ✗ | Default visibility of annotations. |
| defaultShowOptions | `boolean` | ✗ | Default visibility of the options panel. |
| defaultShowIndividualPoints | `boolean` | ✗ | Default setting for showing individual data points. |
| defaultShowSidebar | `boolean` | ✗ | Default visibility of the sidebar. |
| defaultLineWidth | `number` | ✗ | Default width of the lines in the graph. |
| tooltipOptions | [TooltipOptions](#tooltipoptions) | ✗ | Configures tooltip appearance and behavior with various options. |
| annotations | [Annotation](#annotation)`[]` | ✗ | Array of annotation objects to display on the graph with position, content, and series targeting. |
| draggablePoints | [DraggablePoint](#draggablepoint)`[]` | ✗ | Array of interactive point objects with position, styling, and event handlers. |
| verticalLines | [VerticalLine](#verticalline)`[]` | ✗ | Array of vertical line objects to display on the graph with position, styling, and text options. |

### <a id="seriesdata"></a>Schema `SeriesData`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| **data** | `any[] \| Observable \| Function` | **✓** | The actual data points (see Data Formats section). |
| type | `'values' \| 'tuples' \| 'objects' \| 'tuple_observable' \| 'object_observable' \| 'infer'` | ✗ | Data type or 'infer' to automatically detect. |
| xKey | `string` | ✗ | Property name for x-values when using object data. |
| yKey | `string` | ✗ | Property name for y-values when using object data. |
| windXKey | `string` | ✗ | Property name for wind x-component. When both windXKey and windYKey are provided, y-value is calculated as wind speed (magnitude). |
| windYKey | `string` | ✗ | Property name for wind y-component. Used with windXKey for wind data visualization. |
| windComp | `React.ComponentType` | ✗ | Custom component for wind direction arrows. Receives props: `windX`, `windY`, `speed`, `speedPercentile` (0-1 based on min/max speed). |
| xUnixDates | `boolean` | ✗ | Whether x-values are Unix timestamps. |
| color | `string \| number` | ✗ | Series color (string or number). |
| name | `string` | ✗ | Series name for display in legend. |
| xLabel | `string` | ✗ | Label for x-axis. |
| yLabel | `string` | ✗ | Label for y-axis. |
| rendering | `'line' \| 'bar' \| 'area' \| 'shadow'` | ✗ | Visual representation (defaults to 'line'). The 'shadow' option creates an area chart with individual point-based trapezoid gradients extending downward. |
| ignoreDiscontinuities | `boolean` | ✗ | Whether to connect points across gaps. |
| dashed | `boolean` | ✗ | Whether to use dashed lines. |
| dashPattern | `number[]` | ✗ | Array defining dash pattern. |
| width | `number` | ✗ | Line width. |
| axis | `string \| object` | ✗ | Axis specification for the series. |
| rangeSelectorWidth | `number` | ✗ | Width of the range selector for this series. |
| expandYWith | `(number | null)[] | null` | ✗ | Values to include when calculating y-axis range. |
| defaultAlwaysTooltipped | `boolean` | ✗ | Whether to always show tooltip for this series. |
| followingMouseTooltip | `boolean` | ✗ | When true and defaultAlwaysTooltipped is also true, the tooltip follows the mouse y-position. |
| square | `boolean` | ✗ | Whether to render the series with square points. |
| shiftXBy | `number` | ✗ | Value to shift x-coordinates by. |
| graph | `number` | ✗ | Affects which graph this series belongs to in multigrapher. |
| background | `object` | ✗ | Background configuration. |
| hideFromKey | `boolean` | ✗ | Whether to hide this series from the legend. |
| showIndividualPoints | `boolean` | ✗ | Whether to show individual data points. |
| minPointSpacing | `number` | ✗ | Minimum pixel spacing between individual points to prevent overlap. |
| negativeColor | `string` | ✗ | Color for lines and points with negative values (below zero). |
| gradient | `string[] \| [number, string][]` | ✗ | Gradient configuration for area and shadow fills. Array of colors or [position, color] pairs. |
| negativeGradient | `string[] \| [number, string][]` | ✗ | Separate gradient for negative values (below zero) in area and shadow charts. Same format as gradient. |
| zeroLineWidth | `number` | ✗ | Width of the zero line, only applies to bar and area rendering. |
| zeroLineColor | `string` | ✗ | Color of the zero line, only applies to bar and area rendering. |
| zeroLineY | `number \| 'bottom'` | ✗ | Y-coordinate of the zero line, only applies to bar and area rendering. Defaults to zero; may also be the string "bottom". |
| pointRadius | `number` | ✗ | Radius of points, only applies to area rendering. |
| tooltipWidth | `number` | ✗ | Expected width of the tooltip. Will make the tooltip switch sides when this width plus the tooltip left position is greater than the graph width. |
| hasAreaBottom | `boolean` | ✗ | Read the bottom of the area from data. By default, the bottom of an area will just be zero; this allows changing that via passing in `[[x1, bottom], [x1, top], [x2, bottom], [x2, top]]` to data. |
| shadowColor | `string` | ✗ | Color of the shadow. |
| rangeKey | `string` | ✗ | If provided, will draw range bars. The range value should be of shape `{min: number, max: number}`. Not compatible with webgl. |
| cutoffTime | `number \| Date \| 'now'` | ✗ | Creates visual cutoff effects in line, area, bar, and shadow renderings. Can be a timestamp, Date object, or 'now' for current time. |

### <a id="tooltipoptions"></a>Schema `TooltipOptions`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| includeSeriesLabel | `boolean` | ✗ | Whether to show series name in tooltip. |
| includeXLabel | `boolean` | ✗ | Whether to show x-axis label in tooltip. |
| includeYLabel | `boolean` | ✗ | Whether to show y-axis label in tooltip. |
| includeXValue | `boolean` | ✗ | Whether to show x-axis value in tooltip. |
| includeYValue | `boolean` | ✗ | Whether to show y-axis value in tooltip. |
| floating | `boolean` | ✗ | Whether tooltip floats or is fixed position. |
| alwaysFixedPosition | `boolean` | ✗ | Forces tooltip to always use fixed position. |
| floatPosition | `'top' \| 'bottom'` | ✗ | Placement of floating tooltip. |
| floatDelta | `number` | ✗ | Pixel offset for floating tooltip positioning. |
| savingDisabled | `boolean` | ✗ | Prevents tooltip settings from being saved. |
| customTooltip | `React.ComponentType<any>` | ✗ | A react component to use as a custom tooltip. If used in conjunction with `combineTooltips`, see combined tooltips examples. |
| combineTooltips | `boolean \| number` | ✗ | If true, combines multiple tooltips into one when multiple series are shown. Can alternatively be set to a threshold in pixels for how close values need to be in order to be combined. |

### <a id="customboundsselector"></a>Schema `CustomBoundsSelector`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| **label** | `string` | **✓** | Display text for the selector. |
| **calculator** | `(globalBounds?: any) => any` | **✓** | Function that determines the bounds. |
| datesOnly | `boolean` | ✗ | If true, only works with date values. |

### <a id="annotation"></a>Schema `Annotation`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| x | `string \| number \| Date` | ✗ | Position on x-axis where annotation should appear. |
| startX | `string \| number \| Date` | ✗ | Start position for range annotations. |
| endX | `string \| number \| Date` | ✗ | End position for range annotations. |
| series | `string[]` | ✗ | Optional array of series names the annotation applies to. |
| content | `string` | ✗ | Text content of the annotation. |
| lineOnly | `boolean` | ✗ | Shows only the line portion of annotations without background/content areas. |

### <a id="draggablepoint"></a>Schema `DraggablePoint`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| **x** | `number` | **✓** | X-coordinate position. |
| **y** | `number` | **✓** | Y-coordinate position. |
| radius | `number` | ✗ | Optional size of the point. |
| fillColor | `string` | ✗ | Optional interior color. |
| strokeColor | `string` | ✗ | Optional outline color. |
| strokeWidth | `number` | ✗ | Optional outline width. |
| onClick | `(point: `[DraggablePoint](#draggablepoint)`) => void` | ✗ | Optional click handler function. |
| onDoubleClick | `(point: `[DraggablePoint](#draggablepoint)`) => void` | ✗ | Optional double-click handler function. |

### <a id="verticalline"></a>Schema `VerticalLine`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| **x** | `number \| Date` | **✓** | X-coordinate position where the line should appear. Can be a numeric value or a Date object. |
| color | `string` | ✗ | Optional line color. |
| lineTop | `number` | ✗ | Optional value to specify the top position of the line. |
| width | `number` | ✗ | Optional line width. |
| markTop | `boolean` | ✗ | Whether to add a marker at the top of the line. |
| style | `object` | ✗ | Optional styling object for the line. |
| markerStyle | `object` | ✗ | Optional styling object for the marker. |
| text | `string` | ✗ | Optional text to display alongside the line. |
| textTop | `number` | ✗ | Optional value to specify the vertical position of the text. |
| textStyle | `object` | ✗ | Optional styling object for the text. |
| minPixelX | `number` | ✗ | If the x position of the line in pixels is less than this value, the line will be hidden. |
| maxPixelX | `number` | ✗ | If the x position of the line in pixels is greater than this value, the line will be hidden. |
| onRangeGraph | `boolean \| object` | ✗ | If true, will show the line on the range graph as well. This may also be an object with any of the above options to adjust the styling. |
| onRangeGraphOnly | `boolean` | ✗ | If true, the vertical line will only appear on the range graph and not the primary graph. |

## Developing
Other than an `npm install`, you'll need to install rust and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/).

## License
All rights reserved.

This library uses icons from FontAwesome, licensed via https://fontawesome.com/license. No changes were made, nor does Font Awesome endorse this use.
