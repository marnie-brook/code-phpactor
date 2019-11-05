import { Response } from "./phpactor";
import { workspace } from "vscode";

function openFile({ path, offset }: { path: string, offset: number}) {
    workspace.openTextDocument(path).then((td) => {
        const position = td.positionAt(offset);
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