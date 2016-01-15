import React from 'react'
import { connect } from 'react-redux'
import { prefetch } from 'react-fetcher'
import { fetchActivity, markAllActivitiesRead } from '../actions'
import { values, sortBy, isEmpty, contains } from 'lodash'
import cx from 'classnames'
import ScrollListener from '../components/ScrollListener'
import A from '../components/A'
import truncate from 'html-truncate'
import { present } from '../util/text'
const { array, bool, func, number } = React.PropTypes

@prefetch(({ dispatch }) => dispatch(fetchActivity(5, 0)))
@connect(state => ({
  activities: sortBy(values(state.activities), ['created_at']).reverse(),
  total: Number(state.totalActivities)
}))
export default class Notifications extends React.Component {

  static propTypes = {
    activities: array,
    pending: bool,
    dispatch: func,
    total: number
  }

  loadMore = () => {
    let { total, activities, dispatch, pending } = this.props
    let offset = activities.length
    if (!pending && offset < total) {
      dispatch(fetchActivity(5, offset))
    }
  }

  markAllRead = () => {
    let { dispatch } = this.props
    dispatch(markAllActivitiesRead())
  }

  visit = activity => {
    console.log('Visit: ', activity)
  }

  thank = activity => {
    console.log('Thank: ', activity)
  }

  render () {
    let { activities, total, pending } = this.props

    return <div>
      <h2>Notifications</h2>
      <p>Activities length: {activities.length}</p>
      <p>total: {total}</p>
      <p>pending: {pending}</p>
      <div className='activities'>
        <div className='buttons'>
          <button onClick={this.markAllRead}>
            Mark all as read
          </button>
        </div>
        {activities.map(activity => <Activity key={activity.id} activity={activity} visit={this.visit} thank={this.thank}/>)}
        <ScrollListener onBottom={this.loadMore}/>
      </div>
    </div>
  }
}

const Activity = props => {
  let { activity, visit, thank } = props
  let { actor, post } = activity

  console.log('ID -> ', activity.id)

  let bodyText = activity => {
    if (contains(['followAdd', 'follow', 'unfollow'], activity.action)) {
      return ''
    }
    let text = activity.comment.comment_text || activity.post.description
    return present(text, {communityId: activity.post.communities[0].id, maxlength: 200})
  }(activity)

  let actionText = activity => {
    switch (activity.action) {
      case 'mention':
        if (isEmpty(activity.comment)) {
          return 'mentioned you in their ' + activity.post.type
        } else {
          return 'mentioned you in a comment on'
        }
        break
      case 'comment':
        return 'commented on'
      case 'followAdd':
        return 'added you to the ' + activity.post.type
      case 'follow':
        return 'followed'
      case 'unfollow':
        return 'stopped following'
    }
  }(activity) + ' '

  let postName = post.type === 'welcome'
  ? `${post.relatedUsers[0].name}'s' welcoming post`
  : truncate(post.name, 140)

  let timeAgo = '1 month ago'
  let isThanked = false
  let actorFirstName = 'Julio'

  return <div key={activity.id} className={cx('activity', {'unread': activity.unread})}>
    <div>
      <A to={`/u/${actor.id}`}>
        <div className='avatar' style={{backgroundImage: `url(${actor.avatar_url})`}} />
      </A>
    </div>
    <div className='content'>
      <div className='title'>
        {actor.name} {actionText}
        <a onClick={() => visit(activity)}>
          {postName}
        </a>
      </div>

      {bodyText && <div className='body-text' dangerouslySetInnerHTML={{__html: bodyText}} />}

      <div className='controls'>
        {timeAgo}
        {!isEmpty(activity.comment) && <span>
          &nbsp;&nbsp;•&nbsp;&nbsp;
          <span>
            {isThanked
            ? <a tooltip='click to take back your "Thank You"' tooltip-popup-delay='500' onClick={() => thank(activity.comment)}>
                  You thanked <span>{actorFirstName}</span>
                </a>
            : <a tooltip='click to give thanks for this comment' tooltip-popup-delay='500' onClick={() => thank(activity.comment)}>Say "Thank you"</a>}
            &nbsp;&nbsp;•&nbsp;&nbsp;
          </span>
          <a onClick={() => visit(activity)}>Reply</a>
        </span>}
      </div>
    </div>
  </div>
}
