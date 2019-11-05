import { Disposable, languages, TextDocument, Range, Position, workspace, Location, Uri } from "vscode";
import { findReferences } from "../phpactor/phpactor";
import { handleResponse } from "../phpactor/response-handler";

async function handle(document: TextDocument, pos: Position) {
    const phpactorPath = workspace.getConfiguration("phpactor").get("phpactorExecutablePath");
    if (typeof phpactorPath !== "string") {
        return;
    }
    const workspaces = workspace.workspaceFolders;
    if (workspaces === undefined) {
        return;
    }
    const workingDirs = workspaces.filter(
        (wf) => document.uri.toString().startsWith(wf.uri.toString())
    );
    if (workingDirs.length === 0) {
        return;
    }
    const workingDir = workingDirs[0];
    const response = await findReferences(
        phpactorPath,
        workingDir.uri.fsPath,
        document.getText(),
        document.offsetAt(pos),
        document.uri.fsPath
    );
    if (response.action === "collection") {
        const fileReferences = response.parameters.actions[1].parameters.file_references;
        const res = [];
        for (const fileReference of fileReferences) {
            const referencedFile = await workspace.openTextDocument(fileReference.file);
            for (const reference of fileReference.references) {

                res.push(
                    new Location(
                        Uri.file(
                            fileReference.file
                        ),
                        new Range(
                            referencedFile.positionAt(reference.start),
                            referencedFile.positionAt(reference.end)
                        )
                    )
                );
            }
        }
        return res;
    }
    await handleResponse(response.action, response.paramters);
    return undefined;
}

export function register(): Disposable {
    return languages.registerReferenceProvider("php", {
        provideReferences: (document, position) => {
            return handle(document, position);
        }
    });
}