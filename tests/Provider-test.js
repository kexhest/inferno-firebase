/* eslint-disable import/no-extraneous-dependencies */
import 'jsdom-global/register'
import Inferno from 'inferno'
import Component from 'inferno-component'
import test from 'tape'
import { findRenderedVNodeWithType, renderIntoDocument } from 'inferno-test-utils'
import connect from '../src/connect'
import Provider from '../src/Provider'
import { createMockApp } from './helpers'

test('Should use firebaseApp from context if provided', assert => {
  class Passthrough extends Component { // eslint-disable-line inferno/prefer-stateless-function
    render() {
      return <div />
    }
  }

  const firebaseApp = createMockApp()
  const WrappedComponent = connect()(Passthrough)
  const container = renderIntoDocument(
    <Provider firebaseApp={firebaseApp}>
      <WrappedComponent />
    </Provider>
  )

  const stub = findRenderedVNodeWithType(container, WrappedComponent).children

  assert.equal(stub.firebaseApp, firebaseApp)
  assert.end()
})
