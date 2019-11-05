import { Disposable, commands, window, workspace } from "vscode";
import { newClass } from "../phpactor/phpactor";
import { handleResponse } from "../phpactor/response-handler";

async function handle() {
    const editor = window.activeTextEditor;
    const workspaces = workspace.workspaceFolders;
    if (editor === undefined || workspaces === undefined) {
        return;
    }
    const workingDirs = workspaces.filter(
        (wf) => editor.document.uri.toString().startsWith(wf.uri.toString())
    );
    if (workingDirs.length === 0) {
        return;
    }
    const workingDir = workingDirs[0];
    const phpactorPath = workspace.getConfiguration("phpactor").get("phpactorExecutablePath");
    if (typeof phpactorPath !== "string") {
        return;
    }
    const newPath = await window.showInputBox({
        placeHolder: "Path to new file",
        prompt: "Path to new file",
        value: editor.document.fileName
    });
    if (newPath === undefined || newPath === editor.document.fileName) {
        return;
    }
    const resp = await newClass(
        phpactorPath,
        workingDir.uri.fsPath,
        editor.document.fileName,
        newPath
    );
    await handleResponse(resp.action, resp.parameters);
}

export function register(): Disposable {
    return commands.registerCommand("extension.phpactorNewClass", () => {
        handle();
    });
}