
# WindBorne Grapher
Powerful, performant graphing.

Grapher is designed primarily for internal infrastructure with lots of data and lots of axes. 
Key features include:
 - Performance. Grapher can render a million points in 100ms and support new data coming in at hundreds of points per second without degraded performance.
 - Async data sources. Grapher supports observables directly as well as generator functions to generate data on the fly
 - Axis management. Series can be moved between axes and new axes created with ease.
 - Long data ranges.

You _shouldn't_ use this package if:
 - You need to support older browsers. While it may work in older browsers, no guarantees are made. 
   New features will be used as they become available without regard for maintaining legacy support. 
 - You don't want to add a react dependency (though the rendering engine may be used without react). 
 - Asset size is a big concern. Despite not having dependencies, this is a relatively heavy engine compared to alternatives.

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

## Props
Like any React component, Grapher is primarily configured via props.
Refer to the Grapher PropTypes for complete type information.

### Core Props

**series** (required)
This sets the data for the graph and is the only property that is truly required.
See "Series" section for more details.

**webgl**
If true, will render with WebGL rather than a 2D context.
This is more performant, but uses more resources.

**requireWASM**
If true, will wait until the WASM extensions are ready before it renders.
This can be useful when your app has expensive initialization.

### Series Format
The `series` prop requires an array of objects, where each object represents a data series with the following properties:

- **data** (required): The actual data points (see Data Formats below)
- **type**: Data type or 'infer' to automatically detect
- **xKey**: Property name for x-values when using object data
- **yKey**: Property name for y-values when using object data
- **xUnixDates**: Whether x-values are Unix timestamps (boolean)
- **color**: Series color (string or number)
- **name**: Series name for display in legend
- **xLabel**: Label for x-axis
- **yLabel**: Label for y-axis
- **rendering**: Visual representation ('line', 'bar', or 'area', defaults to 'line')
- **ignoreDiscontinuities**: Whether to connect points across gaps (boolean)
- **dashed**: Whether to use dashed lines (boolean)
- **dashPattern**: Array defining dash pattern (array of numbers)
- **width**: Line width (number)
- **axis**: Axis specification for the series (string or object)
- **rangeSelectorWidth**: Width of the range selector for this series (number)
- **expandYWith**: Values to include when calculating y-axis range (array of numbers)
- **defaultAlwaysTooltipped**: Whether to always show tooltip for this series (boolean)
- **square**: Whether to render the series with square points (boolean)
- **shiftXBy**: Value to shift x-coordinates by (number)
- **graph**: Affects which graph this series belongs to in multigrapher (number)
- **background**: Background configuration (object)
- **hideFromKey**: Whether to hide this series from the legend (boolean)
- **showIndividualPoints**: Whether to show individual data points (boolean)
- **negativeColor**: Color for negative values
- **gradient**: Gradient configuration, only applies to area rendering (array)
- **zeroLineWidth**: Width of the zero line, only applies to bar and area rendering (number)
- **zeroLineColor**: Color of the zero line, only applies to bar and area rendering (string)
- **pointRadius**: Radius of points, only applies to area rendering (number)
- **tooltipWidth**: Expected width of the tooltip (number). Will make the tooltip switch sides when this width plus the tooltip left position is greater than the graph width.

#### Series Data Formats
Grapher supports multiple data formats within a series:

1. **Array of y-values**: Simple array where index is used as x-value
2. **Array of [x,y] tuples**: Each point defined as [x, y] pair
3. **Array of objects**: Objects with properties for x and y values (as per the xKey and yKey properties)
4. **Observable**: Object with an observe method, which may emit tuples or objects
5. **Generator function**: Function that generates an array data points as a function of zoom

### Event Handlers

**onAxisChange**
If passed in, this function will be called every time the axes change.
It will be called with an array of objects, where each object is a single series object with the `axis`
property set to {left, right}-{index}. This can be useful for saving state between reloads.

**onRenderTime**
If passed in, this function will be called every time the grapher renders.
It will be called with diagnostic information about how long rendering took.

**onPointDrag**
Callback function that fires when draggable points are moved.

**onDraggablePointsDoubleClick**
Callback function that fires when draggable points are double-clicked.

**timingFrameCount**
Sets the number of frames for when the state controller's `averageLoopTime` method is called.

### Appearance

**theme**
Sets the theme of grapher to either 'day', 'night', or 'export'.
You can also override any CSS property directly in a stylesheet.

**title**
Sets the title text for the graph.

**fullscreen**
If true, displays the graph in fullscreen mode.

**bodyHeight**
Sets the height of the graph body (i.e., excluding range graph, series controls, etc.).

**height**
Sets the height of the entire graph.

**width**
Sets the width of the graph.

### Display Options

**showAxes**
Whether to show the axes on the graph.

**showRangeGraph**
Whether to show the smaller range graph below the main graph.

**showRangeSelectors**
Whether to show the top bar with range selection (e.g., "last day" button) and other options.

**showSeriesKey**
Whether to show the key of which series have which colors.

**showTooltips**
Whether to display tooltips when hovering over data points.

**showGrid**
Whether to show grid lines on the graph.

**showAxisColors**
Whether to color-code axes based on the series they represent.

**bigLabels**
If true, uses larger text for labels.

