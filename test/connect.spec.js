/**
 * inferno-firebase
 *
 * Copyright © 2017 Magnus Bergman <hello@magnus.sexy>. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Inferno, { render, findDOMNode } from 'inferno';
import Component from 'inferno-component';
import firebase from 'firebase/app';
import {
  renderIntoDocument,
  findRenderedVNodeWithType,
} from 'inferno-test-utils';
import expect from 'expect';

import connect from '../src/connect';

import { createMockApp, createMockSnapshot } from './helpers';

Inferno.options.findDOMNodeEnabled = true;

function unmountComponentAtNode(container) {
  render(null, container);
  return true;
}

const renderStub = (
  { mapFirebaseToProps, mergeProps, firebaseApp },
  initialProps
) => {
  class WrappedComponent extends Component {
    // eslint-disable-line inferno/prefer-stateless-function
    render() {
      return <div />;
    }
  }

  const ConnectedComponent = connect(mapFirebaseToProps, mergeProps)(
    WrappedComponent
  );

  class ParentComponent extends Component {
    // eslint-disable-line inferno/no-multi-comp
    state = {
      childProps: initialProps,
    };

    render() {
      return (
        <ConnectedComponent
          {...this.state.childProps}
          ref={ref => (this.connectedComponent = ref)}
          firebaseApp={firebaseApp}
        />
      );
    }
  }

  const vNodeTree = renderIntoDocument(<ParentComponent />);
  // const parentComponent = findRenderedVNodeWithType(vNodeTree, ParentComponent);
  const connectedComponent = findRenderedVNodeWithType(
    vNodeTree,
    ConnectedComponent
  );
  const wrappedComponent = findRenderedVNodeWithType(
    vNodeTree,
    WrappedComponent
  );

  return {
    getSubscriptionState: () =>
      connectedComponent.children.state.subscriptionsState,
    getProps: () => wrappedComponent.children.props,
    getListeners: () => connectedComponent.children.listeners,
    setProps: props => vNodeTree.setState({ childProps: props }),
    unmount: () => unmountComponentAtNode(findDOMNode(vNodeTree).parentNode),
  };
};

describe('connect', () => {
  it('Should throw if no initialized Firebase app instance was found', done => {
    const errorPattern = /No Firebase App/;

    // Default app instance
    expect(() => {
      const defaultApp = firebase.initializeApp({});
      const WrappedComponent = connect()(() => <div />);
      const vNodeTree = renderIntoDocument(<WrappedComponent />);
      const stub = findRenderedVNodeWithType(vNodeTree, WrappedComponent);
      expect(stub.children.firebaseApp).toEqual(defaultApp);

      defaultApp.delete();
    }, errorPattern).toNotThrow();

    // Props
    expect(() => {
      const firebaseApp = createMockApp();
      const WrappedComponent = connect()(props => {
        expect(props.firebaseApp).toEqual(firebaseApp);

        return <div />;
      });

      renderIntoDocument(<WrappedComponent firebaseApp={firebaseApp} />);
    }, errorPattern).toNotThrow();

    done();
  });

  it('Should subscribe to a single path', done => {
    const mockDatabase = {
      ref: path => {
        expect(path).toEqual('foo');

        return mockDatabase;
      },
      on: (event, callback) => {
        expect(event).toEqual('value');
        callback(createMockSnapshot({ bar: 'bar' }));
      },
    };

    const mapFirebaseToProps = () => ({ foo: 'foo' });
    const firebaseApp = createMockApp(mockDatabase);
    const stub = renderStub({ mapFirebaseToProps, firebaseApp });

    setImmediate(() => {
      expect(stub.getSubscriptionState()).toEqual({ foo: { bar: 'bar' } });
      expect(stub.getProps().foo).toEqual({ bar: 'bar' });
      done();
    });
  });

  it('Should return null if a subscribed path does not exist', done => {
    const mockDatabase = {
      ref: path => {
        expect(path).toEqual('foo');

        return mockDatabase;
      },
      on: (event, callback) => {
        expect(event).toEqual('value');
        callback(createMockSnapshot(null));
      },
    };

    const mapFirebaseToProps = () => ({ foo: 'foo' });
    const firebaseApp = createMockApp(mockDatabase);
    const stub = renderStub({ mapFirebaseToProps, firebaseApp });

    setImmediate(() => {
      expect(stub.getSubscriptionState()).toEqual({ foo: null });
      expect(stub.getProps().foo).toEqual(null);
      done();
    });
  });

  it('Should not pass unresolved subscriptions from result of mapFirebaseToProps', done => {
    const mockDatabase = {
      ref: path => {
        expect(path).toEqual('foo');

        return mockDatabase;
      },
      on: event => {
        expect(event).toEqual('value');
      },
    };

    const mapFirebaseToProps = () => ({ foo: 'foo' });
    const firebaseApp = createMockApp(mockDatabase);
    const stub = renderStub({ mapFirebaseToProps, firebaseApp });

    setImmediate(() => {
      expect(stub.getSubscriptionState()).toEqual(null);
      expect(stub.getProps().foo).toEqual(undefined);
      done();
    });
  });

  it('Should subscribe to a query', done => {
    const mockDatabase = {
      ref: path => {
        expect(path).toEqual('bar');

        return mockDatabase;
      },
      startAt: value => {
        expect(value).toEqual(1);

        return mockDatabase;
      },
      endAt: (value, key) => {
        expect(value).toEqual(2);
        expect(key).toEqual('car');

        return mockDatabase;
      },
      on: (event, callback) => {
        expect(event).toEqual('value');
        callback(createMockSnapshot('bar value'));
      },
    };

    const mapFirebaseToProps = () => ({
      bar: {
        path: 'bar',
        startAt: 1,
        endAt: [2, 'car'],
      },
    });

    const firebaseApp = createMockApp(mockDatabase);
    const stub = renderStub({ mapFirebaseToProps, firebaseApp });

    setImmediate(() => {
      expect(stub.getSubscriptionState()).toEqual({ bar: 'bar value' });
      expect(stub.getProps().bar).toEqual('bar value');
      done();
    });
  });

  it('Should correctly order subscription values if orderByChild was passed to query', done => {
    const mockDatabase = {
      ref: path => {
        expect(path).toEqual('bar');

        return mockDatabase;
      },
      orderByChild: value => {
        expect(value).toEqual('order');

        return mockDatabase;
      },
      on: (event, callback) => {
        expect(event).toEqual('value');

        const snapshot = {
          val: () => ({
            alpha: { order: 3 },
            beta: { order: 2 },
            gamma: { order: 1 },
          }),

          forEach: iterator => {
            iterator({ key: 'gamma', val: () => ({ order: 1 }) });
            iterator({ key: 'beta', val: () => ({ order: 2 }) });
            iterator({ key: 'alpha', val: () => ({ order: 3 }) });
          },
        };

        callback(snapshot);
      },
    };

    const mapFirebaseToProps = () => ({
      bar: {
        path: 'bar',
        orderByChild: 'order',
      },
    });

    const firebaseApp = createMockApp(mockDatabase);
    const stub = renderStub({ mapFirebaseToProps, firebaseApp });

    setImmediate(() => {
      expect(Object.keys(stub.getSubscriptionState().bar)).toEqual([
        'gamma',
        'beta',
        'alpha',
      ]);
      expect(Object.keys(stub.getProps().bar)).toEqual([
        'gamma',
        'beta',
        'alpha',
      ]);
      done();
    });
  });

  it('Should not subscribe to functions', done => {
    const mapFirebaseToProps = (props, ref) => ({
      foo: 'foo',
      addFoo: name => ref('foo').push(name),
    });

    const firebaseApp = createMockApp();
    const stub = renderStub({ mapFirebaseToProps, firebaseApp });

    setImmediate(() => {
      expect(stub.getSubscriptionState()).toEqual({ foo: 'foo value' });
      expect(stub.getProps().foo).toEqual('foo value');
      expect(typeof stub.getProps().addFoo).toEqual('function');
      done();
    });
  });

  it('Should unsubscribe when component unmounts', done => {
    const mockDatabase = {
      ref: path => {
        expect(path).toEqual('baz');

        return mockDatabase;
      },
      on: (event, callback) => {
        expect(event).toEqual('value');
        callback(createMockSnapshot('baz value'));
      },
      off: event => {
        expect(event).toEqual('value');
      },
    };

    const mapFirebaseToProps = () => ({ baz: 'baz' });
    const firebaseApp = createMockApp(mockDatabase);
    const stub = renderStub({ mapFirebaseToProps, firebaseApp });

    expect(stub.getListeners().baz).toNotEqual(undefined);
    expect(stub.unmount()).toEqual(true);
    expect(stub.getListeners().baz).toEqual(undefined);
    done();
  });

  it('Should pass props, ref and firebaseApp to mapFirebaseToProps', done => {
    const mapFirebaseToProps = (props, ref, firebaseApp) => {
      expect(props.foo).toEqual('foo prop');
      expect(typeof firebaseApp.database).toEqual('function');
      expect(typeof ref).toEqual('function');

      return { foo: 'foo' };
    };

    const firebaseApp = createMockApp();
    const stub = renderStub(
      { mapFirebaseToProps, firebaseApp },
      { foo: 'foo prop' }
    );

    setImmediate(() => {
      expect(stub.getProps().foo).toEqual('foo value');
      done();
    });
  });

  it('Should update subscriptions when props change', done => {
    const mapFirebaseToProps = props => ({ foo: props.foo, bar: props.bar });
    const firebaseApp = createMockApp();
    const stub = renderStub({ mapFirebaseToProps, firebaseApp });

    const first = () =>
      new Promise(resolve => {
        stub.setProps({ foo: 'foo' });
        setImmediate(() => {
          expect(stub.getProps().foo).toEqual('foo value');
          expect(stub.getProps().bar).toEqual(undefined);
          expect(stub.getListeners().foo.path).toEqual('foo');
          expect(stub.getListeners().bar).toEqual(undefined);
          resolve();
        });
      });

    const second = () =>
      new Promise(resolve => {
        stub.setProps({ foo: 'foo', bar: 'bar' });
        setImmediate(() => {
          expect(stub.getProps().foo).toEqual('foo value');
          expect(stub.getProps().bar).toEqual('bar value');
          expect(stub.getListeners().foo.path).toEqual('foo');
          expect(stub.getListeners().bar.path).toEqual('bar');
          resolve();
        });
      });

    const third = () =>
      new Promise(resolve => {
        stub.setProps({ foo: 'foo', bar: 'baz' });
        setImmediate(() => {
          expect(stub.getProps().foo).toEqual('foo value');
          expect(stub.getProps().bar).toEqual('baz value');
          expect(stub.getListeners().foo.path).toEqual('foo');
          expect(stub.getListeners().bar.path).toEqual('baz');
          resolve();
        });
      });

    const fourth = () =>
      new Promise(resolve => {
        stub.setProps({ bar: 'baz' });
        setImmediate(() => {
          expect(stub.getProps().foo).toEqual(undefined);
          expect(stub.getProps().bar).toEqual('baz value');
          expect(stub.getListeners().foo).toEqual(undefined);
          expect(stub.getListeners().bar.path).toEqual('baz');
          resolve();
        });
      });

    Promise.all([first, second, third, fourth]).then(() => {
      done();
    });
  });

  it('Should use custom mergeProps function if provided', done => {
    const mapFirebaseToProps = props => ({ foo: props.foo });
    const mergeProps = () => ({ bar: 'bar merge props' });

    const firebaseApp = createMockApp();
    const stub = renderStub(
      { mapFirebaseToProps, mergeProps, firebaseApp },
      { foo: 'foo prop' }
    );

    expect(stub.getProps()).toEqual({ bar: 'bar merge props' });
    done();
  });
});
