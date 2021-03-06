import React from 'react'
import { throttle } from 'lodash'
import { isAtBottom } from '../util/scrolling'
const { func, number, string } = React.PropTypes

export default class ScrollListener extends React.Component {
  static propTypes = {
    onBottom: func.isRequired,
    elementId: string,
    padding: number
  }

  handleScrollEvents = throttle(event => {
    event.preventDefault()
    let { onBottom, padding } = this.props
    if (isNaN(padding)) padding = 250
    if (onBottom && isAtBottom(padding, this.element())) onBottom()
  }, 100)

  element () {
    const { elementId } = this.props
    return elementId ? document.getElementById(elementId) : window
  }

  componentDidMount () {
    this.element().addEventListener('scroll', this.handleScrollEvents)
  }

  componentWillUnmount () {
    this.element().removeEventListener('scroll', this.handleScrollEvents)
  }

  render () {
    return null
  }
}
