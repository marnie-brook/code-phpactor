import { Disposable, commands, window, workspace, Range, Position } from "vscode";
import { contextMenu } from "../phpactor/phpactor";
import { handleResponse } from "../phpactor/response-handler";

async function handle(pos?: Position) {
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
    const resp = await contextMenu(
        phpactorPath,
        workingDir.uri.fsPath,
        editor.document.getText(),
        editor.document.offsetAt(pos ? pos : editor.selection.start),
        editor.document.uri.fsPath
    );
    if (resp.action !== "input_callback") {
        await handleResponse(resp.action, resp.parameters);
        return;
    }
    await handleResponse(resp.action, filterOutReferences(resp.parameters));
}

function filterOutReferences(parameters: any) {
    delete parameters.inputs[0].parameters.choices.find_references;
    return parameters;
}

export function register(): Disposable {
    return commands.registerCommand("extension.phpactorContextMenu", (pos?: Position) => {
        handle(pos);
    });
}