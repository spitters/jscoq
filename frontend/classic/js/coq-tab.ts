import { CoqDocument } from "./coq-document";
import { createEditorContainer, ICoqEditor, ICoqEditorConstructor } from "./coq-editor";
import { CoqManager } from "./coq-manager";

export class CoqTab {
    tab: HTMLButtonElement;
    editor: ICoqEditor;
    container: HTMLDivElement;

    constructor(doc: CoqDocument,
                CoqEditor: ICoqEditorConstructor,
                onChange: (newContent: string) => void,
                onCursorUpdated: (offset: number) => void,
                manager: CoqManager,
                parent: HTMLElement) {
        this.container = createEditorContainer();
        this.editor = new CoqEditor(doc, manager, this.container, onChange, onCursorUpdated);
        // create tab
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
        if (doc.entryButton)
            doc.entryButton.setAttribute("disabled", "true");
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
        this.container.style.display = '';
    }

    hide() {
        this.container.style.display = 'none';
    }

    close() {
        this.container.remove();
        this.tab.remove();
    }
}