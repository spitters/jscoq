import { Diagnostic } from "../../../backend";
import { CoqManager } from "./coq-manager";
import { ICoqEditor } from "./coq-editor";
import { CoqDocument } from "./coq-document";
import { addDiag, clearDiag, diagField } from "./coq-editor-cm6";

import { Root, createRoot } from 'react-dom/client';
import Markdown from 'react-markdown'
import { Decoration, EditorView } from "@codemirror/view";
import CodeMirror from '@uiw/react-codemirror';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.css';

export class CoqEditorMdView implements ICoqEditor {
    doc: CoqDocument;
    manager: CoqManager;
    root: Root;
    /**
     * mardown content or editors position in subEditors
     */
    parts: (string | number)[];
    /**
     * id of the subEditor where the cursor is
     */
    currentSubEditor: number;
    subEditors: {
        id: number,
        view: EditorView,
        language: string,
        position: {
            start: { line: number, column: number, offset: number },
            end:   { line: number, column: number, offset: number }
        }
    }[];

    constructor(doc : CoqDocument,
                manager: CoqManager,
                container: HTMLDivElement,
                onChange: (doc: CoqDocument) => void,
                onCursorUpdated: (offset : number) => void) {
        this.doc = doc;
        this.manager = manager;
        this.parts = [];
        this.subEditors = [];

        this.root = createRoot(container);
        this.root.render(
            <Markdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={this.codeToCodeMirror(onChange, onCursorUpdated)}
            >
                {this.doc.value}
            </Markdown>
        );
    }

    /**
     * map code blocks to CodeMirror editor
     * @param onChange 
     * @param onCursorUpdated 
     * @returns 
     */
    private codeToCodeMirror(onChange: (doc: CoqDocument) => void,
                             onCursorUpdated: (offset : number) => void) {
        let idx = 0;
        return { code: ({ className, children, node, ...props }: 
                        { className? : string | undefined, children?: any, node?: any }) => {
        if (className === 'language-coq' || className === 'language-rocq') {
            const lang = className.slice('language-'.length);
            const id = idx++;
            let extensions = [
                diagField,
                EditorView.updateListener.of(v => {
                    if (v.selectionSet) {
                        this.currentSubEditor = id;
                        onCursorUpdated(v.state.selection.main.head + this.countPreviousOffset(id));
                    }
                    if (v.docChanged) {
                        this.doc.update(this.getValue());
                        onChange(this.doc);
                    }
                })
            ];
            // code block content
            let text: string = children.toString();
            if (text.endsWith('\n'))
                text = text.slice(0, -1);
            // CodeMirror component
            return <CodeMirror
                key={id}
                value={text}
                basicSetup={false}
                editable={true}
                extensions={extensions}
                onCreateEditor={(v, s) => {
                    // add subEditor in the array
                    this.subEditors.push({
                        id: id,
                        view: v,
                        language: lang,
                        position: node.position
                    });
                    // if all subEditors are added
                    if (this.subEditors.length === idx) {
                        // make sure the order is correct
                        this.subEditors.sort((a, b) => a.id - b.id);
                        // after getting all positions, get all parts of the document
                        this.splitDoc();
                        this.currentSubEditor = 0;
                    }
                }}
            />;
        } else
            // if other language then return regular code block
            return (
                <pre className={className} {...props}>
                    <code>{children}</code>
                </pre>
            );
        }};
    }

    splitDoc() {
        let parts: (string | number)[] = [];
        let start = 0;
        let doc = this.doc.value;
        for (const { id, position, language } of this.subEditors) {
            const codeStart = `\`\`\`${language}\n`,
                  codeEnd   = '\n\`\`\`',
                  startOffset = position.start.offset + codeStart.length,
                  endOffset   = position.end.offset - codeEnd.length;
            // part before code
            parts.push(doc.slice(start, startOffset));
            // editor position in subEditors
            parts.push(id);
            start = endOffset;
        }
        // add the end part
        if (start < doc.length) {
            parts.push(doc.slice(start));
        }
        this.parts = parts;
    }

    private getSubEditorValue(id: number): string {
        if (id < 0 || id >= this.subEditors.length)
            throw Error("invalid argument");
        return this.subEditors[id].view.state.doc.toString();
    }

    getValue(): string {
        // get all parts value
        let values = this.parts.map((p) => (typeof p === "number") ? this.getSubEditorValue(p) : p);
        return values.join('');
    }

    connectWorker() {
        // Send the document creation request.
        this.manager.coq.openDoc({
            uri:        this.doc.uri,
            languageId: this.doc.languageId,
            version:    this.doc.version,
            text:       this.doc.value
        });
    }

    disconnectWorker() {
        this.manager.coq.closeDoc({ uri: this.doc.uri });
    }

    clearDiagnostics(): void {
        var tr = { effects: clearDiag.of({}) };
        for (const e of this.subEditors) {
            e.view.dispatch(tr);
        }
    }

    markDiagnostic(diag: Diagnostic): void {
        var from = diag.range.start.offset, to = diag.range.end.offset;
        var mclass = (diag.severity === 1) ? 'coq-eval-failed' : 'coq-eval-ok';
        const diagMark = Decoration.mark( { class: mclass } );

        // find subEditor
        let offset = 0;
        for (const p of this.parts) {
            if (typeof p === "string")
                offset += p.length;
            else { // p represents subEditor's position
                const length = this.getSubEditorValue(p).length;
                // check offset <= from < to <= (offset + length)
                if (offset <= from && to <= offset + length) {
                    var tr = {
                        effects: addDiag.of({
                            from: from - offset,
                            to: to - offset,
                            d : diagMark
                        })
                    };
                    this.subEditors[p].view.dispatch(tr);
                    break;
                } else
                    offset += length
            }
        }

        // Debug code.
        {
            let from = { line: diag.range.start.line, ch: diag.range.start.character },
                to = { line: diag.range.end.line, ch: diag.range.end.character };

            console.log(`mark from (${from.line},${from.ch}) to (${to.line},${to.ch}) class: ${mclass}`);
            if (diag.extra) console.log('extra: ', diag.extra);
        }
    }

    private countPreviousOffset(id: number) {
        if (id < 0 || id >= this.subEditors.length)
            throw Error("invalid argument");
        let offset = 0;
        for (const p of this.parts) {
            if (typeof p === "number")
                if (p === id)
                    return offset;
                else
                    offset += this.getSubEditorValue(p).length;
            else
                offset += p.length;
        }
        throw Error("incoherent editor.parts");
    }

    getCursorOffset(): number {
        if (this.currentSubEditor === undefined)
            return 0;
        let currentOffset = this.subEditors[this.currentSubEditor].view.state.selection.main.head
        return this.countPreviousOffset(this.currentSubEditor) + currentOffset;
    }

    configure(opts: any): void {}
    openFile(file: File): void {}
    focus(): void {}

    destroy(): void {
        this.root.unmount();
    }
}