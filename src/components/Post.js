import React from 'react'
import { filter, first, includes, isEmpty, map, some, sortBy, get } from 'lodash'
import { find } from 'lodash/fp'
const { array, bool, func, object } = React.PropTypes
import cx from 'classnames'
import {
  humanDate, nonbreaking, present, sanitize, textLength, appendInP
} from '../util/text'
import { linkifyHashtags } from '../util/linkify'
import { tagUrl } from '../routes'
import truncate from 'html-truncate'
import A from './A'
import Avatar from './Avatar'
import Dropdown from './Dropdown'
import { ClickCatchingSpan } from './ClickCatcher'
import { handleMouseOver } from './TagPopover'
import Comment from './Comment'
import CommentForm from './CommentForm'
import Icon from './Icon'
import LinkedPersonSentence from './LinkedPersonSentence'
import LinkPreview from './LinkPreview'
import { scrollToAnchor } from '../util/scrolling'
import { connect } from 'react-redux'
import { compose } from 'redux'
import {
  fetchComments, followPost, navigate, notify, removePost, startPostEdit,
  voteOnPost, pinPost
} from '../actions'
import { same } from '../models'
import { getComments, getCommunities, isPinned } from '../models/post'
import { getCurrentCommunity } from '../models/community'
import { canEditPost, canModerate } from '../models/currentUser'
import { isMobile } from '../client/util'
import decode from 'ent/decode'

const spacer = <span>&nbsp; •&nbsp; </span>

const shouldShowTag = tag => tag && !includes(['chat'], tag)

export const presentDescription = (post, community) =>
  present(sanitize(post.description), {slug: get(community, 'slug')})

class Post extends React.Component {
  static propTypes = {
    post: object,
    communities: array,
    community: object,
    comments: array,
    dispatch: func,
    expanded: bool,
    onExpand: func
  }

  static childContextTypes = {post: object}

  getChildContext () {
    return {post: this.props.post}
  }

  render () {
    const { post, communities, comments, expanded, onExpand, community } = this.props
    const { tag, media, linkPreview } = post
    const image = find(m => m.type === 'image', media)
    const classes = cx('post', tag, {image, expanded})
    const title = linkifyHashtags(decode(sanitize(post.name || '')), get(community, 'slug'))

    return <div className={classes}>
      <Header communities={communities}/>
      <p className='title post-section' dangerouslySetInnerHTML={{__html: title}}></p>
      {image && <img src={image.url} className='post-section full-image'/>}
      <Details {...{expanded, onExpand, tag}}/>
      {linkPreview && <LinkPreview {...{linkPreview}}/>}
      <div className='voting post-section'><VoteButton/><Voters/></div>
      <Attachments/>
      <CommentSection post={post} truncate={!expanded} expand={onExpand} comments={comments}/>
    </div>
  }
}

export default compose(
  connect((state, { post }) => {
    return {
      comments: getComments(post, state),
      communities: getCommunities(post, state),
      community: getCurrentCommunity(state)
    }
  })
)(Post)

export const UndecoratedPost = Post // for testing

export const Header = ({ communities }, { post, community }) => {
  const { tag } = post
  const person = tag === 'welcome' ? post.relatedUsers[0] : post.user
  const createdAt = new Date(post.created_at)

  return <div className='header'>
    <Menu/>
    <Avatar person={person}/>
    {tag === 'welcome'
      ? <WelcomePostHeader communities={communities}/>
      : <div>
          <A className='name' to={`/u/${person.id}`}>{person.name}</A>
          <span className='meta'>
            <A to={`/p/${post.id}`} title={createdAt}>
              {nonbreaking(humanDate(createdAt))}
            </A>
            {communities && <Communities communities={communities}/>}
            {post.public && <span>{spacer}Public</span>}
          </span>
        </div>}
  </div>
}
Header.contextTypes = {post: object, community: object}

const Communities = ({ communities }, { community }) => {
  if (community) communities = sortBy(communities, c => c.id !== community.id)
  const { length } = communities
  if (communities.length === 0) return null

  const communityLink = community => <A to={`/c/${community.slug}`}>{community.name}</A>
  return <span className='communities'>
    &nbsp;in {communityLink(communities[0])}
    {length > 1 && <Dropdown className='post-communities-dropdown'
      toggleChildren={<span> + {length - 1} other{length > 2 ? 's' : ''}</span>}>
      {communities.map(c => <li key={c.id}>{communityLink(c)}</li>)}
    </Dropdown>}
  </span>
}
Communities.contextTypes = {community: object}

const Details = ({ expanded, onExpand, tag }, { post, community, dispatch }) => {
  const slug = get(community, 'slug')
  let description = presentDescription(post, community)
  const truncated = !expanded && textLength(description) > 200
  if (truncated) description = truncate(description, 200)
  if (description) description = appendInP(description, '&nbsp;')

  return <div className='post-section details'>
    <ClickCatchingSpan dangerouslySetInnerHTML={{__html: description}}/>
    {truncated && <span>
      <wbr/>
      <a onClick={onExpand} className='show-more'>Show&nbsp;more</a>
      &nbsp;
    </span>}
    {shouldShowTag(tag) && <a className='hashtag'
      href={tagUrl(tag, slug)}
      onMouseOver={handleMouseOver(dispatch)}>
      {`#${tag}`}
    </a>}
  </div>
}
Details.contextTypes = {post: object, community: object, dispatch: func}

