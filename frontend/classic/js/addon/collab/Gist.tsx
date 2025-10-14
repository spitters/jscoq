import React from "react";
import ReactDOM from "react-dom/client";

import GistComponent, {File} from "./GistComponent";
import "./gist.css";
import { CoqManager } from "../../coq-manager";
import { CoqDocumentManager } from "../../coq-document-manager";
import { CoqTabManager } from "../../coq-tab-manager";

export class Gist {
  coq: CoqManager;
  docs: CoqDocumentManager;
  tabs: CoqTabManager;

  withCoqManager(coq: CoqManager) {
    this.coq = coq;
    this.docs = coq.doc_manager;
    this.tabs = coq.tab_manager;
    return this;
  }

  static attach(coq: CoqManager, gistID: string) {
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
    this.docs.createDocument(content, filename);
  }

  setFiles(files: File[]) {
    this.docs.deleteAllDocuments();
    for (let index = 0; index < files.length; index++) {
      this.setFile(files[index]);
    }
    if (files.length === 0) {
      let extension = this.coq.options.content_type === 'plain' ? '.v' : '.mv';
      this.setFile({ filename: "gistfile1" + extension, content: ""});
    }
    this.tabs.setCurrent(this.tabs.createTab(this.docs.documents[0]));
  }

  getFiles(): File[] {
    let files: File[] = [];
    for (const doc of this.docs.documents) {
      files.push({filename: doc.getFilename(), content: doc.getValue()});
    }
    return files;
  }
}
