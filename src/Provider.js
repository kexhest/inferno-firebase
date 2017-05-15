import Inferno from 'inferno';
import Component from 'inferno-component'
import { object, element } from 'prop-types'

function toArray(a) {
  if (a === null || a === void 0) {
    return []
  }

  return Array.isArray(a) ? a : [].concat(a)
}

export default class Provider extends Component {
  static propTypes = {
    firebaseApp: object.isRequired,
    children: element.isRequired,
  }

  static childContextTypes = {
    firebaseApp: object,
  }

  getChildContext() {
    const { firebaseApp } = this.props

    return { firebaseApp }
  }

  render() {
    let { children } = this.props

    children = toArray(children)

    if (children.length !== 1) {
			throw new Error('Provider expects only one child.')
		}

    return children[0]
  }
}
