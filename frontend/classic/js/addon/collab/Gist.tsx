import React from "react";
import ReactDOM from "react-dom/client";

import GistComponent, {File} from "./GistComponent";
import "./gist.css";
import { CoqManager } from "../../coq-manager";
import { CoqGistDocument } from "./coq-gist-document";
import { TabManager } from "../../coq-tab-manager";

export class Gist {
  coq: CoqManager;
  tabs: TabManager;

  withCoqManager(coq: CoqManager) {
    this.coq = coq;
    this.tabs = coq.tab_manager;
    return this;
  }

  static attach(coq: any, gistID: string) {
    const collab = new Gist().withCoqManager(coq);
    collab.init(gistID);
    return collab;
  }

  init(gistID: string) {
    const rootElement = document.getElementById("gist-root");
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <GistComponent gist={this} startGistID={gistID}/>
      </React.StrictMode>
    );
  }

  setFile({ idx, filename, content }: File) {
    const newDoc = new CoqGistDocument(content, filename);
    this.tabs.createTab(newDoc);
  }

  setFiles(files: File[]) {
    this.tabs.closeAll();
    for (let index = 0; index < files.length; index++) {
      this.setFile(files[index]);
    }
    if (files.length === 0) {
      this.setFile({ idx: 0, filename: "gistfile1.txt", content: ""});
    }
    this.tabs.current_tab = this.tabs.tabs[0];
  }

  getFiles(): File[] {
    // ***TODO better access to docs / editors ?
    let files: File[] = [];
    for (let index = 0; index < this.tabs.tabs.length; index++) {
      const tab = this.tabs.tabs[index];
      files.push({idx: index, filename: tab.doc.getFilename(), content: tab.editor.getValue()});
    }
    return files;
  }
}
