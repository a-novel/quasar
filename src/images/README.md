# Images

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

Enhance your application with pictures, the React way.

# Image

```jsx
import React from 'react';
import {Image} from '@anovel/quasar';

const MyComponent = () => (
  <Image src='/path/to/file'/>
);
```

The src prop, which should always start with a `/`, is relative to the
`public/` folder in React.

> Image tag is rendered as a div, so it is compatible with every div
> element props.

# Svg

```jsx
import React from 'react';
import {Svg} from '@anovel/quasar';
import {ReactComponent as MySvgComponent} from 'path/to/my/file.svg';

const MyComponent = () => (
  <Svg component={MySvgComponent}/>
);
```

# License

[Licensed under MIT for A-Novel](https://github.com/a-novel/quasar/blob/master/LICENSE).
