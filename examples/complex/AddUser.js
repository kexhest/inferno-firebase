import Inferno from 'inferno'
import Component from 'inferno-component'
import { func } from 'prop-types'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'

const usersPath = getSandboxedPath('complex/users')

class AddUser extends Component {
  constructor(props) {
    super(props)

    this.state = {
      name: '',
    }
  }

  onChange(event) {
    const { name, value } = event.target

    this.setState({
      [name]: value,
    })
  }

  onSubmit(event) {
    event.preventDefault()

    const { name } = this.state

    this.props.addUser(name)
  }

  render() {
    const { name } = this.state

    return (
      <form onSubmit={event => this.onSubmit(event)}>
        <input name="name" value={name} onChange={event => this.onChange(event)} />
        <button type="submit" disabled={!name}>Add user</button>
      </form>
    )
  }
}

AddUser.propTypes = {
  addUser: func.isRequired,
}

const mapFirebaseToProps = (props, ref) => ({
  addUser: name => ref(usersPath).push({ name }),
})

export default connect(mapFirebaseToProps)(AddUser)
