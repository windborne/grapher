# Data inputs
The goal is for the grapher to be extremely flexible in how it inputs data. The normalization step in the data flow 
makes sure that everything can be converted into a form where it can be rendered.

The input type can either be explicitly stated or inferred.

## Value array
Name: `values`. A list of values, which will be evenly spaced across the width of the graph.

```javascript
const data = [10, 20, 0, 15];
``` 

## Tuple array
Name: `tuples`. A list of `[x, y]` tuples. An `x` may be a number or a Date; a `y` may be a number or null.

```javascript
const data = [
    [1, 10], 
    [2, 20], 
    [3, 0], 
    [4, 15]
];
```

## Object array
Name: `objects`. A list of objects. An `xKey` and a `yKey` are required. These index into object to find the x and y values, which can be useful when you have a shared dataset that you want to plot a variety of variables from. 

```javascript
const data = [
    {
        timestamp: new Date(Date.now() - 4*1000), 
        value: 10
    },
    {
        timestamp: new Date(Date.now() - 2*1000), 
        value: 20
    },
    {
        timestamp: new Date(Date.now() - 0*1000), 
        value: 0
    }
];
const xKey = 'timestamp';
const yKey = 'value';
```

## Tuple observable
Name: `tuple_observable`. An observable which emits tuples of the form `[x, y]`.

```javascript
const data = Kefir.sequentially(1000, [
    [new Date(Date.now() - 4*1000), 10],
    [new Date(Date.now() - 2*1000), 20],
    [new Date(Date.now() - 0*1000), 0]
]);
```

## Object observable
Name: `object_observable`. An observable which emits objects. An `xKey` and a `yKey` are required. These index into object to find the x and y values, which can be useful when you have a shared dataset that you want to plot a variety of variables from. 

```javascript
const data = Kefir.sequentially(1000, [
    {
        timestamp: new Date(Date.now() - 4*1000), 
        value: 10
    },
    {
        timestamp: new Date(Date.now() - 2*1000), 
        value: 20
    },
    {
        timestamp: new Date(Date.now() - 0*1000), 
        value: 0
    }
]);
const xKey = 'timestamp';
const yKey = 'value';
```

## Generator function
Name: `generator`. A generator function that gets called to produce data in the form of a values array, a tuples array, or an objects array -- or a promise to one of those. If it returns null or undefined, the result will be ignored and the grapher will use whatever data it already had.

Gets called on creation and whenever the bounds change (after debouncing). Gets called with an object with the following properties:
 - minX
 - maxX
 - sizing

```javascript
const data = async ({minX, maxX}) => {
    // you can add whatever functionality you want in here too, like checking some in-memory cache

    return await fetch(`/endpoint?min=${minX}&max=${maxX}`).then((r) => r.json()); 
};
```

