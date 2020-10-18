# Display

<div align="center">
    <a href="https://www.npmjs.com/package/@anovel/quasar">
        <img alt="npm (scoped)" src="https://img.shields.io/npm/v/@anovel/quasar?style=for-the-badge">
    </a>
    <a href="https://github.com/a-novel/quasar/blob/master/LICENSE">    
        <img alt="GitHub" src="https://img.shields.io/github/license/a-novel/quasar?style=for-the-badge">
    </a>
</div>

<div align="center">
    <a href="https://codecov.io/gh/a-novel/quasar">
        <img alt="Codecov" src="https://img.shields.io/codecov/c/github/a-novel/quasar?style=flat-square">
    </a>
    <img alt="David" src="https://img.shields.io/david/dev/a-novel/quasar?style=flat-square">
    <img alt="npm bundle size (scoped)" src="https://img.shields.io/bundlephobia/min/@anovel/quasar?style=flat-square">
</div>
<br/>

Organize your components easily.

- [Layers](#layers)
    - [Layers position](#layers-position)
        - [align](#align)
        - [expand](#expand)
    - [Child props](#child-props)
        - [emancipate](#emancipate)
        - [ground](#ground)
- [License](#license)

# Layers

Layers adds another dimension to the horizontal and vertical axes for organizing elements in the DOM. It uses the
absolute css positioning to display elements in a z-axis stack.

```jsx
import React from 'react';
import {Layers} from '@anovel/quasar';

const MyComponent = () => (
  <Layers>
    <Element1/>
    <Element2/>
    <Element3/>
  </Layers>
);
```

<img alt="Layers schema 1" src="https://raw.githubusercontent.com/a-novel/quasar/master/assets/layers%20shema%201.png" width="600"/>

## Layers position

By default, elements are all centered on the layer. You can change this behavior by using the following properties.

### align

```jsx
import React from 'react';
import {Layers} from '@anovel/quasar';

const MyComponent = () => (
  <Layers align={{verticalCenter: true}}>
    ...
  </Layers>
);
```

Align is an object. You can use the following options on it:

| Option | Type | Description |
| :--- | :--- | :--- |
| verticalCenter | boolean | Center childrens vertically. |
| horizontalCenter | boolean | Center childrens horizontally. |

You can also use a boolean value to fully center or un-center a child or all children.

### expand

Expand will size every children to match the size of the container. It takes the following values:

| Value | Effect |
| :--- | :--- |
| true | Children will take full height and width of container. |
| "vertical" | Children will take full parent height. |
| "horizontal" | Children will take full parent width. |

## Child props

The above props can be used on any child component, to apply special style to them.

```jsx
import React from 'react';
import {Layers} from '@anovel/quasar';

const MyComponent = () => (
  <Layers align={{verticalCenter: true}}>
    <Element1/>
    <Element2 align={{horizontalCenter: true}}/>
    <Element3/>
  </Layers>
);
```

Here, `Element2` will be fully centered.

### emancipate

In the above example, every child, even when applied special props, will inherit from the parent layer align and expand
props.

You can override it by adding the boolean emancipate prop.

```jsx
import React from 'react';
import {Layers} from '@anovel/quasar';

const MyComponent = () => (
  <Layers align={{verticalCenter: true}}>
    <Element1/>
    <Element2 emancipate align={{horizontalCenter: true}}/>
    <Element3/>
  </Layers>
);
```

Here, the align prop from the parent layer will be ignored, and `Element2` will only be horizontally centered.

### ground

Since Layers children are absolute positioned, they will be removed from the page flow, which can lead to some issues
sometimes. You can force some children to not be layered, and stay positioned as regular elements, by using the
ground prop.

```jsx
import React from 'react';
import {Layers} from '@anovel/quasar';

const MyComponent = () => (
  <Layers align={{verticalCenter: true}}>
    <Element1/>
    <Element2 ground align={{horizontalCenter: true}}/>
    <Element3/>
  </Layers>
);
```

`Element2` will be statically positioned and align prop will be ignored.

# License

[Licensed under MIT for A-Novel](https://github.com/a-novel/quasar/blob/master/LICENSE).