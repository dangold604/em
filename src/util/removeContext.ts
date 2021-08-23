import { timestamp } from './timestamp'
import { notNull } from './notNull'
import { State, Context, Lexeme, Timestamp } from '../@types'
import { hashContext } from './hashContext'
import { unroot } from './unroot'

// @MIGRATION_TODO: Use id to remove instead of context
/** Returns a new thought less the given context. */
export const removeContext = (
  state: State,
  lexeme: Lexeme,
  context: Context,
  rank: number,
  lastUpdated: Timestamp = timestamp(),
): Lexeme => {
  return Object.assign(
    {},
    lexeme,
    notNull({
      contexts: lexeme.contexts
        ? lexeme.contexts.filter(thought => {
            const parentId = state.thoughts.contextIndex[thought].parentId
            return !(parentId === hashContext(state, unroot([...context, lexeme.value])))
          })
        : [],
      created: lexeme.created || lastUpdated,
      lastUpdated: lastUpdated,
    }),
  )
}
