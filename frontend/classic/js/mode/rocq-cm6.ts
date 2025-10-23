/************************************************************************/
/*  v      *    CodeMirror Mode for the Rocq Proof Assistant            */
/* <O___,, *      Copyright 2016-2025 jsRocq contributors               */
/*   \VV/  **************************************************************/
/*    //   *      This file is distributed under the terms of the       */
/*         *                      MIT license                           */
/************************************************************************/

import { LanguageSupport, HighlightStyle, StreamLanguage, StringStream, syntaxHighlighting } from "@codemirror/language";
import { tags as t, Tag } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

// Rocq mode created by Valentin Robert, Benoît Pin, Emilio J. Gallego
// Arias, H. Guo, Shachar Itzhaky, and others

/************************************************************************/
/* This mode should be eventually replaced by LSP support               */
/*                                                                      */
/* See below for new tokens declared                                    */
/*                                                                      */
/* Note this mode was also in charge of sentence parsing in jsCoq 1     */
/* jsCoq 2.0 doesn't need to find the end of sentence as the server     */
/* takes care of that.                                                  */
/*                                                                      */
/* BUGS:                                                                */
/*                                                                      */
/* - Braces handling doesn't always work. Example: brace starting a     */
/*   line.                                                              */
/*                                                                      */
/************************************************************************/

var vernacular = [
  'Abort', 'About', 'Add', 'All', 'Arguments', 'Asymmetric', 'Axiom',
  'Bind',
  'Canonical', 'Check', 'Class', 'Close', 'Coercion', 'CoFixpoint', 'Comments',
  'CoInductive', 'Compute', 'Context', 'Constructors', 'Contextual', 'Corollary',
  'Defined', 'Definition', 'Delimit',
  'Fail',
  'Eval',
  'End', 'Example', 'Export',
  'Fact', 'Fixpoint', 'From',
  'Global', 'Goal', 'Graph',
  'Hint', 'Hypotheses', 'Hypothesis',
  'Implicit', 'Implicits', 'Import', 'Inductive', 'Infix', 'Instance',
  'Lemma', 'Let', 'Local', 'Ltac',
  'Module', 'Morphism',
  'Next', 'Notation',
  'Obligation', 'Open',
  'Parameter', 'Parameters', 'Prenex', 'Print', 'Printing', 'Program',
  'Patterns', 'Projections', 'Proof',
  'Proposition',
  'Qed',
  'Record', 'Relation', 'Remark', 'Require', 'Reserved', 'Resolve', 'Rewrite',
  'Save', 'Scope', 'Search', 'SearchAbout', 'Section', 'Set', 'Show', 'Strict', 'Structure',
  'Tactic', 'Time', 'Theorem', 'Types',
  'Unset',
  'Variable', 'Variables', 'View'
];

var gallina = [
  'as',
  'at',
  'cofix', 'crush',
  'else', 'end',
  'False', 'fix', 'for', 'forall', 'fun',
  'if', 'in', 'is',
  'let',
  'match',
  'of',
  'Prop',
  'return',
  'struct',
  'then', 'True', 'Type',
  'when', 'with'
];

var tactics = [
  'after', 'apply', 'assert', 'auto', 'autorewrite',
  'case', 'change', 'clear', 'compute', 'congruence', 'constructor',
  'congr', 'cut', 'cutrewrite',
  'dependent', 'destruct',
  'eapply', 'eauto', 'ecase', 'econstructor', 'edestruct',
  'ediscriminate', 'eelim', 'eenough', 'eexists', 'eexact', 'einduction',
  'einjection', 'eleft', 'epose', 'eright', 'esplit',
  'elim', 'enough', 'exists',
  'field', 'firstorder', 'fold', 'fourier',
  'generalize',
  'have', 'hnf',
  'induction', 'injection', 'instantiate', 'intro', 'intros', 'inversion',
  'left',
  'move',
  'pattern', 'pose',
  'refine', 'remember', 'rename', 'repeat', 'replace', 'revert', 'rewrite',
  'right', 'ring',
  'set', 'simpl', 'specialize', 'split', 'subst', 'suff', 'symmetry',
  'transitivity', 'trivial', 'try',
  'unfold', 'unlock', 'using',
  'vm_compute',
  'where', 'wlog'
];

var terminators = [
  'assumption',
  'eassumption',
  'by',
  'contradiction',
  'discriminate',
  'easy',
  'exact',
  'now',
  'lia',
  'omega',
  'reflexivity',
  'tauto'
];

var admitters = [
  'admit',
  'Admitted'
];

const lex_operators =   /* multi-character operators */
  /=+>|:=|<:|<<:|:>|-+>|[<>]-+>?|\\\/|\/\\|>=|<=+|<>|\+\+|::|\|\||&&|\.\./;

