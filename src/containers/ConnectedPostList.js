import React from 'react'
import { connect } from 'react-redux'
import PostList from '../components/PostList'
import { FETCH_POSTS } from '../actions'
import { debug } from '../util/logging'
const { array, bool, func, number } = React.PropTypes

@connect(({ postsByQuery, totalPostsByQuery, pending }, { query }) => ({
  posts: postsByQuery[query],
  total: totalPostsByQuery[query],
  pending: pending[FETCH_POSTS]
}))
export default class ConnectedPostList extends React.Component {
  static propTypes = {
    posts: array,
    fetch: func,
    dispatch: func,
    total: number,
    pending: bool
  }

  loadMore = () => {
    let { posts, dispatch, fetch, total, pending } = this.props
    if (total && posts.length >= total || pending) return

    let offset = posts.length
    dispatch(fetch({offset}))
  }

  render () {
    let { posts, total, pending } = this.props
    if (!posts) posts = []
    debug(`posts: ${posts.length} / ${total || '??'}`)
    return <PostList posts={posts} loadMore={this.loadMore} pending={pending}/>
  }
}