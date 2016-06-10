import React from 'react'
import { connect } from 'react-redux'

const Root = (props) => {
  return (
    <div>Current state:
      <pre>{ JSON.stringify(props, null, '  ') }</pre>
    </div>
  )
}

const select = (state) => state

export default connect(select)(Root)
