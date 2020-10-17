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

![Layers chema 1](https://github.com/a-novel/quasar/blob/master/assets/layers%20schema%201.jpg?raw=true)

# License

[Licensed under MIT for A-Novel](https://github.com/a-novel/quasar/blob/master/LICENSE).