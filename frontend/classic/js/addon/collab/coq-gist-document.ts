import { CoqDocument } from "../../coq-document";

export class CoqGistDocument extends CoqDocument {

    constructor(content: string, filename: string) {
        super(content, filename);
        this.uri = "gist:///src/" + filename;
    }

    // save()
}
