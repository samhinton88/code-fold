# Code Fold

Turn your codebase into an event-driven system.

```
yarn global add code-fold
```
Have you ever thought:
```
I just wish that every time I wrote a function in this file, it would just magically write all the boilerplate for a test and an export, and then import it where I want it to be.
```
`code-fold` could be just the thing you need to explore.

Writing code is often about deciding on a __pattern__ and the time spent __implementing it__ is a function of that pattern, `code-fold` allows you to focus on the pattern, wire your codebase up in the shape of that pattern and let the code write itself.

`code-fold` transforms a codebase into a reactive, event driven system - it sees a change made to code as an event, a message that is emitted to all other parts of the codebase.

A developer can then decide which other parts of the code should change as a result, and `code-fold` will make those changes automatically.


## Usage
### Initialisation
Once installed, navigate in your terminal to the top of your codebase and then run:
```
unfold
```

### Syntax

`code-fold` commands currently live with your code and use a JSX-like syntax, placed inside inline comments.

#### Listeners
Listener folds listen for changes to particular types of syntax in locations you point them at:
```js
// ./some-file.js
// <myFirstFold downstream exported_function />
```
This fold will listen for any __new__ exported functions in its local directory and any lower directories, and emit an event when this occurs.

`code-fold` runs queries on the ASTs for the files in your codebase, and so can distinguish between, e.g. a new function being written and a function being exported. 

The util recognises all AST types that are recognised by `acorn` and `babel`, lowercased. I heartily recommend [AST Explorer](https://astexplorer.net/) for playing around and getting to know the different types.

Types in singular form will return the first match in the ast, but they also support simple pluralisation - add an `'s'` to the end of a given type to return all results which match the query. 

There are also a number of aliased types, e.g. `exported_function`, which are layered on top of the exisiting types. These aliases are an ongoing peice of work.

Current aliases (add an 's' to the end for the plural verion):
```
exported_function
arrow_function_assignment
exported_async_function
```

The `downstream` prop instructs the fold to watch all files in the local directory and any lower directories.

Using a non-self-closing fold instructs it to listen to only what is between its opening and closing tags.
```js
// <myFirstFold exported_function >
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
Save and let `code-fold` write the rest of your code:
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

// <newFunctionExportedBelowThis downstream exported_function />
// <*newFunctionExportedBelowThis overwrite_below snippet="export { {{ name }} } from './{{ relativePath }}'"/>
```

And `code-fold` will magically find any exported functions below or at the same level as that index, and export them.
## Case Study: Redux

Redux is a popular, powerful state management system for front-end applications; as developers we enumerate a number of actions which describe the behaviour of the application, and we write types, reducers and action creators as the boilerplate to allow our views to access it.

`code-fold` allows us to declare up front "for each of my types I need this code", write the types, and let the code write itself.

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

Hit save and `code-fold` writes the rest of the code for you in the way you've described it.

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