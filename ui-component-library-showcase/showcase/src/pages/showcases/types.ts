import type { ReactElement } from 'react'
import type { LibraryProfile } from '../../data/libraries'

export type ShowcasePageProps = {
  library: LibraryProfile
}

export type ShowcasePageComponent = (props: ShowcasePageProps) => ReactElement
