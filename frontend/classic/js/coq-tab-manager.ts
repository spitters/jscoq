import { CoqDocument } from "./coq-document";
import { CoqManager } from "./coq-manager";
import { CoqTab } from "./coq-tab";

export class TabManager {
    
    tabs: CoqTab[];
    current_tab: CoqTab;
    manager: CoqManager;
    tab_container: HTMLElement;

    onChange: (newContent: string) => void;
    onCursorUpdated: (offset: number) => void;

    constructor(manager: CoqManager, 
                onChange: (newContent: string) => void,
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

    createTab(doc: CoqDocument) {
        const CoqEditor = this.manager.getEditorConstructor(this.manager.options.frontend);
        let tab = new CoqTab(doc, CoqEditor, this.onChange, this.onCursorUpdated, this.manager, this.tab_container);
        this.tabs.push(tab);
        if (this.tabs.length > 1) {
            tab.hide();
        } else {
            tab.show();
            tab.addSelectedStyle();
        }
        return tab;
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