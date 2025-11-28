import { openDB } from "idb";

type Database = {
    // { "filename": "content" }
    documents: Record<string, string>;
}

const documentStore = "documents";

const database = openDB<Database>("jsCoqDB", 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains(documentStore)) {
            db.createObjectStore(documentStore);
        }
    },
});

export async function getAllFiles(): Promise<Record<string, string>> {
    const db = await database;
    const filenames = await db.getAllKeys(documentStore);
    const result: Record<string, string> = {};
    // get all values using key
    for (const filename of filenames) {
        const value = await db.get(documentStore, filename as string);
        if (value !== undefined) {
            result[filename as string] = value;
        }
    }
    return result;
}

export async function replaceAllFiles(documents: Record<string, string>): Promise<void> {
    const db = await database;
    // use transaction to replace atomically
    const tx = db.transaction(documentStore, "readwrite");
    const store = tx.objectStore(documentStore);
    // delete all
    await store.clear();
    // save all
    for (const [filename, content] of Object.entries(documents)) {
        await store.put(content, filename);
    }
    try {
        // end transaction
        await tx.done;
    } catch (err) {
        console.error(err);
    }
}
