require('../support')
import comments from '../../src/reducers/comments'
import {
  FETCH_ACTIVITY,
  FETCH_COMMENTS,
  CREATE_COMMENT,
  THANK_PENDING
} from '../../src/actions'

describe('comments', () => {
  describe('on FETCH_COMMENTS', () => {
    it('appends comments to state', () => {
      let action = {
        type: FETCH_COMMENTS,
        payload: [
          {id: '2', comment_text: 'bar'},
          {id: '3', comment_text: 'baz'}
        ]
      }

      let state = {
        '1': {id: '1', comment_text: 'foo'}
      }

      let expectedState = {
        '1': {id: '1', comment_text: 'foo'},
        '2': {id: '2', comment_text: 'bar'},
        '3': {id: '3', comment_text: 'baz'}
      }

      expect(comments(state, action)).to.deep.equal(expectedState)
    })
  })

  describe('on CREATE_COMMENT', () => {
    it('appends comment to state', () => {
      let action = {
        type: CREATE_COMMENT,
        payload: {id: '2', comment_text: 'bar'}
      }

      let state = {
        '1': {id: '1', comment_text: 'foo'}
      }

      let expectedState = {
        '1': {id: '1', comment_text: 'foo'},
        '2': {id: '2', comment_text: 'bar'}
      }

      expect(comments(state, action)).to.deep.equal(expectedState)
    })
  })

  describe('on FETCH_ACTIVITY', () => {
    it('extracts comments and appends to state', () => {
      let action = {
        type: FETCH_ACTIVITY,
        payload: { activities: [
          {id: '20', comment: {id: '2', comment_text: 'bar'}},
          {id: '30', comment: {id: '3', comment_text: 'baz'}},
          {id: '40'}
        ]}
      }

      let state = {
        '1': {id: '1', comment_text: 'foo'}
      }

      let expectedState = {
        '1': {id: '1', comment_text: 'foo'},
        '2': {id: '2', comment_text: 'bar'},
        '3': {id: '3', comment_text: 'baz'}
      }

      expect(comments(state, action)).to.deep.equal(expectedState)
    })
  })

  describe('on THANK_PENDING', () => {
    it('adds a thanks', () => {
      let action = {
        type: THANK_PENDING,
        meta: {commentId: '1', userId: '10'}
      }

      let state = {
        '1': {id: '1', comment_text: 'foo', thanks: []},
        '2': {id: '2', comment_text: 'bar', thanks: []}
      }

      let expectedState = {
        '1': {id: '1', comment_text: 'foo', thanks: [{comment_id: '1', thanked_by_id: '10'}]},
        '2': {id: '2', comment_text: 'bar', thanks: []}
      }

      expect(comments(state, action)).to.deep.equal(expectedState)
    })
  })

  describe('on THANK_PENDING', () => {
    it('removes a thanks', () => {
      let action = {
        type: THANK_PENDING,
        meta: {commentId: '1', userId: '10'}
      }

      let state = {
        '1': {id: '1', comment_text: 'foo', thanks: [{comment_id: '1', thanked_by_id: '10'}, {comment_id: '1', thanked_by_id: '20'}]},
        '2': {id: '2', comment_text: 'bar', thanks: []}
      }

      let expectedState = {
        '1': {id: '1', comment_text: 'foo', thanks: [{comment_id: '1', thanked_by_id: '20'}]},
        '2': {id: '2', comment_text: 'bar', thanks: []}
      }

      expect(comments(state, action)).to.deep.equal(expectedState)
    })
  })
})