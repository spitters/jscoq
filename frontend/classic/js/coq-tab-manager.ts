import { CoqDocument } from "./coq-document";
import { CoqManager } from "./coq-manager";
import { CoqTab } from "./coq-tab";

export class CoqTabManager {
    
    tabs: CoqTab[];
    current_tab: CoqTab;
    manager: CoqManager;
    tab_container: HTMLElement;
    private connected : boolean = false;

    onChange: (doc: CoqDocument) => void;
    onCursorUpdated: (offset: number) => void;

    constructor(manager: CoqManager, 
                onChange: (doc: CoqDocument) => void,
                onCursorUpdated: (offset: number) => void) {
        this.manager = manager;
        this.tabs = [];
        this.onChange = onChange;
        this.onCursorUpdated = onCursorUpdated;

        if (manager.options.multiple_editors) {
            // tab container
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
            this.tab_container = parent;
        }
    }

    connectWorker() {
        if (this.connected) return;
        this.connected = true;
        for (let tab of this.tabs) {
            tab.connectWorker();
        }
    }

    setCurrent(tab: CoqTab) {
        if (tab === this.current_tab)
            return;
        // process old current
        if (this.current_tab) {
            this.current_tab.hide();
            this.current_tab.removeSelectedStyle();
        }
        // process new current
        this.current_tab = tab;
        if (tab) {
            tab.show();
            tab.addSelectedStyle();
        }
    }

    findTab(doc: CoqDocument) {
        for (let tab of this.tabs) {
            if (tab.editor.doc === doc)
                return tab;
        }
        return null;
    }

    getEditorWithUri(uri: string) {
        const tab = this.tabs.find((tab) => tab.editor.doc.uri === uri);
        return (tab) ? tab.editor : null;
    }

    createTab(doc: CoqDocument) {
        const CoqEditor = this.manager.getEditorConstructor(this.manager.options.frontend);
        let tab = new CoqTab(doc,
                             CoqEditor,
                             this.onChange,
                             this.onCursorUpdated,
                             this.manager,
                             this.tab_container);
        this.tabs.push(tab);
        tab.hide();
        if (this.connected)
            tab.connectWorker();
        return tab;
    }

    closeTab(tab: CoqTab) {
        this.tabs = this.tabs.filter((t) => t !== tab);
        tab.close();
    }

    closeTabWithDoc(doc: CoqDocument) {
        let changeCurrent = this.current_tab && this.current_tab.editor.doc === doc;
        this.tabs = this.tabs.filter((t) => {
            if (t.editor.doc === doc) {
                t.close();
                return false;
            } else
                return true;
        });
        if (changeCurrent)
            this.setCurrent((this.tabs.length > 0) ? this.tabs[0] : null);
    }

    closeAll() {
        for (const tab of this.tabs) {
            tab.close();
        }
        this.tabs.splice(0);
        this.current_tab = null;
    }

}