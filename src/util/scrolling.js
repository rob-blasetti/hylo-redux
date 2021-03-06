import { has } from 'lodash'

const bottomScrollPosition = () =>
  document.body.scrollHeight - window.innerHeight

export const viewportTop = () =>
  has(window, 'pageYOffset')
    ? window.pageYOffset
    : document.documentElement.clientHeight
      ? document.documentElement.scrollTop
      : document.body.scrollTop

export const isAtBottom = (offset, element) =>
  (!element || element === window)
    ? viewportTop() >= bottomScrollPosition() - offset
    : element.scrollTop >= element.scrollHeight - element.offsetHeight - offset

export function scrollToBottom () {
  return window.scrollTo(0, bottomScrollPosition())
}

export function changeViewportTop (delta) {
  return window.scrollTo(0, viewportTop() + delta)
}

export function position (element) {
  let x = 0
  let y = 0

  while (element) {
    x += element.offsetLeft + element.clientLeft
    y += element.offsetTop + element.clientTop
    element = element.offsetParent
  }

  return {x, y}
}

export function positionInViewport (element) {
  let x = 0
  let y = 0

  while (element) {
    x += element.offsetLeft - element.scrollLeft + element.clientLeft
    y += element.offsetTop - element.scrollTop + element.clientTop
    element = element.offsetParent
  }

  return {x, y}
}

export function scrollToAnchor (anchor, padding = 0) {
  let element = document.querySelector(`[name='${anchor}']`)
  return window.scrollTo(0, position(element).y - padding)
}
