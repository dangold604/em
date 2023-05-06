import _ from 'lodash'
import { ThunkMiddleware } from 'redux-thunk'
import State from '../@types/State'
import { Thunk } from '../@types/Thunk'
import freeThoughts from '../action-creators/freeThoughts'
import { MAX_THOUGHT_INDEX } from '../constants'

/** Checks if the thought cache has exceeded its memory limit. If so, dispatches freeThoughts which frees memory in the thoughtIndex, lexemeIndex, and IndexedDBProviders. */
const check: Thunk = (dispatch, getState): void => {
  const state = getState()
  if (Object.keys(state.thoughts.thoughtIndex).length > MAX_THOUGHT_INDEX) {
    dispatch(freeThoughts())
  }
}

const checkThrottled = _.throttle(check, 1000, { leading: false })

/** Runs a throttled session keepalive on every action. */
const freeThoughtsMiddleware: ThunkMiddleware<State> = ({ dispatch, getState }) => {
  return next => action => {
    next(action)
    checkThrottled(dispatch, getState)
  }
}

export default freeThoughtsMiddleware