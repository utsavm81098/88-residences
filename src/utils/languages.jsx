import { SVG_FLAGS } from '@/assets/svg/flags';

export const RTL_LANGS = ['he'];

export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr', flag: SVG_FLAGS.en },
  { code: 'he', label: 'עברית', dir: 'rtl', flag: SVG_FLAGS.he },
];

export const SUPPORTED_LANGS = ['en', 'he'];
export const DEFAULT_NS = 'translation';
export const NAMESPACES = ['translation', 'common'];
