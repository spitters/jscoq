import { CoqDocument } from "./coq-document";
import { ICoqEditor, ICoqEditorConstructor } from "./coq-editor";
import { CoqManager } from "./coq-manager";

export class CoqTab {
    tab: HTMLButtonElement;
    doc: CoqDocument;
    editor: ICoqEditor;

    constructor(doc: CoqDocument,
                CoqEditor: ICoqEditorConstructor,
                onChange: (newContent: string) => void,
                onCursorUpdated: (offset: number) => void,
                manager: CoqManager) {
        this.doc = doc;
        this.editor = new CoqEditor(doc, manager, onChange, onCursorUpdated);
        // create tab
        let parent = document.getElementById('tabs');
        if (!manager.options.multiple_editors) {
            this.tab = null;
        } else {
            let tab = document.createElement('button');
            tab.classList.add('tab');
            tab.addEventListener('click', (ev: MouseEvent) => {
                let tab_manager = manager.tab_manager;
                if (this !== tab_manager.current_tab) {
                    // process old current
                    tab_manager.current_tab.hide();
                    tab_manager.current_tab.removeSelectedStyle();
                    // process new current
                    this.show();
                    this.addSelectedStyle();
                    tab_manager.current_tab = this;
                }
            });
            tab.innerText = doc.getFilename();
            this.tab = tab;
            parent.appendChild(tab);
        }
    }

    addSelectedStyle() {
        if (this.tab)
            this.tab.classList.add('selected');
    }

    removeSelectedStyle() {
        if (this.tab)
            this.tab.classList.remove('selected');
    }

    show() {
        this.editor.show();
    }

    hide() {
        this.editor.hide();
    }

    close() {
        this.editor.close();
        this.tab.remove();
    }
}