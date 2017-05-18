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
import { object, element } from 'prop-types';
import invariant from 'invariant';
import { toArray } from './utils';

/**
 * Provider component that initiates the firebase app.
 */
export default class Provider extends Component {
  /**
   * Declare expected prop types.
   *
   * @type {Object}
   */
  static propTypes = {
    firebaseApp: object.isRequired,
    children: element.isRequired,
  };

  /**
   * Declare expected context types.
   *
   * @type {Object}
   */
  static childContextTypes = {
    firebaseApp: object,
  };

  /**
   * Get the child context (firebase instance).
   *
   * @returns {Object}
   */
  getChildContext() {
    const { firebaseApp } = this.props;

    return { firebaseApp };
  }

  /**
   * Render Inferno Component.
   */
  render() {
    let { children } = this.props;

    children = toArray(children);

    invariant(children.length === 1, 'Provider expects only one child.');

    return children[0];
  }
}
