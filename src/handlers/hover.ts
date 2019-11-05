import { Disposable, languages, workspace, Position, TextDocument, Hover } from "vscode";
import { hover } from "../phpactor/phpactor";

async function handle(document: TextDocument, position: Position) {
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
    const phpactorPath = workspace.getConfiguration("phpactor").get("phpactorExecutablePath");
    if (typeof phpactorPath !== "string") {
        return;
    }
    const resp = await hover(
        phpactorPath,
        workingDir.uri.fsPath,
        document.getText(),
        document.offsetAt(position)
    );
    return new Hover(resp.parameters.message);
}

export function register(): Disposable {
    return languages.registerHoverProvider("php", {
        provideHover: (document, position) => {
            return handle(document, position);
        }
    });
}