
import React, { useState, Dispatch, SetStateAction, MouseEvent, useContext, createContext } from "react";
import ReactDOM from "react-dom/client";

import { CoqManager } from "./coq-manager";
import { CoqDocumentManager } from "./coq-document-manager";
import { CoqDocument } from "./coq-document";

const URLContext = createContext<(relative: string) => URL>(null);

type DocumentButtonProps = {
  doc: CoqDocument;
  onClick: (doc: CoqDocument, ev: any) => void;
  onClose: (doc: CoqDocument) => void;
};

function DocumentButton({
  doc,
  onClick,
  onClose,
}: DocumentButtonProps) {
  const getURL = useContext(URLContext);
  // from https://feathericons.com
  let src = getURL("frontend/classic/images/trash-2.svg").toString();
  return (
    <button className="docButton" onClick={(ev) => onClick(doc, ev)}>
      {doc.getFilename()}
      <img src={src} className="deleteButton" onClick={() => onClose(doc)}/>
    </button>
  );
}

type DocumentListProps = {
  docs: CoqDocument[];
  onClick: (doc: CoqDocument, ev: any) => void;
  onClose: (doc: CoqDocument) => void;
};

function DocumentList({
  docs,
  onClick,
  onClose,
}: DocumentListProps) {
  return (
    <>
      {docs.map((doc, idx) => (
        <DocumentButton
          key={idx}
          doc={doc}
          onClick={onClick}
          onClose={onClose}
        />
      ))}
    </>
  );
}

type DocumentManagerComponentProps = {
  manager: CoqManager;
  onDocButtonClick: (doc: CoqDocument, ev: any) => void;
  onDocButtonClose: (doc: CoqDocument) => void;
  onAddDocClick: (fn: string) => boolean;
};

function DocumentManagerComponent({ 
  manager,
  onDocButtonClick,
  onDocButtonClose,
  onAddDocClick,
}: DocumentManagerComponentProps) {
  const [docs, setDocs]: [CoqDocument[], Dispatch<SetStateAction<CoqDocument[]>>] = useState(manager.doc_manager.documents);
  const [fn, setFn]: [string , Dispatch<SetStateAction<string>>] = useState("");
  const [haveCollab, setHaveCollab]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(manager.isCollabOpened());
  const [show, setShow]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false);
  const getURL = useContext(URLContext);
  // from https://feathericons.com
  let srcHide = getURL("frontend/classic/images/chevrons-left.svg").toString();
  let srcShow = getURL("frontend/classic/images/chevrons-right.svg").toString();
  // ***TODO
  (manager.doc_manager as CoqDocumentManager).setDocs = setDocs;

  let addButton = (
    <button onClick={() => {
        if (onAddDocClick(fn))
          setFn("");
        // setDocs([...doc_manager.documents]);
    }}>
      Add document
    </button>
  );
  let inputFn = (
    <input
      name="filename"
      placeholder="filename"
      value={fn}
      onChange={(v) => setFn(v.target.value.trim())}
      // style={{ width: "160px" }}
    />
  );
  let openCollabButton = (
    <button onClick={() => {
      if (!haveCollab) {
        manager.openCollab();
        setHaveCollab(true);
      } else {
        manager.closeCollab();
        setHaveCollab(false);
      }
    }}>
      { ((!haveCollab) ? "Open" : "Close") + " Gist" /* or "Collab" ? */}
    </button>
  );
  let showButton = (
    <button 
      onClick={() => setShow(() => !show)}
      style={{ minWidth: "30px", padding: "0px" }}
    >
      <img src={ (show) ? srcHide : srcShow }/>
    </button>
  );
  let content = (
    <>
      {addButton}
      {inputFn}
      <DocumentList
        docs={docs}
        onClick={onDocButtonClick}
        onClose={onDocButtonClose}
      />
      {openCollabButton}
    </>
  );
  return (
    <>
      {showButton}
      {show && content}
    </>
  )
}

export function initDocumentManagerComponent(manager: CoqManager) {
  // open doc
  let onDocButtonClick = (doc: CoqDocument, ev: MouseEvent) => {
    if (!(ev.target instanceof HTMLButtonElement)) return;
    // console.log("click");
    let tab_manager = manager.tab_manager;
    let tab = tab_manager.findTab(doc);
    if (!tab)
      tab = tab_manager.createTab(doc);
    tab_manager.setCurrent(tab);
  };
  
  // delete doc
  let onDocButtonClose = (doc: CoqDocument) => {
    if (window.confirm(`Are you sure you want to delete '${doc.getFilename()}' ?`)) {
      // console.log("close");
      manager.doc_manager.deleteDocument(doc);
    }
  };
  
  let onAddDocClick = (fn: string) => {
    // console.log("add");
    if (!fn) {
      const extension = (manager.options.content_type === 'plain') ? '.v' : '.mv';
      let n = manager.doc_manager.documents.length + 1;
      let filename = "untitled" + n + extension;
      while (!manager.doc_manager.createDocument("", filename)) {
        filename = "untitled" + (++n) + extension;
      }
      return true;
    } else {
      const createSuccess = manager.doc_manager.createDocument("", fn);
      if (!createSuccess) {
        // ***TODO use notif like gist component
        window.alert(`This filename '${fn}' already exists.`);
        return false;
      } else
        return true;
    }
  };

  // to get icon
  const getURL = (relative: string) =>
    new URL(relative, manager.options.base_path);
  
  const rootElement = document.getElementById(manager.doc_manager.container_id);
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <URLContext.Provider value={getURL}>
        <DocumentManagerComponent
        manager={manager}
        onDocButtonClick={onDocButtonClick}
        onDocButtonClose={onDocButtonClose}
        onAddDocClick={onAddDocClick}
        />
      </URLContext.Provider>
    </React.StrictMode>
  );
}