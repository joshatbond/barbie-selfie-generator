import {
  type ParentProps,
  createContext,
  useContext,
  createResource,
  createEffect,
  startTransition,
} from 'solid-js'
import {
  toLocale,
  default_locale,
  fetchDictionary,
  type Locale,
  type Dictionary,
} from '../lang'
import { useLocation, type Location } from '@solidjs/router'
import { createStore } from 'solid-js/store'
import { cookieStorage, makePersisted } from '@solid-primitives/storage'
import {
  resolveTemplate,
  translator,
  type NullableTranslator,
} from '@solid-primitives/i18n'

const LocaleContext = createContext<ContextValue>(undefined)

export function useLocaleContext() {
  const context = useContext(LocaleContext)
  if (!context)
    throw new Error(
      'useLocaleContext must be used within a LocaleContextProvider'
    )

  return context
}
export function LocaleContextProvider(props: ParentProps) {
  const location = useLocation()
  const [settings, settingsAssign] = makePersisted(
    createStore({ locale: initialLocale(location) }),
    {
      storageOptions: { expires: 1.2e6 },
      storage: cookieStorage,
      deserialize: deserializeSettings(location),
    }
  )
  const [dict] = createResource(() => settings.locale, fetchDictionary, {
    initialValue: default_locale,
  })
  const t = translator(dict, resolveTemplate)

  createEffect(() => {
    document.documentElement.lang = settings.locale
    document.documentElement.dir = t('global.dir') ?? ''
  })

  return (
    <LocaleContext.Provider
      value={{
        getLocale: () => settings.locale,
        setLocale: (l) => {
          startTransition(() => settingsAssign('locale', l))
        },
        getDir: () => (t('global.dir') === 'rtl' ? 'rtl' : 'ltr'),
        t,
      }}
    >
      {props.children}
    </LocaleContext.Provider>
  )
}

function deserializeSettings(location: Location) {
  return function (value: string) {
    const parsed = JSON.parse(value) as unknown
    if (!parsed || typeof parsed !== 'object')
      return { locale: initialLocale(location) }

    return {
      locale:
        'locale' in parsed &&
        typeof parsed.locale === 'string' &&
        toLocale(parsed.locale)
          ? (toLocale(parsed.locale) as Locale)
          : initialLocale(location),
    }
  }
}
function initialLocale(location: Location) {
  const locationLocale = toLocale(location.query.locale)

  if (locationLocale) return locationLocale
  if (typeof window !== 'undefined') {
    const navigatorLocale =
      toLocale(navigator.language.slice(0, 2)) ??
      toLocale(navigator.language.toLocaleLowerCase())
    if (navigatorLocale) return navigatorLocale
  }

  return 'en'
}

type ContextValue = {
  getLocale: () => Locale
  setLocale: (locale: Locale) => void
  t: NullableTranslator<Dictionary>
  getDir: () => 'ltr' | 'rtl'
}
