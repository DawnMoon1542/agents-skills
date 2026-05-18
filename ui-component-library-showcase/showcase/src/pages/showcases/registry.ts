import type { LibraryId } from '../../data/libraries'
import type { ShowcasePageComponent } from './types'
import { HeroUiPage } from './HeroUiPage'
import { KokonutUiPage } from './KokonutUiPage'
import { MaterialUiPage } from './MaterialUiPage'
import { ReUiPage } from './ReUiPage'
import { ShadcnUiPage } from './ShadcnUiPage'
import { ShadcnblocksPage } from './ShadcnblocksPage'
import { TailarkUiPage } from './TailarkUiPage'
import { UiTripledPage } from './UiTripledPage'

export const showcasePages: Record<LibraryId, ShowcasePageComponent> = {
  'shadcn-ui': ShadcnUiPage,
  heroui: HeroUiPage,
  'material-ui': MaterialUiPage,
  'ui-tripled': UiTripledPage,
  'tailark-ui': TailarkUiPage,
  reui: ReUiPage,
  shadcnblocks: ShadcnblocksPage,
  'kokonut-ui': KokonutUiPage
}
