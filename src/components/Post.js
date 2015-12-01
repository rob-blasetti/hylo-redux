import React from 'react'
import { Link } from 'react-router'
import { filter, find, isEmpty, pick } from 'lodash'
const { array, bool, func, object } = React.PropTypes
import cx from 'classnames'
import { humanDate, present, sanitize, timeRange, timeRangeFull } from '../util/text'
import truncate from 'html-truncate'
import A from './A'
import Avatar from './Avatar'
import Comment from './Comment'
import CommentForm from './CommentForm'
import PostEditor from './PostEditor'
import { connect } from 'react-redux'
import { fetchComments, createComment, startPostEdit } from '../actions'

const spacer = <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>

@connect(({ commentsByPost, people, postsInProgress }, { post }) => ({
  comments: commentsByPost[post.id],
  currentUser: people.current,
  editing: !!postsInProgress[post.id]
}))
export default class Post extends React.Component {
  static propTypes = {
    post: object,
    onExpand: func,
    expanded: bool,
    commentsExpanded: bool,
    comments: array,
    dispatch: func,
    commentingDisabled: bool,
    currentUser: object,
    editing: bool
  }

  constructor (props) {
    super(props)
    this.state = {commentsExpanded: props.commentsExpanded}
  }

  expand = () => {
    let {expanded, onExpand, post} = this.props
    if (!expanded) onExpand(post.id)
  }

  toggleComments = event => {
    event.stopPropagation()
    event.preventDefault()
    this.expand()

    let { post, comments } = this.props
    if (!comments) this.props.dispatch(fetchComments(post.id))
    this.setState({commentsExpanded: !this.state.commentsExpanded})
  }

  edit = () => {
    let { dispatch, post } = this.props
    dispatch(startPostEdit(post))
  }

  render () {
    let { post, expanded, currentUser, editing } = this.props
    if (editing) return this.renderEdit()

    let image = find(post.media, m => m.type === 'image')
    var style = image ? {backgroundImage: `url(${image.url})`} : {}
    var classes = cx('post', post.type, {expanded: expanded, image: !!image})

    var title = post.name
    var person = post.user
    if (post.type === 'welcome') {
      person = post.relatedUsers[0]
      title = `${person.name} joined ${post.communities[0].name}. Welcome them!`
    }

    const now = new Date()
    const createdAt = new Date(post.created_at)
    const updatedAt = new Date(post.updated_at)
    const shouldShowUpdatedAt = (now - updatedAt) < (now - createdAt) * 0.8

    let isEvent = post.type === 'event'
    if (isEvent) {
      let start = new Date(post.start_time)
      let end = post.end_time && new Date(post.end_time)
      var eventTime = timeRange(start, end)
      var eventTimeFull = timeRangeFull(start, end)
    }

    let canEdit = (currentUser && currentUser.id === person.id)

    return <div className={classes} onClick={this.expand}>
      <div className='header'>
        <Avatar person={person}/>

        <Dropdown toggleContent={<i className='icon-down'></i>}>
          {canEdit && <li><a onClick={this.edit}>Edit</a></li>}
          <li>
            <a onClick={() => window.alert('TODO')}>Report objectionable content</a>
          </li>
        </Dropdown>

        <span className='name'>{person.name}</span>
        <div className='meta'>
          <A to={`/p/${post.id}`}>{humanDate(createdAt)}</A>
          {shouldShowUpdatedAt && <span>
            {spacer}updated {humanDate(updatedAt)}
          </span>}
          {spacer}
          {post.votes} ♡
          {spacer}
          <a onClick={this.toggleComments} href='#'>
            {post.numComments} comment{post.numComments === 1 ? '' : 's'}
          </a>
          {post.public && <span>
            {spacer}Public
          </span>}
        </div>
      </div>

      <p className='title'>{title}</p>

      {isEvent && <p title={eventTimeFull} className='event-time'>
        <i className='glyphicon glyphicon-time'></i>
        {eventTime}
      </p>}

      {image && <div className='image' style={style}></div>}
      {expanded && <ExpandedPostDetails
        onCommentCreate={text => this.props.dispatch(createComment(post.id, text))}
        commentsExpanded={this.state.commentsExpanded}
        {...{post, image}}
        {...pick(this.props, 'comments', 'commentingDisabled')}/>}
    </div>
  }

  renderEdit () {
    let { post } = this.props
    return <PostEditor post={post} expanded={true}/>
  }
}

class Dropdown extends React.Component {
  constructor (props) {
    super(props)
    this.state = {}
  }

  static propTypes = {
    children: array,
    toggleContent: object
  }

  toggleActive = event => {
    this.setState({active: !this.state.active})
    event.stopPropagation()
    event.preventDefault()
  }

  render () {
    return <div className={cx('dropdown', 'post-menu', {active: this.state.active})}>
      <a className='dropdown-toggle' onClick={this.toggleActive}>{this.props.toggleContent}</a>
      <ul className='dropdown-menu dropdown-menu-right'>
        {this.props.children}
      </ul>
    </div>
  }
}

const ExpandedPostDetails = props => {
  let {
    post, image, comments, commentsExpanded,
    commentingDisabled, onCommentCreate
  } = props
  let description = present(sanitize(post.description))
  let attachments = filter(post.media, m => m.type !== 'image')
  if (!comments) comments = []

  return <div>
    {image && <img src={image.url} className='full-image post-section'/>}

    {description && <div className='details post-section'
      dangerouslySetInnerHTML={{__html: description}}/>}

    {!isEmpty(attachments) && <div className='post-section'>
      {attachments.map((file, i) =>
        <a key={i} className='attachment' href={file.url} target='_blank' title={file.name}>
          <img src={file.thumbnail_url}/>
          {truncate(file.name, 30)}
        </a>)}
    </div>}

    <div className='meta'>
      <ul className='tags'>
        <li className={cx('tag', 'post-type', post.type)}>{post.type}</li>
        {post.communities.map(c => <li key={c.id} className='tag'>
          <Link to={`/c/${c.slug}`} key={c.id}>{c.name}</Link>
        </li>)}
      </ul>
    </div>

    {commentsExpanded && <div>
      {comments.map(c => <Comment comment={c} key={c.id}/>)}
      {!commentingDisabled && <CommentForm onCreate={onCommentCreate}/>}
    </div>}
  </div>
}
