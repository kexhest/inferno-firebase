import Inferno from 'inferno'
import { string, bool } from 'prop-types'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'

const tasksPath = getSandboxedPath('complex/tasks')

const TaskSummary = ({ name, description, outside }) => (
  <span>{name} - {description} - {outside ? '🌞' : '🏨'}</span>
)

TaskSummary.propTypes = {
  name: string,
  description: string,
  outside: bool,
}

const mapFirebaseToProps = ({ taskId }) => ({
  name: `${tasksPath}/${taskId}/name`,
  description: `${tasksPath}/${taskId}/description`,
  outside: `${tasksPath}/${taskId}/outside`,
})

export default connect(mapFirebaseToProps)(TaskSummary)
