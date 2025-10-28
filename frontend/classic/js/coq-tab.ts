import { CoqDocument } from "./coq-document";
import { createEditorContainer, ICoqEditor, ICoqEditorConstructor } from "./coq-editor";
import { CoqEditorMdView } from "./coq-editor-mdview";
import { CoqManager } from "./coq-manager";

export class CoqTab {
    tab: HTMLButtonElement;
    editor: ICoqEditor;
    container: HTMLDivElement;
    private connected: boolean = false;

    constructor(doc: CoqDocument,
                CoqEditor: ICoqEditorConstructor,
                onChange: (doc: CoqDocument) => void,
                onCursorUpdated: (offset: number) => void,
                manager: CoqManager,
                parent: HTMLElement) {
        this.container = createEditorContainer();
        this.editor = new CoqEditor(doc, manager, this.container, onChange, onCursorUpdated);
        // create tab button
        if (!manager.options.multiple_editors) {
            this.tab = null;
        } else {
            let tab = this.createTabButton(doc, manager);
            this.tab = tab;
            parent.appendChild(tab);
        }
    }

    private createTabButton(doc: CoqDocument, manager: CoqManager) {
        let tab = document.createElement('button');
        tab.classList.add('tabButton');
        tab.innerText = doc.filename;
        let tab_manager = manager.tab_manager;
        tab.addEventListener('click', (ev: MouseEvent) => {
            if (ev.target !== tab)
                return;
            if (this !== tab_manager.current_tab) {
                tab_manager.setCurrent(this);
            }
        });
        // to close tab
        let onClickClose = (ev: MouseEvent) => {
            tab_manager.closeTab(this);
            if (this === tab_manager.current_tab) {
                tab_manager.setCurrent((tab_manager.tabs.length > 0) ? tab_manager.tabs[0] : null);
            }
        };
        let s = this.createCloseButton(onClickClose);
        tab.appendChild(s);
        return tab;
    }

    private createCloseButton(onClickClose: (ev: MouseEvent) => void) {
        let s = document.createElement('span');
        s.classList.add('closeButton');
        s.textContent = '×';
        s.addEventListener('click', onClickClose);
        return s;
    }

    connectWorker() {
        if (this.connected)
            return;
        this.connected = true;
        this.editor.connectWorker();
    }

    disconnectWorker() {
        if (!this.connected)
            return;
        this.connected = false;
        this.editor.disconnectWorker();
    }

    switchView(manager: CoqManager,
               onChange: (doc: CoqDocument) => void,
               onCursorUpdated: (offset: number) => void) {
        const doc = this.editor.doc;
        const connected = this.connected;
        // remove current editor
        if (connected)
            this.disconnectWorker();
        this.editor.destroy();
        this.container.replaceChildren();
        // create new editor
        const frontend = (this.editor instanceof CoqEditorMdView) ? 'cm6' : 'mdview';
        const CoqEditor = manager.getEditorConstructor(frontend);
        const editor = new CoqEditor(doc, manager, this.container, onChange, onCursorUpdated);
        this.editor = editor;
        if (connected) // reconnect
            this.connectWorker();
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
        if (this.connected)
            this.editor.disconnectWorker();
        this.editor.destroy();
    }
}