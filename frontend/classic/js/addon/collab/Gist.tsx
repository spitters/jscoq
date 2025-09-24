import React from "react";
import ReactDOM from "react-dom/client";

import GistComponent, {File} from "./GistComponent";
import "./gist.css";
import { CoqManager } from "../../coq-manager";
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

  setFile({ filename, content }: File) {
    this.coq.createDocument(content, filename);
  }

  setFiles(files: File[]) {
    this.coq.deleteAllDocuments();
    for (let index = 0; index < files.length; index++) {
      this.setFile(files[index]);
    }
    if (files.length === 0) {
      this.setFile({ filename: "gistfile1.txt", content: ""});
    }
    this.tabs.setCurrent(this.tabs.createTab(this.coq.documents[0]));
  }

  getFiles(): File[] {
    let files: File[] = [];
    for (const doc of this.coq.documents) {
      files.push({filename: doc.getFilename(), content: doc.getValue()});
    }
    return files;
  }
}
