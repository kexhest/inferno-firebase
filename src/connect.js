/**
 * inferno-firebase
 *
 * Copyright © 2017 Magnus Bergman <hello@magnus.sexy>. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import Inferno from 'inferno';
import createElement from 'inferno-create-element';
import Component from 'inferno-component';
import { shape, func } from 'prop-types';
import invariant from 'invariant';
import firebase from 'firebase/app';
import 'firebase/database';
import {
  createQueryRef,
  getDisplayName,
  mapValues,
  mapSnapshotToValue,
  pickBy,
} from './utils';

/**
 * Merge props.
 *
 * @param   {Object} ownProps
 * @param   {Object} firebaseProps
 *
 * @returns {Object}
 */
const defaultMergeProps = (ownProps, firebaseProps) => ({
  ...ownProps,
  ...firebaseProps,
});

/**
 * Format firebase subscription paths.
 *
 * @param   {Object} subscriptions
 *
 * @returns {Object}
 */
const mapSubscriptionsToQueries = subscriptions =>
  mapValues(
    subscriptions,
    value => (typeof value === 'string' ? { path: value } : value)
  );

/**
 * Default props.
 *
 * @param   {Object} props
 * @param   {Object} ref
 * @param   {Object} firebaseApp
 *
 * @returns {Object}
 */
const defaultMapFirebaseToProps = (props, ref, firebaseApp) => ({
  firebaseApp,
});

/**
 * Connect function that returns a higher order component that maps firebase subscriptions
 * to component state that are passed down to the provided components props.
 *
 * @param   {Object} [mapFirebaseToProps=defaultMapFirebaseToProps]
 * @param   {Object} [mergeProps=defaultMergeProps]
 *
 * @returns {function}
 */
export default (
  mapFirebaseToProps = defaultMapFirebaseToProps,
  mergeProps = defaultMergeProps
) => {
  const mapFirebase = typeof mapFirebaseToProps === 'function'
    ? mapFirebaseToProps
    : () => mapFirebaseToProps;

  const computeSubscriptions = (props, ref, firebaseApp) => {
    const firebaseProps = mapFirebase(props, ref, firebaseApp);
    const subscriptions = pickBy(
      firebaseProps,
      prop => typeof prop === 'string' || (prop && prop.path)
    );

    invariant(
      typeof subscriptions === 'object',
      '`mapFirebaseToProps` must return an object. Instead received %s.',
      subscriptions
    );

    return subscriptions;
  };

  return WrappedComponent => {
    class FirebaseConnect extends Component {
      /**
       * Create FirebaseConnect.
       *
       * @param  {Object} props
       * @param  {Object} context
       */
      constructor(props, context) {
        super(props, context);

        this.firebaseApp =
          props.firebaseApp || context.firebaseApp || firebase.app();
        this.ref = path => this.firebaseApp.database().ref(path);
        this.state = {
          subscriptionsState: null,
        };
      }

      /**
       * Bind subscriptions when the component is mounted.
       */
      componentDidMount() {
        const subscriptions = computeSubscriptions(
          this.props,
          this.ref,
          this.firebaseApp
        );

        this.mounted = true;
        this.subscribe(subscriptions);
      }

      /**
       * Recompute subscriptions when paths are updated.
       *
       * @param {Object}
       */
      componentWillReceiveProps(nextProps) {
        const subscriptions = computeSubscriptions(
          this.props,
          this.ref,
          this.firebaseApp
        );

        const nextSubscriptions = computeSubscriptions(
          nextProps,
          this.ref,
          this.firebaseApp
        );

        const addedSubscriptions = pickBy(
          nextSubscriptions,
          (path, key) => !subscriptions[key]
        );

        const removedSubscriptions = pickBy(
          subscriptions,
          (path, key) => !nextSubscriptions[key]
        );

        const changedSubscriptions = pickBy(
          nextSubscriptions,
          (path, key) => subscriptions[key] && subscriptions[key] !== path
        );

        this.unsubscribe({ ...removedSubscriptions, ...changedSubscriptions });
        this.subscribe({ ...addedSubscriptions, ...changedSubscriptions });
      }

      /**
       * Remove subscriptions when the component is being unmounted.
       */
      componentWillUnmount() {
        this.mounted = false;

        if (this.listeners) {
          this.unsubscribe(this.listeners);
        }
      }

      /**
       * Subscribe to updates from firebase as specified paths.
       *
       * @param {Object} subscriptions
       */
      subscribe(subscriptions) {
        if (Object.keys(subscriptions).length < 1) return;

        const queries = mapSubscriptionsToQueries(subscriptions);
        const nextListeners = mapValues(queries, ({ path, ...query }, key) => {
          const containsOrderBy = Object.keys(query).some(queryKey =>
            queryKey.startsWith('orderBy')
          );

          const subscriptionRef = createQueryRef(this.ref(path), query);

          const update = snapshot => {
            if (this.mounted) {
              const value = containsOrderBy
                ? mapSnapshotToValue(snapshot)
                : snapshot.val();

              this.setState(prevState => ({
                subscriptionsState: {
                  ...prevState.subscriptionsState,
                  [key]: value,
                },
              }));
            }
          };

          subscriptionRef.on('value', update);

          return {
            path,
            unsubscribe: () => subscriptionRef.off('value', update),
          };
        });

        this.listeners = { ...this.listeners, ...nextListeners };
      }

      /**
       * Unsubscribe from firebase updates.
       *
       * @param {Object} subscriptions
       */
      unsubscribe(subscriptions) {
        if (Object.keys(subscriptions).length < 1) {
          return;
        }

        const nextListeners = { ...this.listeners };
        const nextSubscriptionsState = { ...this.state.subscriptionsState };

        Object.keys(subscriptions).forEach(key => {
          const subscription = this.listeners[key];
          subscription.unsubscribe();

          delete nextListeners[key];
          delete nextSubscriptionsState[key];
        });

        this.listeners = nextListeners;

        if (this.mounted) {
          this.setState({ subscriptionsState: nextSubscriptionsState });
        }
      }

      /**
       * Render Inferno Component.
       */
      render() {
        const firebaseProps = mapFirebase(
          this.props,
          this.ref,
          this.firebaseApp
        );
        const actionProps = pickBy(
          firebaseProps,
          prop => typeof prop === 'function'
        );
        const subscriptionProps = this.state.subscriptionsState;
        const props = mergeProps(this.props, {
          ...actionProps,
          ...subscriptionProps,
        });

        return createElement(WrappedComponent, props);
      }
    }

    FirebaseConnect.WrappedComponent = WrappedComponent;
    FirebaseConnect.defaultProps = Component.defaultProps;
    FirebaseConnect.displayName = `FirebaseConnect(${getDisplayName(WrappedComponent)})`;
    FirebaseConnect.contextTypes = FirebaseConnect.propTypes = {
      firebaseApp: shape({
        database: func.isRequired, // eslint-disable-line react/no-unused-prop-types
      }),
    };

    return FirebaseConnect;
  };
};
