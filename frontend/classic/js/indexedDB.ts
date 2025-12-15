import { openDB } from "idb";

type Database = {
    // { "filename": "content" }
    [documentStore]: Record<string, string>;
}

// store to cache documents, could add for example a store for user's preferences, settings...
const documentStore = "documents";

// all stores, currently only one
const stores = [documentStore];

const database = openDB<Database>("jsCoqDB", 1, {
    upgrade(db) {
        for (const store of stores) {
            if (!db.objectStoreNames.contains(store)) {
                db.createObjectStore(store);
            }
        }
    },
});

async function getFile(filename: string) : Promise<string | undefined> {
    try {
        const db = await database;
        return await db.get(documentStore, filename);
    } catch (error) {
        console.warn(`Failed to retrieve '${filename}' from cache`, error);
        return undefined;
    }
}

export async function addFile(content: string, filename: string) : Promise<void> {
    try {
        const db = await database;
        await db.put(documentStore, content, filename);
    } catch (error) {
        console.warn(`Failed to add or update '${filename}' in cache`, error);
    }
}

export async function deleteFile(filename: string) : Promise<void> {
    try {
        const db = await database;
        await db.delete(documentStore, filename);
    } catch (error) {
        console.warn(`Failed to delete '${filename}' from cache`, error);
    }
}

export async function getAllFiles(): Promise<Record<string, string> | undefined> {
    try {
        const db = await database;
        const filenames = await db.getAllKeys(documentStore);
        const contents = await db.getAll(documentStore);
        const result: Record<string, string> = {};
        filenames.forEach((key, i) => {
            result[key as string] = contents[i];
        });
        return result;
    } catch (error) {
        console.warn(`Failed to retrieve all cached files`, error);
        return undefined;
    }
}

export async function replaceAllFiles(documents: Record<string, string>): Promise<void> {
    try {
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
        // end transaction
        await tx.done;
    } catch (error) {
        console.warn(`Failed to replace all cached files`, error);
    }
}