const lex_brackets = /\.\(|\{\||\|\}|`\{|`\(/;

// Map assigning each keyword a category.
var words = {};

gallina    .map(function(word){words[word] = 'keyword';});
admitters  .map(function(word){words[word] = 'keyword';});
vernacular .map(function(word){words[word] = 'vernac';});

tactics    .map(function(word){words[word] = 'tactic';});
terminators.map(function(word){words[word] = 'terminator';});

// Tags not handled yet: statementend, variable, coq-bullet, coq-focus; note that in 
const vernacTag = Tag.define("vernac");
const tacticTag = Tag.define("tactic");
const terminatorTag = Tag.define("terminator");

/*
  Rocq mode
*/

interface RocqCMState {
  // only \s caracters seen from the last sentence.
  begin_sentence: boolean,
  // at first (non-comment, non-space) token of sentence.
  is_head: boolean,
  // kind of the head token.
  sentence_kind: string,
  // Level of nested comments.
  commentLevel: number,
  // current active tokenizer.
  tokenize : (stream : StringStream, state : RocqCMState) => string
}

/*
  Core tokenizers:

  + tokenBase: Main parser, it reads the next character and
  setups the next tokenizer. In particular it takes care of
  braces. It doesn't properly analyze the sentences and
  bracketing.

  + tokenStatementEnd: Called when a dot is found in tokenBase,
  it looks ahead on the string and returns statement end.

  + tokenString: Takes care of escaping.

  + tokenComment: Takes care of nested comments.

*/
function tokenBase(stream : StringStream, state : RocqCMState) {

  var at_sentence_start = state.begin_sentence;

  state.is_head = false;

  // If any space in the input, return null.
  if(stream.eatSpace())
    return null;

  if (stream.match(lex_operators)) {
    state.begin_sentence = false;
    return 'operator';
  }

  //if (stream.match(lex_brackets))  return 'bracket';
  // ^ skipped, for the time being, because matchbracket does not support
  //   multi-character brackets.

  if (at_sentence_start) {
    if (stream.match(/[-*+]+|[{}]/)) return 'coq-bullet';
    if (stream.match(/\d+\s*:/)) return 'coq-focus';
  }

  var ch = stream.next();

  if (!ch) return null;

  // Preserve begin sentence after comment.
  if (ch === '(') {
    if (stream.peek() === '*') {
      stream.next();
      state.commentLevel++;
      state.tokenize = tokenComment;
      return state.tokenize(stream, state);
    }
    state.begin_sentence = false;
    return 'paren';
  }

  if( ! (/\s/.test(ch)) ) {
    state.begin_sentence = false;
  }

  if(ch === '.') {
    state.tokenize = tokenStatementEnd;
    return state.tokenize(stream, state);
  }

  if (ch === '"') {
    state.tokenize = tokenString;
    return state.tokenize(stream, state);
  }

  if(ch === ')')
    return 'parenthesis';

  if (/\d/.test(ch)) {
    stream.eatWhile(/[\d]/);
    /*
      if (stream.eat('.')) {
      stream.eatWhile(/[\d]/);
      }
    */
    return 'number';
  }

  if ( /[+\-*&%=<>!?|,;:\^#@~`]/.test(ch)) {
    return 'operator';
  }

  if(/[\[\]]/.test(ch)) {
    return 'bracket';
  }

  /* Identifier or keyword*/
  if (/\w/.test(ch))
    stream.eatWhile(/[\w']/);

  var cur = stream.current(),
  kind = Object.hasOwn(words, cur) ? words[cur] : 'variable';

  if (at_sentence_start) {
    state.sentence_kind = kind;
    state.is_head = true;
  }
  else if (kind === 'tactic' && state.sentence_kind === 'vernac') {
    /* tactics should not occur in vernac (unless "ltac:" is used?) */
    kind = 'variable';
  }

  return kind;
};

function tokenString(stream : StringStream, state : RocqCMState) {
  var next, end = false, escaped = false;
  while ((next = stream.next()) != null) {
    if (next === '"' && !escaped) {
      end = true;
      break;
    }
    escaped = !escaped && next === '\\';
  }
  if (end && !escaped) {
    state.tokenize = tokenBase;
  }
  return 'string';
}

function tokenComment(stream : StringStream, state : RocqCMState) {
  var ch;
  while(state.commentLevel && (ch = stream.next())) {
    if(ch === '(' && stream.peek() === '*') {
      stream.next();
      state.commentLevel++;
    }

    if(ch === '*' && stream.peek() === ')') {
      stream.next();
      state.commentLevel--;
    }
  }

  if(!state.commentLevel)
    state.tokenize = tokenBase;

  return 'comment';
}

function tokenStatementEnd(stream : StringStream, state : RocqCMState) {
  state.tokenize = tokenBase;

  if(stream.eol() || stream.match(/\s/, false)) {
    state.begin_sentence = true;
    state.sentence_kind = undefined;
    return 'statementend';
  }
}

export const rocqParser = StreamLanguage.define({

  name: 'rocq',

  startState() {
    return { begin_sentence: true, is_head: false, sentence_kind: undefined, tokenize: tokenBase, commentLevel: 0 }
  },

  token(stream, state) {
    return state.tokenize(stream, state);
  },

  tokenTable: {
    vernac: vernacTag,
    tactic: tacticTag,
    terminator: terminatorTag
  },

  languageData: {
    commentTokens: {
      block: {
        open: "(*",
        close: "*)"
      }
      // line: null
    }
  }

});

// 2. HighlightStyle mapped to CM6 tags
const rocqHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#98fb98", fontWeight: "bold" },
  { tag: t.comment, color: "#aa5500", fontStyle: "italic" },
  { tag: t.string, color: "#50a14f" },
  { tag: t.number, color: "#986801" },
  { tag: t.operator, color: "#0184bc" },
  { tag: t.punctuation, color: "#383a42" },
  { tag: t.variableName, color: "#383a42" },
  { tag: t.typeName, color: "#c18401" },
  { tag: t.meta, color: "#4078f2" },
  { tag: vernacTag, color: "#3300aa" },
  { tag: tacticTag, color: "#0011FF" },
  { tag: terminatorTag, color: "#FF0000" }
]);

// 3. LanguageSupport factory
export function rocq() {
  return new LanguageSupport(rocqParser, [syntaxHighlighting(rocqHighlightStyle)]);
}

// Local Variables:
// js-indent-level: 2
// End:
