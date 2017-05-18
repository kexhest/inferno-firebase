# [inferno-firebase](https://github.com/magnus-bergman/inferno-firebase)

[![NPM version](http://img.shields.io/npm/v/inferno-firebase.svg?style=flat-square)](https://www.npmjs.com/package/inferno-firebase)
[![NPM downloads](http://img.shields.io/npm/dm/inferno-firebase.svg?style=flat-square)](https://www.npmjs.com/package/inferno-firebase)
[![Build Status](http://img.shields.io/travis/magnus-bergman/inferno-firebase/master.svg?style=flat-square)](https://travis-ci.org/magnus-bergman/inferno-firebase)
[![Coverage Status](https://img.shields.io/coveralls/magnus-bergman/inferno-firebase.svg?style=flat-square)](https://coveralls.io/magnus-bergman/inferno-firebase)
[![Dependency Status](http://img.shields.io/david/magnus-bergman/inferno-firebase.svg?style=flat-square)](https://david-dm.org/magnus-bergman/inferno-firebase)

> Inferno bindings for [Firebase](https://firebase.google.com).

## Installation

```
npm install --save inferno-firebase
```

Inferno Firebase requires **[Inferno 3.1.2](https://github.com/infernojs/inferno) and [Firebase 3](https://www.npmjs.com/package/firebase) or later.**

## Example

```js
import Inferno from 'inferno'
import firebase from 'firebase'
import { connect } from 'inferno-firebase'

firebase.initializeApp({
  databaseURL: 'https://inferno-firebase-sandbox.firebaseio.com'
})

const Counter = ({ value, setValue }) => (
  <div>
    <button onClick={() => setValue(value - 1)}>-</button>
    <span>{value}</span>
    <button onClick={() => setValue(value + 1)}>+</button>
  </div>
)

export default connect((props, ref) => ({
  value: 'counterValue',
  setValue: value => ref('counterValue').set(value)
}))(Counter)
```

## Usage

### `connect([mapFirebaseToProps], [mergeProps])`

Connects a Inferno component to a Firebase App reference.

It does not modify the component class passed to it. Instead, it *returns* a new, connected component class, for you to use.

#### Arguments

* [`mapFirebaseToProps(props, ref, firebaseApp): subscriptions`] \(*Object or Function*): Its result, or the argument itself must be a plain object. Each value must either be a path to a location in your database, a query object or a function. If you omit it, the default implementation just passes `firebaseApp` as a prop to your component.


* [`mergeProps(ownProps, firebaseProps): props`] \(*Function*): If specified, it is passed the parent `props` and current subscription state merged with the result of `mapFirebaseToProps()`. The plain object you return from it will be passed as props to the wrapped component. If you omit it, `Object.assign({}, ownProps, firebaseProps)` is used by default.

#### Returns

A Inferno component class that passes subscriptions and actions as props to your component according to the specified options.

> Note: "actions" are any function values returned by `mapFirebaseToProps()` which are typically used to modify data in Firebase.

##### Static Properties

* `WrappedComponent` *(Component)*: The original component class passed to `connect()`.

#### Examples

> Runnable examples can be found in the [examples folder](examples/).

##### Pass `todos` as a prop

  > Note: The value of `todos` is the path to your data in Firebase. This is equivalent to `firebase.database().ref('todo')`.

```js
const mapFirebaseToProps = {
  todos: 'todos'
}

export default connect(mapFirebaseToProps)(TodoApp)
```

#####  Pass `todos` and a function that adds a new todo (`addTodo`) as props

```js
const mapFirebaseToProps = (props, ref) => ({
  todos: 'todos',
  addTodo: todo => ref('todos').push(todo)
})

export default connect(mapFirebaseToProps)(TodoApp)
```

#####  Pass `todos`, `completedTodos`, a function that completes a todo (`completeTodo`) and one that logs in as props

```js
const mapFirebaseToProps = (props, ref, { auth }) => ({
  todos: 'todos',
  completedTodos: {
    path: 'todos',
    orderByChild: 'completed',
    equalTo: true
  },
  completeTodo = id => ref(`todos/${id}/completed`).set(true),
  login: (email, password) => auth().signInWithEmailAndPassword(email, password)
})

export default connect(mapFirebaseToProps)(TodoApp)
```

### `<Provider firebaseApp>`

By default `connect()` will use the [default Firebase App](https://firebase.google.com/docs/reference/js/firebase.app). If you have multiple Firebase App references in your application you may use this to specify the Firebase App reference available to `connect()` calls in the component hierarchy below.

If you *really* need to, you can manually pass `firebaseApp` as a prop to every `connect()`ed component, but we only recommend to do this for stubbing `firebaseApp` in unit tests, or in non-fully-Inferno codebases. Normally, you should just use `<Provider>`.

#### Props

* `firebaseApp` (*[App](https://firebase.google.com/docs/reference/js/firebase.app.App)*): A Firebase App reference.
* `children` (*InfernoElement*): The root of your component hierarchy.

#### Example

```js
import { Provider } from 'inferno-firebase'
import { initializeApp } from 'firebase'

const firebaseApp = initializeApp({
  databaseURL: 'https://my-firebase.firebaseio.com'
})

Inferno.render(
  <Provider firebaseApp={firebaseApp}>
    <MyRootComponent />
  </Provider>,
  rootEl
)
```

### License

MIT © 2016 Magnus Bergman <hello@magnus.sexy> (https://magnus.sexy/)

## Acknowledgements

[`react-firebase`](https://github.com/unfold/react-firebase) which this library is heavily inspired by.
