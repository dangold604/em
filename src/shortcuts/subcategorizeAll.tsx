import React from 'react'
import { isDocumentEditable } from '../util'
import subCategorizeAll from '../action-creators/subCategorizeAll'
import { Icon as IconType, Shortcut } from '../@types'

// eslint-disable-next-line jsdoc/require-jsdoc
const Icon = ({ fill = 'black', size = 20, style }: IconType) => (
  <svg
    version='1.1'
    className='icon'
    xmlns='http://www.w3.org/2000/svg'
    width={size}
    height={size}
    fill={fill}
    style={style}
    viewBox='0 0 24 24'
  >
    <path d='M15.7246094,15.8876953c-1.3079224,0-2.4008789,0.913269-2.6907349,2.1337891h-1.7438354  c-0.7543945,0-1.3676758-0.6142578-1.3676758-1.3681641v-4.7189331c0.3969727,0.2515259,0.8638916,0.4025269,1.3676758,0.4025269  h1.7201538c0.260437,1.2598877,1.378479,2.2099609,2.7144165,2.2099609c1.5288086,0,2.7724609-1.2431641,2.7724609-2.7714844  s-1.2436523-2.7714844-2.7724609-2.7714844c-1.3079224,0-2.4008789,0.913269-2.6907349,2.1337891h-1.7438354  c-0.7543945,0-1.3676758-0.6142578-1.3676758-1.3681641V7.706665c1.2417603-0.2744141,2.1748047-1.3800049,2.1748047-2.7027588  c0-1.5292969-1.2436523-2.7724609-2.7724609-2.7724609c-1.5283203,0-2.7719727,1.2431641-2.7719727,2.7724609  c0,1.3208618,0.930603,2.4248047,2.1694336,2.7012329v8.9481812c0,1.4160156,1.1518555,2.5673828,2.5678711,2.5673828h1.7201538  c0.260437,1.2598877,1.378479,2.2099609,2.7144165,2.2099609c1.5288086,0,2.7724609-1.2431641,2.7724609-2.7714844  S17.253418,15.8876953,15.7246094,15.8876953z M14.1589966,11.7145386c0.0327759-0.838501,0.7197266-1.5114136,1.5656128-1.5114136  c0.8671875,0,1.5722656,0.7050781,1.5722656,1.5722656s-0.7050781,1.5722656-1.5722656,1.5722656  c-0.8632812,0-1.5651245-0.699707-1.5707397-1.5621948c0.0014038-0.0167236,0.0097046-0.0310669,0.0097046-0.0481567  C14.1635742,11.729248,14.1593018,11.7225342,14.1589966,11.7145386z M9.3295288,6.5756836  c-0.0025635-0.000061-0.0046997-0.0014648-0.0072632-0.0014648c-0.0020142,0-0.0036011,0.0011597-0.0056152,0.0011597  C8.4536743,6.5708618,7.7529297,5.8683472,7.7529297,5.0039062c0-0.8671875,0.7050781-1.5732422,1.5717773-1.5732422  c0.8671875,0,1.5722656,0.7060547,1.5722656,1.5732422C10.8969727,5.8694458,10.194458,6.572998,9.3295288,6.5756836z   M15.7246094,20.2314453c-0.8632812,0-1.5651245-0.699707-1.5707397-1.5621948  c0.0014038-0.0167236,0.0097046-0.0310669,0.0097046-0.0481567c0-0.0080566-0.0042725-0.0147705-0.0045776-0.0227661  c0.0327759-0.838501,0.7197266-1.5114136,1.5656128-1.5114136c0.8671875,0,1.5722656,0.7050781,1.5722656,1.5722656  S16.5917969,20.2314453,15.7246094,20.2314453z' />
  </svg>
)

const subCategorizeAllShortcut: Shortcut = {
  id: 'subcategorizeAll',
  label: 'Subcategorize All',
  description: 'Insert all thoughts in the current context into a new context.',
  gesture: 'ldr',
  keyboard: { key: 'a', meta: true, alt: true },
  svg: Icon,
  canExecute: getState => isDocumentEditable() && !!getState().cursor,
  exec: subCategorizeAll(),
}

export default subCategorizeAllShortcut