const Attachments = (props, { post }) => {
  const attachments = filter(post.media, m => m.type === 'gdoc')
  if (isEmpty(attachments)) return <span/>

  return <div className='post-section'>
    {attachments.map((file, i) =>
      <a key={i} className='attachment' href={file.url} target='_blank' title={file.name}>
        <img src={file.thumbnail_url}/>
        {truncate(file.name, 40)}
      </a>)}
  </div>
}
Attachments.contextTypes = {post: object}

const WelcomePostHeader = ({ communities }, { post }) => {
  let person = post.relatedUsers[0]
  let community = communities[0]
  return <div>
    <strong><A to={`/u/${person.id}`}>{person.name}</A></strong> joined
    <span> </span>
    {community
      ? <span>
          <A to={`/c/${community.slug}`}>{community.name}</A>.
          <span> </span>
          <a className='open-comments'>
            Welcome them!
          </a>
        </span>
      : <span>
          a community that is no longer active.
        </span>}
  </div>
}
WelcomePostHeader.contextTypes = {post: object}

export const Menu = (props, { dispatch, post, currentUser, community }) => {
  const canEdit = canEditPost(currentUser, post)
  const following = some(post.followers, same('id', currentUser))
  const pinned = isPinned(post, community)
  const edit = () => isMobile()
    ? dispatch(navigate(`/p/${post.id}/edit`))
    : dispatch(startPostEdit(post))
  const remove = () => window.confirm('Are you sure? This cannot be undone.') &&
    dispatch(removePost(post.id))
  const pin = () => dispatch(pinPost(get(community, 'slug'), post.id))

  const toggleChildren = pinned
    ? <span className='pinned'><span className='label'>Pinned</span><span className='icon-More'></span></span>
    : <span className='icon-More'></span>

  return <Dropdown className='post-menu' alignRight {...{toggleChildren}}>
    {canModerate(currentUser, community) && <li>
      <a onClick={pin}>{pinned ? 'Unpin post' : 'Pin post'}</a>
    </li>}
    {canEdit && <li><a onClick={edit}>Edit</a></li>}
    {canEdit && <li><a onClick={remove}>Remove</a></li>}
    <li>
      <a onClick={() => dispatch(followPost(post.id, currentUser))}>
        Turn {following ? 'off' : 'on'} notifications for this post
      </a>
    </li>
    <li>
      <a onClick={() => window.alert('TODO')}>Report objectionable content</a>
    </li>
  </Dropdown>
}
Menu.contextTypes = {post: object, currentUser: object, dispatch: func, community: object}

export class CommentSection extends React.Component {
  static propTypes = {
    comments: array,
    truncate: bool,
    expand: func,
    post: object,
    dispatch: func
  }

  static contextTypes = {
    dispatch: func,
    community: object,
    currentUser: object,
    isProjectRequest: bool
  }

  render () {
    let { post, comments, truncate, expand } = this.props
    const { dispatch, currentUser, community, isProjectRequest } = this.context

    if (!comments) comments = []
    comments = sortBy(comments, c => c.created_at)
    if (truncate) comments = comments.slice(-3)

    const expandComment = id => {
      expand()

      // the offset below is ignored by the backend, but it causes the frontend
      // to ignore the 3 comments that are already cached
      dispatch(fetchComments(post.id, {offset: 3}))
      .then(({ error }) => {
        if (error) {
          return dispatch(notify('Could not load comments. Please try again soon.', {type: 'error'}))
        }
        if (id) scrollToAnchor(`comment-${id}`, 90)
      })
    }

    const placeholder = isProjectRequest ? 'How can you help?' : null

    return <div className={cx('comments-section post-section', {empty: isEmpty(comments)})}>
      <a name={`post-${post.id}-comments`}></a>
      {truncate && post.numComments > comments.length && <div className='comment show-all'>
        <a onClick={() => expandComment()}>Show all {post.numComments} comments</a>
      </div>}
      {comments.map(c => <Comment comment={{...c, post_id: post.id}}
        truncate={truncate}
        expand={() => expandComment(c.id)}
        community={community}
        key={c.id}/>)}
      {currentUser && <CommentForm postId={post.id} {...{placeholder}}/>}
    </div>
  }
}

export const VoteButton = (props, { post, currentUser, dispatch }) => {
  let vote = () => dispatch(voteOnPost(post, currentUser))
  let myVote = includes(map(post.voters, 'id'), (currentUser || {}).id)
  return <a className='vote-button' onClick={vote}>
    {myVote ? <Icon name='Heart2' /> : <Icon name='Heart' />}
    {myVote ? 'Liked' : 'Like'}
  </a>
}
VoteButton.contextTypes = {post: object, currentUser: object, dispatch: func}

export const Voters = (props, { post, currentUser }) => {
  const voters = post.voters || []

  let onlyAuthorIsVoting = voters.length === 1 && same('id', first(voters), post.user)
  return voters.length > 0 && !onlyAuthorIsVoting
    ? <LinkedPersonSentence people={voters} className='voters meta'>
        liked this.
      </LinkedPersonSentence>
    : <span />
}
Voters.contextTypes = {post: object, currentUser: object}
