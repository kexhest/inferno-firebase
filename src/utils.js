/**
 * inferno-firebase
 *
 * Copyright © 2017 Magnus Bergman <hello@magnus.sexy>. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const toArray = arr => {
  if (arr === null || arr === void 0) {
    return [];
  }

  return Array.isArray(arr) ? arr : [].concat(arr);
};

export const mapValues = (object, iteratee) => {
  const result = {};

  Object.keys(object).forEach(
    key => (result[key] = iteratee(object[key], key, object))
  );

  return result;
};

export const pickBy = (object, predicate) => {
  const result = {};

  Object.keys(object).forEach(key => {
    const value = object[key];

    if (predicate(value, key)) {
      result[key] = value;
    }
  });

  return result;
};

export const createQueryRef = (ref, query) =>
  Object.keys(query).reduce((queryRef, key) => {
    const value = query[key];
    const args = Array.isArray(value) ? value : [value];

    return queryRef[key](...args);
  }, ref);

export const getDisplayName = Component =>
  Component.displayName || Component.name || 'Component';

export const mapSnapshotToValue = snapshot => {
  const result = {};

  snapshot.forEach(child => {
    result[child.key] = child.val();
  });

  return result;
};
