import {
  flatten,
  type Flatten,
  type Translator as iTranslator,
} from '@solid-primitives/i18n'
import { dict as en_dict } from './en/en'
import { Location } from '@solidjs/router'
import { createResource } from 'solid-js'

export function localeResource(locale: Locale) {
  const [dict] = createResource(() => locale, fetchDictionary, {
    initialValue: default_locale,
  })
}
export function toLocale(string: string): Locale | undefined {
  return string in dict_hash
    ? (string as Locale)
    : string in LANG_ALIASES
    ? (LANG_ALIASES[string] as Locale)
    : undefined
}

const LOCALES_IN_USE = ['en'] satisfies Locale[]
// some browsers do no map correctly to some locale codes
// due to offering multiple locale codes for similar languages (e.g. tl and fil)
// This object maps it to the correct 'langs' key
const LANG_ALIASES: Partial<Record<string, Locale>> = {}

const raw_dict_hash = {
  en: () => import('./en/en'),
} satisfies Record<string, () => Promise<RawDictionary>>
const dict_hash = generateSubsetFrom(raw_dict_hash)(LOCALES_IN_USE)
export const default_locale = flatten(en_dict)

export async function fetchDictionary(
  locale: Locale
): Promise<FlattenedDictionary | undefined> {
  if (!(locale in dict_hash)) return undefined

  const { dict } = await dict_hash[locale as keyof typeof dict_hash]()
  const flat_dict = flatten(dict)
  return { ...default_locale, ...flat_dict }
}

function generateSubsetFrom<TObj>(obj: TObj) {
  return function <TPicked extends keyof TObj>(keys: TPicked[]) {
    return keys.reduce((subset, key) => {
      subset[key] = obj[key]
      return subset
    }, {} as Pick<TObj, TPicked>)
  }
}

export type Dictionary = typeof en_dict
export type Locale = keyof typeof raw_dict_hash
export type Translator = iTranslator<Dictionary>
type RawDictionary = { dict: Dictionary }
type FlattenedDictionary = Flatten<typeof en_dict>
