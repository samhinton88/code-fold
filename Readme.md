# Unfold

Let your codebase write itself.

```
yarn global add unfold-cli
```

Writing code is almost always about deciding on a __pattern__ and then the boring part is __implementing it__, `unfold` allows you to focus on the pattern and have the code write itself.

`unfold` transforms a codebase into a reactive, event driven system - it sees a change made to code as an event, a message that is emitted to all other parts of the codebase.

A developer can then decide which other parts of the code should change as a result, and `unfold` will make those changes automatically.


## Usage
### Initialisation
Once installed, navigate in your terminal to the top of your codebase and then run:
```
unfold
```

### Syntax

`unfold` commands currently live with your code and use a JSX-like syntax.

#### Listeners
Listener folds listen for changes to particular types of syntax in locations you point them at:
```js
// ./some-file.js
// <myFirstFold downstream exported_functions />
```
This fold will listen for any __new__ exported functions in its local directory and any lower directories, and emit an event when this occurs.

`unfold` runs queries on the ASTs for the files in your codebase, and so can distinguish between, e.g. a new function being written and a function being exported. 

The `downstream` prop instructs the fold to watch all files in the local directory and any lower directories.

Using a non-self-closing fold instructs it to listen to only what is between its opening and closing tags.
```js
// <myFirstFold exported_functions >
// Just watch the JavaScript in here!
export const foo = () => {} // <-- this will trigger
// </myFirstFold>
export const bar = () => {} // <-- this will not trigger
```

#### Consumers
Consumer folds listen for those emitted events and make modifications to the codebase based on those events:
```js 
// ./some-other-dir/some-other-file.js
// <*myFirstFold overwrite snippet="{{ name }}">

// </*myFirstFold>
```
This fold will fire when `myFirstFold` emits an event, it will then write the names of the downstream exported functions between its opening and closing tags.

The `snippet` prop allows a developer to write an inline template for whatever new code they want to be added. These templates use HandlebarsJS and are called with data coming through on the event.

So in the above example, were I to create a new function like this:
```js
const myFilter = (data, predicate) => data.filter(predicate) 
```

The consumer would write:
```js
myFilter
```

Consumers also accept a `where` prop, which allows us to get greater control over when a consumer should do its work.

`where` accepts JavaScript as a string, and will execute it in the context of the data coming through on the event.

```js
// <*myFirstFold overwrite snippet="{{ name }}" where="name.startsWith('user')">

// </*myFirstFold>
```

This consumer fold is listening to the same event, but will only write the names of functions that start with the token `user`.

Consumer folds take a number of commands when deciding how to make modifications:
- `overwrite` 
  - used non-self-closing folds and will overwrite anything between its opening and closing tags.
- `overwrite_below`
  - used in self-closing folds and will overwrite everything below

### Tiny Example
Wire up your code:
```js
// ./my-math.js
// <newFunction arrow_function>
// </newFunction>

export {
// <*newFunction overwrite snippet={"{{name}},"}>
// </*newFunction
}
```
Make a change:
```js
// ./my-math.js
// <newFunction arrow_function>
const add = () => {}
const subtract = () => {}
const divide = () => {}
const multiply = () => {}
// </newFunction>

export {
// <*newFunction overwrite snippet={"{{name}},"}>
// </*newFunction
}
```
Save and let `unfold` write the rest of your code:
```js
// ./my-math.js
// <newFunction arrow_function>
const add = () => {}
const subtract = () => {}
const divide = () => {}
const multiply = () => {}
// </newFunction>

export {
// <*newFunction overwrite_below snippet={"  {{name}},"}>
    add,
    subtract,
    divide,
    multiply,
// </*newFunction
}
```
## Case Study: index file

Often we'll want to organise functions into directories and then for ease of use export them all from an index file at a higher level.

Copy this into your index file:

```js
// utils/index.js

// <newFunctionExportedBelowThis downstream exported_functions />
// <*newFunctionExportedBelowThis overwrite_below snippet="export { {{ name }} } from './{{ relativePath }}'"/>
```

And `unfold` will magically find any exported functions below or at the same level as that index, and export them.
## Case Study: Redux

Redux is a popular, powerful state management system for front-end applications; as developers we enumerate a number of actions which describe the behaviour of the application, and we write types, reducers and action creators as the boilerplate to allow our views to access it.

`unfold` allows us to declare up front "for each of my types I need this code", write the types, and let the code write itself.

```js
// ./types.js
// <newType named_exports>
// </newType>

// ./actions/user.js
import {
// <*newType overwrite snippet='  {{name}},' where="data.name.startsWith('user')">
// </*newType> 
} from './types'

// <*newType where="data.name.startsWith('user')" snippet="export const {{ name }}Action = (data) => ({ type: {{ name }}, data })">
// </*newType>

// ./actions/auth.js
import {
// <*newType overwrite snippet='  {{name}},' where="data.name.startsWith('auth')">
// </*newType> 
} from './types'
// <*newType where="data.name.startsWith('auth')" snippet="export const {{ name }}Action = (data) => ({ type: {{ name }}, data })>
// </*newType>
```

Make a change.

```js
// ./types.js
// <newType named_exports >
export const userCreate = 'userCreate';
export const authLogin = 'authLogin';
// </newType>
```

Hit save and `unfold` writes the rest of the code for you in the way you've described it.

```js
// ./actions/user.js
import {
// <*newType overwrite snippet='  {{name}},' where="data.name.startsWith('user')">
    userCreate
// </*newType> 
} from './types'
// <*newType where="data.name.startsWith('user')" snippet="export const {{ name }}Action = (data) => ({ type: {{ name }}, data })">
export const userCreateAction = (data) => ({ type: userCreate, data });
// </*newType>

// ./actions/auth.js
import {
// <*newType overwrite snippet='  {{name}},' where="data.name.startsWith('user')">
    authLogin
// </*newType> 
} from './types'
// <*newType where="data.name.startsWith('auth')" snippet="export const {{ name }}Action = (data) => ({ type: {{ name }}, data })>
export const authLoginAction = (data) => ({ type: authLogin, data });
// </*newType>
```