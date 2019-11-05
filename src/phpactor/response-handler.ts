import { Response, rpcPhpActor } from "./phpactor";
import { workspace, window, Selection, ParameterInformation, commands, Range, Position, TextEditorCursorStyle } from "vscode";
import { stringify } from "querystring";

async function openFile({ path, offset }: { path: string, offset: number}) {
    await workspace.openTextDocument(path).then((td) => {

        return window.showTextDocument(td);
    }).then((te) => {
        const pos = te.document.positionAt(offset);
        te.selections = [
            new Selection(pos, pos)
        ];
    });
}

async function handleInput(input: Input) {
    if (input.type === "confirm") {
        const confirmed = await window.showInputBox({
            placeHolder: input.parameters.label ? input.parameters.label + "Y/N" : "",
            prompt: input.parameters.label ? input.parameters.label + "Y/N" : ""
        });
        if (typeof confirmed === "string") {
            return confirmed.toLowerCase() === "y";
        }
        return confirmed;
    }
    if (input.type === "choice") {
        const choices = Object.keys(input.parameters.choices);
        const choice = await window.showQuickPick(choices);
        return choice;
    }
    if (input.type === "text") {
        const text = await window.showInputBox({
            placeHolder: input.parameters.label,
            value: input.parameters.default
        });
        return text;
    }
    throw new Error(`Uknown input type: ${input.type}`);
}

interface Input {
    name: string;
    type: "text" | "choice" | "list" | "confirm";
    parameters: any;
}

async function inputCallback(inputParams: any) {
    const inputs: Array<Input> = inputParams.inputs;
    const callback = inputs.reduce(
        (carry, input) => {
            carry.parameters[input.name] = handleInput(input);
            return carry;
        },
        inputParams.callback
    );
    for (const key in callback.parameters) {
        if (callback.parameters[key] instanceof Promise) {
            callback.parameters[key] = await callback.parameters[key];
            if (callback.parameters[key] === undefined) {
                return;
            }
        }
    }
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
    const response = await rpcPhpActor(
        phpactorPath,
        workingDir.uri.fsPath,
        callback
    );
    await handleResponse(
        response.action,
        response.parameters
    );
}

function closeFile({ path }: { path: string }) {
    //
}

async function replaceFileSource(parameters: any) {
    if ("path" in parameters) {
        await openFile({ path: parameters.path, offset: 0 });
    }
    const editor = window.activeTextEditor;
    if (editor === undefined) {
        return;
    }
    await editor.edit((e) => {
        e.replace(
            new Range(new Position(0,0), editor.document.positionAt(editor.document.getText().length)),
            parameters.source
        );
    });
}

async function updateFileSource(parameters: any) {
    if ("path" in parameters) {
        await openFile({ path: parameters.path, offset: 0 });
    }
    if (parameters.source) {
        return await replaceFileSource(parameters);
    }
}

async function fileReferences(parameters: any) {
    //
}

export async function handleResponse(action: string, parameters: any) {
    console.log(action);
    console.log(parameters);
    switch (action) {
        case "open_file":
            return await openFile(parameters);
        case "input_callback":
            return await inputCallback(parameters);
        case "collection":
            console.log(parameters.actions);
            parameters.actions.forEach(async (item: any) => {
                console.log("x", item);
                await handleResponse(item.name, item.parameters);
            });
        case "close_file":
            return closeFile(parameters);
        case "replace_file_source":
            return await replaceFileSource(parameters);
        case "update_file_source":
            return await updateFileSource(parameters);
        case "echo":
            return window.showInformationMessage(parameters.message);
        case "return":
            return parameters.value;
        case "file_references":
            return await fileReferences(parameters);
        default:
            console.error(`${action} handler not implemented yet`);
    }
}