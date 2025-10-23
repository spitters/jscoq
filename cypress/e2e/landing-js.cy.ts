import { check_startup } from './common'

describe('Landing Page (JSOO) with CodeMirror 6', () => {
  check_startup('js');
});

describe('Landing Page (JSOO) with Markdown view', () => {
  check_startup('js', 'mdview');
});
