import { Diagnostic } from "../../../backend";
import { CoqManager } from "./coq-manager";
import { ICoqEditor } from "./coq-editor";
import { CoqDocument } from "./coq-document";

import { Root, createRoot } from 'react-dom/client';
import Markdown from 'react-markdown'
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
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
                    EditorView.updateListener.of(v => {
                        if (v.selectionSet) {
                            this.currentSubEditor = id;
                            onCursorUpdated(v.state.selection.main.head + this.countPreviousOffset(id));
                        }
                        if (v.docChanged) {
                            // Document changed
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
                        this.subEditors.push({ id: id, view: v, language: lang, position: node.position });
                        if (this.subEditors.length === idx) {
                            this.subEditors.sort((a, b) => a.id - b.id);
                            this.splitDoc();
                            this.currentSubEditor = 0;
                        }
                    }}
                />;
            } else {
                // if other language return regular code block
                return (
                    <pre className={className} {...props}>
                        <code>{children}</code>
                    </pre>
                );
            }
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
        // end part
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

    destroy(): void {
        this.manager.coq.closeDoc({ uri: this.doc.uri });
        this.root.unmount();
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

    clearDiagnostics(): void {}
    markDiagnostic(diag: Diagnostic): void {}
    configure(opts: any): void {}
    openFile(file: File): void {}
    focus(): void {}
}