import qs from 'querystring'
import { some } from 'lodash'
import { CLICKTHROUGH, trackEvent } from '../util/analytics'

export default function () {
  let params = qs.parse(window.location.search.replace(/^\?/, ''))
  let { ctt, cti, ...otherParams } = params
  if (!ctt) return

  let path = window.location.pathname

  trackEvent(CLICKTHROUGH, {path, type: ctt, id: cti})

  // remove the params to prevent double-counting events on page reload
  let search = some(otherParams) ? '?' + qs.stringify(otherParams) : ''
  window.history.replaceState({}, 'Hylo', path + search)
}
