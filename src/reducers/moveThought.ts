import _ from 'lodash'
import { treeMove } from '../util/recentlyEditedTree'
import { rerank, updateThoughts } from '../reducers'
import { getLexeme, getChildrenRanked, isPending, simplifyPath, rootedParentOf, getAllChildren } from '../selectors'
import { Index, Parent, Path, State } from '../@types'

// util
import {
  hashThought,
  head,
  headId,
  headRank,
  isDescendantPath,
  moveLexemeThought,
  pathToContext,
  reducerFlow,
  removeDuplicatedContext,
  timestamp,
} from '../util'

// @MIGRATION_TODO: Nested merge logic doesn't work properly.
/** Moves a thought from one context to another, or within the same context. */
const moveThought = (
  state: State,
  {
    oldPath,
    newPath,
    offset,
    skipRerank,
    newRank,
  }: {
    oldPath: Path
    newPath: Path
    offset?: number
    // skip the auto rerank to prevent infinite loop
    skipRerank?: boolean
    newRank: number
  },
) => {
  const oldSimplePath = simplifyPath(state, oldPath)
  const newSimplePath = simplifyPath(state, newPath)

  const movingThoughtId = headId(oldSimplePath)
  const thoughtIndexNew = { ...state.thoughts.thoughtIndex }
  const oldThoughts = pathToContext(state, oldSimplePath)
  const newThoughts = pathToContext(state, newSimplePath)
  const value = head(oldThoughts)
  const key = hashThought(value)
  const oldRank = headRank(oldSimplePath)
  const oldContext = rootedParentOf(state, oldThoughts)

  const newParentId = head(rootedParentOf(state, newSimplePath))

  const newContext = rootedParentOf(state, newThoughts)
  // const sameContext = equalArrays(oldContext, newContext)
  const lexemeOld = getLexeme(state, value) || {
    // guard against missing lexeme (data integrity issue)
    contexts: [],
    value,
    created: timestamp(),
    lastUpdated: timestamp(),
  }

  const movingThought = state.thoughts.contextIndex[movingThoughtId]

  if (!movingThought) {
    console.error('moveThought: Parent entry for moved thought not found!', oldThoughts)
    return state
  }

  if (!lexemeOld) {
    console.error('Lexeme not found', oldPath)
    return state
  }

  const oldParentThought = state.thoughts.contextIndex[movingThought.parentId]

  if (!oldParentThought) {
    console.error('Old parent entry of moving thought not found!')
    return state
  }

  const newParentThought = state.thoughts.contextIndex[newParentId]

  if (!newParentThought) {
    console.error('New parent entry for moving not found!')
    return state
  }

  //  @MIGRATION_TODO: Fix duplicate merge.

  // const duplicateSubthought = getChildrenRanked(state, newContext).find(
  //   child => normalizeThought(child.value) === normalizeThought(value),
  // )

  // const isDuplicateMerge = duplicateSubthought && !sameContext

  const isArchived = newThoughts.indexOf('=archive') !== -1

  // find exact thought from thoughtIndex\
  const exactThought = lexemeOld.contexts.find(thoughtContext => thoughtContext === movingThoughtId)

  if (!exactThought) {
    console.warn('moveThought: Exact thought was not found in the lexeme.')
  }

  // if move is used for archive then update the archived field to latest timestamp
  const archived = isArchived ? timestamp() : movingThought.archived

  const lexemeAfterMove = moveLexemeThought(state, lexemeOld, oldRank, newRank, movingThoughtId)

  const lexemeNew = removeDuplicatedContext(state, lexemeAfterMove, newContext)

  // update thoughtIndex here since recursive updates may have to update same lexeme
  thoughtIndexNew[key] = lexemeNew

  // Uncaught TypeError: Cannot perform 'IsArray' on a proxy that has been revoked at Function.isArray (#417)
  let recentlyEdited = state.recentlyEdited // eslint-disable-line fp/no-let
  try {
    recentlyEdited = treeMove(state, state.recentlyEdited, oldPath, newPath)
  } catch (e) {
    console.error('moveThought: treeMove immer error')
    console.error(e)
  }

  // if the contexts have changed, remove the value from the old contextIndex and add it to the new
  const updatedChildrenOldParent = getAllChildren(state, oldContext).filter(child => child !== movingThoughtId)

  const updatedChildrenNewParent = getAllChildren(state, newContext)
    .filter(child => child !== movingThoughtId)
    .concat(movingThoughtId)

  const isNewContextPending = isPending(state, newThoughts)

  const contextIndexUpdates: Index<Parent | null> = {
    // @MIGRATION_NOTE: Do not delete parent entry if the children is empty
    [oldParentThought.id]: {
      ...oldParentThought,
      children: updatedChildrenOldParent,
      lastUpdated: timestamp(),
    },
    [newParentThought.id]: {
      ...newParentThought,
      children: updatedChildrenNewParent,
      lastUpdated: timestamp(),
    },
    [movingThought.id]: {
      ...movingThought,
      parentId: newParentThought.id,
      rank: newRank,
      archived,
      lastUpdated: timestamp(),
    },
  }

  const thoughtIndexUpdates = {
    [key]: lexemeNew,
  }

  // preserve contextViews
  const contextViewsNew = { ...state.contextViews }
  // @MIGRATION_TODO: This may not be required after migration.
  // if (state.contextViews[contextEncodedNew] !== state.contextViews[contextEncodedOld]) {
  //   contextViewsNew[contextEncodedNew] = state.contextViews[contextEncodedOld]
  //   delete contextViewsNew[contextEncodedOld] // eslint-disable-line fp/no-delete
  // }

  const isPathInCursor = state.cursor && isDescendantPath(state.cursor, oldPath)

  const isCursorAtOldPath = isPathInCursor && state.cursor?.length === oldPath.length

  /**
   *
   */
  const getUpdateCursor = () => {
    if (!state.cursor) return null
    return [...newPath, ...state.cursor.slice(newPath.length)] as Path
  }

  const newCursorPath = isPathInCursor ? (isCursorAtOldPath ? newPath : getUpdateCursor()) : state.cursor

  return reducerFlow([
    state => ({
      ...state,
      contextViews: contextViewsNew,
      cursor: newCursorPath,
      ...(offset != null ? { cursorOffset: offset } : null),
    }),

    // update thoughts
    updateThoughts({
      contextIndexUpdates,
      thoughtIndexUpdates,
      recentlyEdited,
      // load the children of the conflicted path if it's pending
      pendingPulls: isNewContextPending ? [{ path: newPath }] : [],
    }),

    // rerank context if ranks are too close
    // skip if this moveThought originated from a rerank
    // otherwise we get an infinite loop
    !skipRerank
      ? state => {
          const rankPrecision = 10e-8
          const children = getChildrenRanked(state, newContext)
          const ranksTooClose = children.some((thought, i) => {
            if (i === 0) return false
            const secondThought = state.thoughts.contextIndex[children[i - 1].id]
            return Math.abs(thought.rank - secondThought.rank) < rankPrecision
          })
          return ranksTooClose ? rerank(state, rootedParentOf(state, newSimplePath)) : state
        }
      : null,
  ])(state)
}

export default _.curryRight(moveThought, 2)
