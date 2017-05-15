import Inferno from 'inferno'
import { string, object } from 'prop-types'
import { connect } from '../../src'
import { getSandboxedPath } from '../common'
import TaskSummary from './TaskSummary'

const tasksPath = getSandboxedPath('complex/tasks')

const TaskListItem = ({ taskId }) => (
  <li><TaskSummary taskId={taskId} /></li>
)

TaskListItem.propTypes = {
  taskId: string.isRequired,
}

const TaskList = ({ tasks = {} }) => (
  <div>
    <ul>
      {Object.keys(tasks).map(key => <TaskListItem key={key} taskId={key} />)}
    </ul>
  </div>
)

TaskList.propTypes = {
  tasks: object,
}

const mapFirebaseToProps = ({ outside }) => {
  const query = {
    path: tasksPath,
  }

  if (outside) {
    query.orderByChild = 'outside'
    query.equalTo = true
  }

  return {
    tasks: query,
  }
}

export default connect(mapFirebaseToProps)(TaskList)
