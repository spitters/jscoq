
import React, { useState, Dispatch, SetStateAction, MouseEvent, useContext, createContext } from "react";
import ReactDOM from "react-dom/client";
import { CoqDocumentManager } from "./coq-document-manager"
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
  doc_manager: CoqDocumentManager;
  onDocButtonClick: (doc: CoqDocument, ev: any) => void;
  onDocButtonClose: (doc: CoqDocument) => void;
  onAddDocClick: (fn: string) => void;
};

function DocumentManagerComponent({ 
  doc_manager,
  onDocButtonClick,
  onDocButtonClose,
  onAddDocClick,
}: DocumentManagerComponentProps) {
  const [docs, setDocs]: [CoqDocument[], Dispatch<SetStateAction<CoqDocument[]>>] = useState(doc_manager.documents);
  const [fn, setFn]: [string , Dispatch<SetStateAction<string>>] = useState("");
  // ***TODO
  doc_manager.setDocs = setDocs;

  let addButton = (
    <button onClick={() => {
        onAddDocClick(fn);
        setFn("");
        // setDocs([...doc_manager.documents]);
      }}>
      {"Add doc"}
    </button>
  );
  let inputFn = (
    <input
      placeholder="filename"
      value={fn}
      onChange={(v) => setFn(v.target.value)}
      // style={{width: "160px"}}
    />
  );

  return (
    <>
      {addButton}
      {inputFn}
      <DocumentList
        docs={docs}
        onClick={onDocButtonClick}
        onClose={onDocButtonClose}
      />
    </>
  );
}

export function initDocumentManagerComponent(doc_manager: CoqDocumentManager) {
  let onDocButtonClick = (doc: CoqDocument, ev: MouseEvent) => {
    if (!(ev.target instanceof HTMLButtonElement)) return;
    // console.log("click");
    let tab_manager = doc_manager.manager.tab_manager;
    let tab = tab_manager.findTab(doc);
    if (!tab)
      tab = tab_manager.createTab(doc);
    tab_manager.setCurrent(tab);
  };
  
  let onDocButtonClose = (doc: CoqDocument) => {
    if (window.confirm(`Are you sure you want to delete ${doc.getFilename()} ?`)) {
      // console.log("close");
      doc_manager.deleteDocument(doc);
    }
  };
  
  let onAddDocClick = (fn: string) => {
    // console.log("add");
    const n = doc_manager.documents.length + 1;
    const filename = "untitled" + n + ((doc_manager.manager.options.content_type === 'plain') ? '.v' : '.mv');
    doc_manager.createDocument("", (fn !== "") ? fn : filename);
  };

  // to get icon
  const getURL = (relative: string) =>
    new URL(relative, doc_manager.manager.options.base_path);
  
  const rootElement = document.getElementById(doc_manager.container_id);
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <URLContext.Provider value={getURL}>
        <DocumentManagerComponent
        doc_manager={doc_manager}
        onDocButtonClick={onDocButtonClick}
        onDocButtonClose={onDocButtonClose}
        onAddDocClick={onAddDocClick}
        />
      </URLContext.Provider>
    </React.StrictMode>
  );
}