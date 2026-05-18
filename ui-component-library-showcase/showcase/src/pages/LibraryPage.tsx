import { showcasePages } from './showcases/registry'
import type { LibraryProfile } from '../data/libraries'

type LibraryPageProps = {
  library: LibraryProfile
}

export function LibraryPage({ library }: LibraryPageProps) {
  const ShowcasePage = showcasePages[library.id]

  return <ShowcasePage library={library} />
}
