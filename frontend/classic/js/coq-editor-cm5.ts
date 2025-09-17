/**
 * An implementation of `CoqEditor` for CodeMirror 5.
 */
// CodeMirror implementation
import { Diagnostic } from '../../../backend';
import { ProviderContainer } from './cm-provider-container';
import { CoqManager, ManagerOptions } from './coq-manager';
import { ICoqEditor } from './coq-editor';
import { CoqDocument } from './coq-document';

interface CM5Options {
    mode?: { "company-coq": boolean }
}

// Big TODO: A few operations only work for the first snippet, need to fix.
// Search for snippets[0]

/** Interface for CM5 */
export class CoqCodeMirror5 extends ProviderContainer implements ICoqEditor {

    doc : CoqDocument;

    constructor(doc : CoqDocument,
                manager: CoqManager,
                container: HTMLDivElement,
                onChange: (newContent : string) => void,
                onCursorUpdated: (offset : number) => void) {

        super([container], manager, doc);
        
        this.doc = doc;
        if (this.getValue())
            this.doc.update(this.getValue());
        
        this.onChangeAny = () => {
            let txt = this.getValue();
            this.doc.update(txt)
            onChange(txt);
        };
        this.onCursorUpdate = (cm) => {
            onCursorUpdated(this.getCursorOffset());
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

    getCursorOffset(): number {
        return this.snippets[0].getCursorOffset();
    }
}
