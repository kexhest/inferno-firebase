/**
 * inferno-firebase
 *
 * Copyright © 2017 Magnus Bergman <hello@magnus.sexy>. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Inferno from 'inferno';
import Component from 'inferno-component';
import {
  findRenderedVNodeWithType,
  renderIntoDocument,
} from 'inferno-test-utils';
import expect from 'expect';

import connect from '../src/connect';
import Provider from '../src/Provider';

import { createMockApp } from './helpers';

describe('Provider', () => {
  it('Should use firebaseApp from context if provided', done => {
    class Passthrough extends Component {
      render() {
        return <div />;
      }
    }

    const firebaseApp = createMockApp();
    const WrappedComponent = connect()(Passthrough);
    const container = renderIntoDocument(
      <Provider firebaseApp={firebaseApp}>
        <WrappedComponent />
      </Provider>
    );

    const stub = findRenderedVNodeWithType(container, WrappedComponent)
      .children;

    expect(stub.firebaseApp).toEqual(firebaseApp);
    done();
  });
});