**xTickUnit**
Specifies the unit for x-axis ticks. Currently supports 'year'.

**xAxisIntegersOnly**
If true, only displays integer values on the x-axis.

**clockStyle**
Format for displaying time, either '12h' or '24h'.

**timeZone**
Time zone for date/time display. Can be 'local', 'utc', or a full timezone string.

**markRangeGraphDates**
Whether to mark significant dates on the range graph.

**tooltipOptions**
Configures tooltip appearance and behavior with properties including:
- `includeSeriesLabel`: Whether to show series name in tooltip
- `includeXLabel`: Whether to show x-axis label in tooltip
- `includeYLabel`: Whether to show y-axis label in tooltip
- `includeXValue`: Whether to show x-axis value in tooltip
- `includeYValue`: Whether to show y-axis value in tooltip
- `floating`: Whether tooltip floats or is fixed position
- `alwaysFixedPosition`: Forces tooltip to always use fixed position
- `floatPosition`: Placement of floating tooltip ('top' or 'bottom')
- `floatDelta`: Pixel offset for floating tooltip positioning
- `savingDisabled`: Prevents tooltip settings from being saved
- `customTooltip`: A react component to use as a custom tooltip. See [examples/custom_tooltips_graph.js](examples/custom_tooltips_graph.js) for an example. If used in conjunction with `combineTooltips`, see [examples/combined_tooltips_graph.js](examples/combined_tooltips_graph.js) 
- `combineTooltips`: If true, combines multiple tooltips into one when multiple series are shown. Can alternatively be set to a threshold in pixels for how close values need to be in order to be combined.

**customBoundsSelectors**
Array of custom range selector objects with properties:
- `label`: Display text for the selector
- `calculator`: Function that determines the bounds
- `datesOnly`: If true, only works with date values

**customBoundsSelectorsOnly**
If true, only displays custom bounds selectors.

**defaultBoundsCalculator**
String identifier for the default bounds calculator to use.

**defaultShowOptions**
Default visibility of the options panel.

**defaultShowIndividualPoints**
Default setting for showing individual data points.

**defaultShowSidebar**
Default visibility of the sidebar.

**defaultShowAnnotations**
Default visibility of annotations.

**defaultLineWidth**
Default width of the lines in the graph.

**boundsSelectionEnabled**
Whether to enable the bounds selection feature.

**sidebarEnabled**
Whether to enable the sidebar.

**percentile**
Sets the percentile value for calculations.


### Advanced Features

**tooltipOptions**
Configures tooltip appearance and behavior with properties including:
- `includeSeriesLabel`: Whether to show series name in tooltip
- `includeXLabel`: Whether to show x-axis label in tooltip
- `includeYLabel`: Whether to show y-axis label in tooltip
- `includeXValue`: Whether to show x-axis value in tooltip
- `includeYValue`: Whether to show y-axis value in tooltip
- `floating`: Whether tooltip floats or is fixed position
- `alwaysFixedPosition`: Forces tooltip to always use fixed position
- `floatPosition`: Placement of floating tooltip ('top' or 'bottom')
- `floatDelta`: Pixel offset for floating tooltip positioning
- `savingDisabled`: Prevents tooltip settings from being saved

**customBoundsSelectors**
Array of custom range selector objects with properties:
- `label`: Display text for the selector
- `calculator`: Function that determines the bounds
- `datesOnly`: If true, only works with date values

**customBoundsSelectorsOnly**
If true, only displays custom bounds selectors.

**defaultBoundsCalculator**
String identifier for the default bounds calculator to use.

**annotations**
Array of annotation objects to display on the graph with properties:
- `x`: Position on x-axis (string, number, or Date) where annotation should appear
- `xEnd`: Optional end position for range annotations
- `series`: Optional array of series names the annotation applies to
- `content`: Text content of the annotation

**draggablePoints**
Array of interactive point objects with properties:
- `x`: X-coordinate position
- `y`: Y-coordinate position
- `radius`: Optional size of the point
- `fillColor`: Optional interior color
- `strokeColor`: Optional outline color
- `strokeWidth`: Optional outline width
- `onClick`: Optional click handler function
- `onDoubleClick`: Optional double-click handler function

**verticalLines**
Array of vertical line objects to display on the graph with properties:
- `x`: X-coordinate position where the line should appear
- `color`: Optional line color
- `width`: Optional line width
- `markTop`: Whether to add a marker at the top of the line
- `style`: Optional styling object for the line
- `markerStyle`: Optional styling object for the marker
- `lineTop`: Optional value to specify the top position of the line
- `text`: Optional text to display alongside the line
- `textTop`: Optional value to specify the vertical position of the text
- `textStyle`: Optional styling object for the text
- `minPixelX`: Optional number. If the x position of the line in pixels is less than this value, the line will be hidden
- `maxPixelX`: Optional number. If the x position of the line in pixels is greater than this value, the line will be hidden
- `onRangeGraph`: If true, will show the line on the range graph as well. This may also be an object with any of the above options to adjust the styling
- `onRangeGraphOnly`: If true, the vertical line will only appear on the range graph and not the primary graph

## Developing
Other than an `npm install`, you'll need to install rust and [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/).

## License
All rights reserved.

This library uses icons from FontAwesome, licensed via https://fontawesome.com/license. No changes were made, nor does Font Awesome endorse this use.
