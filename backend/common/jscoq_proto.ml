(* Coq JavaScript API. Based in the coq source code and js_of_ocaml.
 *
 * Copyright (C) 2016-2019 Emilio J. Gallego Arias, Mines ParisTech, Paris.
 * Copyright (C) 2018-2019 Shachar Itzhaky, Technion, Haifa.
 * LICENSE: GPLv3+
 *
 *)

module Stateid  = Serlib.Ser_stateid
module Loc      = Serlib.Ser_loc
module Pp       = Serlib.Ser_pp
module Feedback = Serlib.Ser_feedback
module Names    = Serlib.Ser_names
module Evar     = Serlib.Ser_evar
module Goptions = Serlib.Ser_goptions
module Libnames = Serlib.Ser_libnames
module Vernacexpr = Serlib.Ser_vernacexpr

module Proto = struct

type coq_options = (string list * Goptions.option_value) list [@@deriving yojson]
type lib_path = (string list * string list) list [@@deriving yojson]

type init_options =
  { implicit_libs: bool          [@default true]
  ; coq_options: coq_options     [@default []]
  (* @todo allow to be set in NewDoc too *)
  ; debug: bool                  [@default false]
  ; lib_path: lib_path           [@default []]
  ; lib_init: string list        [@default ["Coq.Init.Prelude"]]
  } [@@deriving yojson]

type search_query =
  [%import: Code_info.Query.t]
  [@@deriving yojson]

module Method = struct

  type t =
    | Mode
    | Goals
    | Search of string
    | TypeAtPoint
    | TypeOfId of string
    | Inspect of search_query
    | Completion of string
  [@@deriving yojson]

end

module Answer = struct

  type t =
  | Goals of (Pp.t, Pp.t) Fleche_lsp.JFleche.GoalsAnswer.t
  | Completion of string list
  | Void
  [@@deriving to_yojson]

end

type opaque
let opaque_to_yojson _x = `Null
let opaque_of_yojson _x = Result.Error "opaque value"

module Request = struct

  type 'a t =
    { uri : Fleche_lsp.JLang.LUri.File.t
    ; loc : int
    (* In fact, we should use Lsp.Base.point instead of int for
       location, however ProseMirror and CM6 use offsets *)
    ; v : 'a
    }
  [@@deriving yojson]

  let make ~uri ~loc v = { uri; loc; v }

  type 'a answer =
    { id : int
    ; res : 'a
    }
  [@@deriving yojson]

  let process { uri; loc; v } ~f =
    f uri loc v

end

(* Main RPC calls *)
type jscoq_cmd =
  | Init    of init_options
  | NewDoc  of { uri : Fleche_lsp.JLang.LUri.File.t; version : int; raw : string }
  | Update  of { uri : Fleche_lsp.JLang.LUri.File.t; version : int; raw : string }

  | Request of { id: int; method_ : Method.t Request.t [@key "method"] }

  | InfoPkg of string * string list
  | LoadPkg of string * string

  (*            filename content *)
  | Register of string
  | Put      of string * string
  | InterruptSetup of opaque
  [@@deriving yojson]

type jscoq_answer =
  | CoqInfo   of string
  | Ready     of unit
  | Notification of
      { uri: Fleche_lsp.JLang.LUri.File.t
      ; version: int
      ; diagnostic: Fleche_lsp.JLang.Diagnostic.t list
      }

  (** LSP-compatible payload for diagnostics *)
  | Response  of Answer.t Request.answer
  | Log       of Feedback.level * Pp.t
  | JsonExn   of string
  [@@deriving to_yojson]
end
