import { Response } from "./phpactor";
import { workspace, window, Selection } from "vscode";

function openFile({ path, offset }: { path: string, offset: number}) {
    workspace.openTextDocument(path).then((td) => {

        return window.showTextDocument(td);
    }).then((te) => {
        const pos = te.document.positionAt(offset);
        te.selections = [
            new Selection(pos, pos)
        ];
    });
}

export function handleResponse(resp: Response) {
    console.log(resp);
    switch (resp.action) {
        case "open_file":
            return openFile(resp.parameters);
        default:
            console.error(`${resp.action} handler not implemented yet`);
    }
}