import React from 'react'
import { compose } from 'redux'
import { prefetch } from 'react-fetcher'
import { connect } from 'react-redux'
import { connectedListProps, fetchWithCache, refetch } from '../util/caching'
import { navigate, search } from '../actions'
import { debounce, get, some } from 'lodash'
import Select from '../components/Select'
import Comment from '../components/Comment'
import Avatar from '../components/Avatar'
import A from '../components/A'
import Post from '../components/Post'
import ScrollListener from '../components/ScrollListener'
import Tags from '../components/Tags'

const types = [
  {name: 'Everything'},
  {name: 'Posts', id: 'post'},
  {name: 'People', id: 'person'},
  {name: 'Comments', id: 'comment'}
]

const subject = 'search'
const fetch = fetchWithCache(search)

const Search = compose(
  prefetch(({ dispatch, query }) => query.q && dispatch(fetch(subject, null, query))),
  connect((state, { location: { query } }) => ({
    ...connectedListProps(state, {subject, query}, 'searchResults')
  }))
)(({ dispatch, location, searchResults, total, pending }) => {
  let updateSearch = debounce(opts => dispatch(refetch(opts, location)), 500)
  let { q, type } = location.query
  let selectedType = types.find(t => t.id === type) || types[0]

  let loadMore = () => {
    let offset = searchResults.length
    if (!pending && offset < total) {
      dispatch(fetch(subject, null, {q, type, offset}))
    }
  }

  return <div id='search'>
    <h2>Search!</h2>
    <div className='list-controls'>
      <input type='text' className='form-control search' defaultValue={q}
        onChange={event => updateSearch({q: event.target.value})}/>
      <Select className='type' choices={types} selected={selectedType}
        onChange={t => updateSearch({type: t.id})} alignRight={true}/>
    </div>
    <div className='results'>
      {searchResults.map(({ type, data }) => <div key={`${type}${data.id}`}>
        {type === 'post'
          ? <PostResult post={data} dispatch={dispatch}/>
          : type === 'person'
            ? <PersonResult person={data}/>
          : <CommentResult comment={data}/>}
      </div>)}
    </div>
    <ScrollListener onBottom={loadMore}/>
  </div>
})

export default Search

const PostResult = ({ post, dispatch }) => {
  post.communities = []
  return <Post post={post} onExpand={() => dispatch(navigate(`/p/${post.id}`))}/>
}

const PersonResult = ({ person }) => {
  let { bio, work, intention, skills, organizations } = person
  return <div className='person-result'>
    <div className='hello'>
      <Avatar person={person}/>
      <br/>
      <strong><A to={`/u/${person.id}`}>{person.name}</A></strong>
    </div>
    <div className='content'>
      {bio && <p><strong>About me:</strong> {bio}</p>}
      {work && <p><strong>What I'm doing:</strong> {work}</p>}
      {intention && <p><strong>What I'd like to do:</strong> {intention}</p>}
      {some(skills) && <div className='tag-group skills'>
        <strong>Skills:</strong>
        <Tags>{skills}</Tags>
      </div>}
      {some(organizations) && <div className='tag-group'>
        <strong>Groups:</strong>
        <Tags>{organizations}</Tags>
      </div>}
    </div>
  </div>
}

const CommentResult = ({ comment }) => {
  let { post } = comment
  let welcomedPerson = get(post, 'relatedUsers.0')
  return <div className='comment-result'>
    <strong>
      Comment on&ensp;
      <A to={`/p/${post.id}#comment-${comment.id}`}>
        {post.type === 'welcome'
          ? `${welcomedPerson.name}'s welcome post`
          : `"${post.name}"`}
      </A>
    </strong>
    <Comment comment={comment}/>
  </div>
}