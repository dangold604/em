import React from 'react'
import { useSelector } from 'react-redux'
import State from '../../@types/State'
import Thought from '../../@types/Thought'
import { isMac, isTouch } from '../../browser'
import {
  HOME_TOKEN,
  TUTORIAL_CONTEXT,
  TUTORIAL_CONTEXT2_PARENT,
  TUTORIAL_VERSION_BOOK,
  TUTORIAL_VERSION_JOURNAL,
  TUTORIAL_VERSION_TODO,
} from '../../constants'
import contextToThoughtId from '../../selectors/contextToThoughtId'
import findDescendant from '../../selectors/findDescendant'
import { getChildrenRanked } from '../../selectors/getChildren'
import getContexts from '../../selectors/getContexts'
import parentOfThought from '../../selectors/parentOfThought'
import store from '../../stores/app'
import headValue from '../../util/headValue'
import joinConjunction from '../../util/joinConjunction'
import StaticSuperscript from '../StaticSuperscript'
import TutorialHint from './TutorialHint'

// eslint-disable-next-line jsdoc/require-jsdoc
const context2SubthoughtCreated = ({
  rootChildren,
  tutorialChoice,
}: {
  tutorialChoice: keyof typeof TUTORIAL_CONTEXT
  rootChildren: Thought[]
}) => {
  const state = store.getState()

  const tutorialChoiceParentId = contextToThoughtId(state, [TUTORIAL_CONTEXT2_PARENT[tutorialChoice]])
  const tutorialChoiceId =
    tutorialChoiceParentId && findDescendant(state, tutorialChoiceParentId, TUTORIAL_CONTEXT[tutorialChoice])
  // e.g. Work
  return (
    tutorialChoiceId &&
    // e.g. Work/To Do/y
    getChildrenRanked(state, tutorialChoiceId).length > 0
  )
}

// eslint-disable-next-line jsdoc/require-jsdoc
const Tutorial2StepContext2Subthought = ({
  tutorialChoice,
  rootChildren,
}: {
  tutorialChoice: keyof typeof TUTORIAL_CONTEXT
  rootChildren: Thought[]
}) => {
  const value = TUTORIAL_CONTEXT[tutorialChoice] || ''
  const caseSensitiveValue = useSelector((state: State) =>
    getContexts(state, value).length > 0 ? value : value.toLowerCase(),
  )
  const numContexts = useSelector((state: State) => getContexts(state, caseSensitiveValue).length)
  const contextParentThoughts = useSelector((state: State) => {
    const contexts = getContexts(state, caseSensitiveValue)
    return contexts.map(thoughtId => parentOfThought(state, thoughtId))
  })
  const isContext2SubthoughtCreated = context2SubthoughtCreated({ rootChildren, tutorialChoice })

  const hasChosen = useSelector((state: State) => {
    const tutorialChoiceParentId = contextToThoughtId(state, [TUTORIAL_CONTEXT2_PARENT[tutorialChoice]])
    return !!getChildrenRanked(state, tutorialChoiceParentId).find(
      child => child.value.toLowerCase() === TUTORIAL_CONTEXT[tutorialChoice].toLowerCase(),
    )
  })

  const selectChoice = useSelector(
    (state: State) =>
      !state.cursor || headValue(state, state.cursor).toLowerCase() !== TUTORIAL_CONTEXT[tutorialChoice].toLowerCase(),
  )

  if (isContext2SubthoughtCreated) {
    return (
      <>
        <p>Nice work!</p>
        <p>{isTouch ? 'Tap' : 'Click'} the Next button when you are done entering your thought.</p>
      </>
    )
  }
  return (
    <>
      <p>Very good!</p>
      <p>
        Notice the small number (<StaticSuperscript n={numContexts} />
        ). This means that “{caseSensitiveValue}” appears in {numContexts} place{numContexts === 1 ? '' : 's'}, or{' '}
        <i>contexts</i> (in our case{' '}
        {joinConjunction(
          contextParentThoughts
            .filter(parent => parent && parent.value !== HOME_TOKEN)
            .map(parent => `"${parent!.value}"`),
        )}
        ).
      </p>
      <p>
        Imagine{' '}
        {tutorialChoice === TUTORIAL_VERSION_TODO
          ? 'a new work task.'
          : tutorialChoice === TUTORIAL_VERSION_JOURNAL
          ? 'a realization you have about relationships in therapy.'
          : tutorialChoice === TUTORIAL_VERSION_BOOK
          ? 'a new thought related to psychology.'
          : null}{' '}
        Add it to this “{TUTORIAL_CONTEXT[tutorialChoice]}” list.
      </p>
      {
        // e.g. Work
        rootChildren.find(
          child => child.value.toLowerCase() === TUTORIAL_CONTEXT2_PARENT[tutorialChoice].toLowerCase(),
        ) &&
        // e.g. Work/To Do
        hasChosen ? (
          <p>
            Do you remember how to do it?
            <TutorialHint>
              <br />
              <br />
              {selectChoice ? `Select "${TUTORIAL_CONTEXT[tutorialChoice]}". ` : null}
              {isTouch ? 'Trace the line below with your finger ' : `Hold ${isMac ? 'Command' : 'Ctrl'} and hit Enter `}
              to create a new thought <i>within</i> "{TUTORIAL_CONTEXT[tutorialChoice]}".
            </TutorialHint>
          </p>
        ) : (
          <p>
            Oops, somehow “{TUTORIAL_CONTEXT[tutorialChoice]}” was changed or deleted. Click the Prev button to go back.
          </p>
        )
      }
    </>
  )
}

export default Tutorial2StepContext2Subthought