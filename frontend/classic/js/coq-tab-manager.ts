import { CoqDocument } from "./coq-document";
import { CoqManager } from "./coq-manager";
import { CoqTab } from "./coq-tab";

export class TabManager {
    
    tabs: CoqTab[];
    current_tab: CoqTab;
    manager: CoqManager;

    onChange: (newContent: string) => void;
    onCursorUpdated: (offset: number) => void;

    constructor(manager: CoqManager, 
                onChange: (newContent: string) => void,
                onCursorUpdated: (offset: number) => void,
                elems?: string[]) {
        this.manager = manager;
        this.tabs = [];
        this.onChange = onChange;
        this.onCursorUpdated = onCursorUpdated;
        for (const eId of elems) {
            const doc = this.processElem(eId);
            if (doc) {
                this.createTab(doc);
            }
        }
        if (this.tabs.length > 0) {
            this.current_tab = this.tabs[0];
        } else {
            const default_doc = new CoqDocument("```coq\nCheck nat.\n```", "untitled1");
            this.current_tab = this.createTab(default_doc);
        }
    }

    processElem(eId: string): CoqDocument {
        var area : HTMLTextAreaElement = document.getElementById(eId) as HTMLTextAreaElement;
        if (! (area instanceof HTMLTextAreaElement)) {
            // ***TODO 'ide-wrapper'
            if (eId === 'ide-wrapper') return null;
            throw new Error(`not implemented: '${eId}' must be a textarea`);
            // console.error(`not implemented: '${eId}' must be a textarea`);
            // return null;
        }
        area.style.display = 'none';
        const CoqDocument = this.manager.getDocumentConstructor();
        return new CoqDocument(area.value, eId); // ***TODO filename;
    }

    createTab(doc: CoqDocument) {
        const CoqEditor = this.manager.getEditorConstructor(this.manager.options.frontend);
        let tab = new CoqTab(doc, CoqEditor, this.onChange, this.onCursorUpdated, this.manager);
        this.tabs.push(tab);
        if (this.tabs.length > 1) {
            tab.hide();
        } else {
            tab.show();
            tab.addSelectedStyle();
        }
        return tab;
    }

    addFileTab() {
        const parent_id = 'tabs';
        let parent = document.getElementById(parent_id);
        if (!parent) {
            const wrapper_id = 'ide-wrapper'
            const wrapper_elem = document.getElementById(wrapper_id);
            if (!wrapper_elem)
                throw new Error(`wrapper element '${wrapper_id}' not found`);
            let p = document.createElement('div');
            p.setAttribute('id', parent_id);
            p.setAttribute('style', 'display: flex; flex-direction: column;');
            wrapper_elem.parentElement.insertBefore(p, wrapper_elem);
            parent = p;
        }
        let onClick = ((ev: MouseEvent) => {
            let newDoc : CoqDocument;
            const CoqDocument = this.manager.getDocumentConstructor();
            const n = this.tabs.length + 1;
            newDoc = new CoqDocument("", "untitled" + n);
            this.createTab(newDoc);
        });
        let tab = document.createElement('button');
        tab.addEventListener('click', onClick);
        tab.innerText = 'Add file';
        parent.insertBefore(tab, parent.firstChild);
    }

    // TODO close one tab

    closeAll() {
        for (const tab of this.tabs) {
            tab.close();
        }
        this.tabs.splice(0);
        this.current_tab = null;
    }

}