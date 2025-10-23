import { check_startup } from './common'

describe('Landing Page (WASM) with CodeMirror 6', () => {
  check_startup('wa');
});

describe('Landing Page (WASM) with Markdown view', () => {
  check_startup('wa', 'mdview');
});
