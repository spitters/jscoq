/**
 * An implementation of `CoqEditor` for CodeMirror 5.
 */
// CodeMirror implementation
import { Diagnostic } from '../../../backend';
import { ProviderContainer } from './cm-provider-container';
import { CoqManager, ManagerOptions } from './coq-manager';
import { ICoqEditor } from './coq-editor';

interface CM5Options {
    mode?: { "company-coq": boolean }
}

// Big TODO: A few operations only work for the first snippet, need to fix.
// Search for snippets[0]

/** Interface for CM5 */
export class CoqCodeMirror5 extends ProviderContainer implements ICoqEditor {

    constructor(eIds: (string | HTMLElement)[], options : ManagerOptions, onChange, onCursorUpdate, manager : CoqManager) {

        super(eIds, options, manager);

        this.onChangeAny = () => {
            let txt = this.getValue();
            onChange(txt);
        };
        this.onCursorUpdate = (cm) => {
            onCursorUpdate(this.getCursorOffset());
        }
        // if (this.options.mode && this.options.mode['company-coq']) {
        //     this.company_coq = new CompanyCoq(this.manager);
        //     this.company_coq.attach(this.editor);
        // }
    }

    getValue() {
        return this.snippets.map(part => part.editor.getValue()).join('\n');
    }

    clearDiagnostics() {
        for (let part of this.snippets)
            part.retract();
    }

    markDiagnostic(diag: Diagnostic) {
        console.log(diag);
        // Find the part that contains the target line
        let ln = 0, start_ln = diag.range.start.line;
        var in_part = this.snippets[0];
        for (let part of this.snippets) {
            let nlines = part.editor.lineCount();
            if (start_ln >= ln && start_ln < ln + nlines) {
                in_part = part;
                break;
            }
            else {
                ln += nlines;
            }
        }
        // Adjust the mark for the line offset
        diag.range.start.line -= ln;
        diag.range.end.line -= ln;
        in_part.mark(diag);
    }

    /** The snippet that currently owns the cursor. */
    _focusedSnippet() {
        return this.snippets.find(sp => sp.editor?.hasFocus?.()) ||
               this.currentFocus || this.snippets[0];
    }

    /** Global document offset: the document is snippet texts joined with
     *  a single newline (see getValue), so each earlier snippet
     *  contributes length + 1. Upstream returned snippet 0's local offset,
     *  which makes goals-at-cursor useless on multi-snippet (coqdoc) pages. */
    getCursorOffset(): number {
        let sp = this._focusedSnippet(),
            off = sp.getCursorOffset();
        for (let s of this.snippets) {
            if (s === sp) break;
            off += s.editor.getValue().length + 1;
        }
        return off;
    }

    setCursorOffset(offset: number) {
        for (let s of this.snippets) {
            let len = s.editor.getValue().length;
            if (offset <= len) { s.setCursorOffset(offset); s.focus(); return; }
            offset -= len + 1;
        }
        let last = this.snippets[this.snippets.length - 1];
        last?.setCursorOffset(last.editor.getValue().length);
    }

    /** Distribute the checked-prefix mark across snippets: the document is
     *  snippet texts joined with newlines, so shade each snippet up to its
     *  covered portion (fully, partially, or clear). */
    markProgress(offset: number) {
        for (let s of this.snippets) {
            let len = s.editor.getValue().length;
            s.markProgress(Math.max(0, Math.min(offset, len)));
            offset -= len + 1;
        }
    }
}
