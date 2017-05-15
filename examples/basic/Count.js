import Inferno from 'inferno'
import { number, func } from 'prop-types'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'

const countPath = getSandboxedPath('count')

const Count = ({ count = 0, setCount }) => (
  <div>
    <p>Count: {count}</p>

    <button onClick={() => setCount(count - 1)}>Decrement</button>
    <button onClick={() => setCount(count + 1)}>Increment</button>
  </div>
)

Count.propTypes = {
  count: number,
  setCount: func.isRequired,
}

const mapFirebaseToProps = (props, ref) => ({
  count: countPath,
  setCount: count => ref(countPath).set(count),
})

export default connect(mapFirebaseToProps)(Count)
