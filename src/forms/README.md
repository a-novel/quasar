# Forms

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

A list of components to use for building advanced forms.

- [Input](#input)
    - [Input renderers](#input-renderers)
        - [placeholder](#placeholder)
        - [render](#render)
            - [Ghost characters](#ghost-characters)
    - [Control input content](#control-input-content)
        - [area](#area)
        - [maxLength](#maxlength)
        - [characterSet](#characterset)
        - [filter](#filter)
    - [Interacting with the input](#interacting-with-the-input)
        - [exposer](#exposer)
            - [write](#write)
        - [ref](#ref)
    - [Input handlers](#input-handlers)
        - [onChange](#onchange)
        - [onWriteError](#onwriteerror)
- [Special Objects](#special-objects)
    - [Caret](#caret)
- [License](#license)

# Input

This is a custom implementation of the default `<input/>` element based on the 
**contenteditable** attribute, which allows for more deep control over the input textual
content.

The goal was to make the component as simple as possible to use. Their is no required
parameter for it to work.

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => (
  <Input/>
);
```

## Input renderers

### placeholder

Component to display when the input is empty.

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  return (
    <Input placeholder={<PlaceholderComponent/>}/>
  );
}
```

### render

This custom method allow you to render your input content as parsed
HTML.

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  // Color each occurence of the word 'red' in red.
  return (
    <Input render={
      content => content.split(' ')
                        .map(x => x.toLowerCase() === 'red' ? 
                          <span style={{color: 'red'}} children={x}/> :
                          x
                        )
    }/>
  );
}
```

#### Ghost characters

Extra characters to be rendered in the input, but ignored in the state
value.

A typical example would involve a date input:

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const renderDateInput = content => content.split('').map(
  (char, index) => [1,3].includes(index) ? 
    <span key={index}>{char}<span className='separator'>/</span></span> :
    <span key={index} children={char}/>
);

const MyComponent = () => {
  return (
    <Input
      ignore={['.separator']} 
      characterSet={{include: '0123456789'}} 
      render={renderDateInput}
    />
  );
}
```

Typing `01011970` number by number will produce the following results:

```text
0
01/
01/0
01/01/
01/01/1
01/01/19
01/01/197
01/01/1970
```

And you can safely remove a character, for example the first '0':

```text
10/11/970
```

The `/` are what we call ghost characters : they appear to the user, but
are unknown to the input value. They are declared within a React element
that matches the selector passed with prop `ignore`.

**This should always be your goto if you want to render extra characters**,
as doing it without the `ignore` property may lead to caret jumps and
visual inconsistencies. 

## Control input content

### area

We wanted our Input component to be as close as possible to the HTML input element.
By default, the input is linear, meaning it doesn't automatically break on a new
line when overflowing.

This behavior can be implemented with the `area` boolean prop. It will make the input
behave like a textarea element.
 
> There is a minor difference in our implementation with textarea : height/width is not
> automatically adjustable for now (resize attribute on textarea element). Instead, it
> will automatically adjust its height depending on the content.
>
> You can override this behavior by setting a fixed or maximal height with css style or
> class.

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  return (
    <Input area/>
  );
}
```

### maxLength

Specify a maximum length for your content.

> This property will ignore [ghost characters](#ghost-characters).

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  return (
    <Input maxLength={50}/>
  );
}
```

### characterSet

Restrict the characters the user can type in the input. If a forbidden key is pressed,
it will simply be ignored.

This property also filter values added through paste.

```json
{
  "include": [],
  "exclude": []
}
```

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  return (
    <div>
      {/* Numeric input */}
      <Input characterSet={{include: '0123456789'}}/>

      {/* Disable punctuation */}
      <Input characterSet={{exclude: '≈&\'";:,.<>/?[]{}\\|-_!@#$%^&*()`~+='}}/>

      {/* Numeric input but exclude 0 for some reason */}
      <Input characterSet={{include: '0123456789', exclude: '0'}}/>
    </div>
  );
}
```

### filter

You can add a custom filter when a new content is about to be added to your input value.
This filter take the new content as an input, and outputs the cleared content.

> filter prop only operates on the **new content**, meaning it doesn't know anything
> about the full input state.
>
> Handler will later be added to allow filtering based on the whole value. This can
> currently be achieved by calling write method in onChange handler.

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  return (
    <div>
      {/* Reproduce behavior of characterSet={{include: '0123456789'}} */}
      <Input filter={content => content.split('').filter(x => '0123456789'.includes(x)).join('')}/>
    </div>
  );
}
```

## Interacting with the input

### exposer

The first major advantage of this implementation is to be deeply and safely controllable
from the outside. This is done by exposing internal methods through the `exposer` prop.

```jsx
import React from 'react';
import {Input, createExposer} from '@anovel/quasar';

const MyComponent = () => {
  // Was created intentionnally to work like React.createRef()
  const exposer = createExposer();

  return (
    <Input exposer={exposer}/>
  );
}
```

On a side note, the functional exposer declaration is available, and works in a similar
fashion to React function ref:

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  // Was created intentionnally to work like React.createRef()
  let methods = {};

  // Try methods.value() once mounted.

  return (
    <Input exposer={fn => methods = fn}/>
  );
}
```

The exposer let you interact with your input through its `exposer.methods` key. The
accessible methods are listed below :

| Key | Arguments | Returns | Description |
| :--- | :--- | :--- | :--- |
| value | boolean | string | Returns the current value held by the component. Passing the argument as true will include [ghost characters](#ghost-characters) in the returned value. |
| write | string, boolean, [Caret](#caret) | Promise\<void> | See details at [write](#write) method section. |
| undo | - | Promise\<void> | Undo last active entry. **[(1)](#recordpackage)** |
| redo | - | Promise\<void> | Redo last non active entry. **[(1)](#recordpackage)** |
| records | - | [][Records](https://github.com/a-novel/records#record-object) | Redo last non active entry. **[(1)](#recordpackage)** |
| isFocused | - | boolean | Return true if the current input has focus in the document. |
| focus | - | - | Give the current input focus. |
| getSelectionRange | - | [getRange](https://github.com/a-novel/tachyon#getrange) return value | **[(2)](#tachyonpackage)** | 
| setSelectionRange | - | [setRange](https://github.com/a-novel/tachyon#setrange) return value | **[(2)](#tachyonpackage)** | 

<span id="recordpackage">(1)</span> This methods are based on the `@anovel/records` package, available at <a href="https://github.com/a-novel/records">this repository</a>.

<span id="tachyonpackage">(2)</span> This methods are based on the `@anovel/tachyon` package, available at <a href="https://github.com/a-novel/tachyon">this repository</a>.

#### write

Replace the current caret range within the string with the value given as first
argument.

> Calling `write` alone will trigger the `onChange` prop, but **not the `onWriteError`
> one**, so you should add your own catch condition afterwards.

```jsx
// Write hello world.
exposer.write('hello world');
```
 
 If the second argument is set to true, the method will perform a remove operation 
 (similar to pressing backspace key), and ignore the first argument's value.
 
```jsx
// Remove one character.
exposer.write('will not write', true);
```
 
If the last argument is not set, the operation will use the current user selection 
to determine what part to cut - and will append the new content if the element is 
not focused.
 
```jsx
// Write hello world at the end of the input if not focused, at current user 
// position otherwise.
exposer.write('hello world');

// Write at the given position.
exposer.write('hello world', false, {start: 5, end: 5});
```

### ref

Input support React ref forwarding, so you can declare a reference in the same way
you'll do with a default HTML element. Function ref are supported as well:

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  const ref = React.createRef();

  return (
    <Input ref={ref}/>
  );
}
```

## Input handlers

> They are not listed but Input is also compatible with all React native
> event handlers.

### onChange

Called when input content is updated.

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  return (
    <Input onChange={(lastRecord, value) => {
      // Do anything.
    }}/>
  );
}
```

This handler receives 2 arguments.

| Argument | Type | Description |
| :--- | :--- | :--- |
| lastRecord | [][Records](https://github.com/a-novel/records#record-object) | Represent the new record generated by input in history. |
| value | string | Current value of the input. |

### onWriteError

Called when write operation fails.

```jsx
import React from 'react';
import {Input} from '@anovel/quasar';

const MyComponent = () => {
  return (
    <Input onWriteError={error => {
      // Do anything.
    }}/>
  );
}
```

# Special Objects

## Caret

```json
{
  "start": 0,
  "end": 10
}
```

Represent a caret position within a selection.

# License

[Licensed under MIT for A-Novel](https://github.com/a-novel/quasar/blob/master/LICENSE).
