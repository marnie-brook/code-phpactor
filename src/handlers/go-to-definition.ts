import { Disposable, languages, window, workspace, Position, Uri, ProviderResult, Definition, Location } from 'vscode';
import { goToDefinition, Response } from './../phpactor/phpactor';

async function handle(filePath: string, position: Position) {
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
    const phpactorPath = workspace.getConfiguration("phpactor").get("phpactorExecutablePath");
    if (typeof phpactorPath !== "string") {
        return;
    }
    const workingDir = workingDirs[0];
    const source = editor.document.getText();
    const offset = editor.document.offsetAt(position);
    const resp = await goToDefinition(
        phpactorPath,
        workingDir.uri.fsPath,
        source,
        offset,
        filePath
    );
    return new Location(
        Uri.file(resp.parameters.path),
        await workspace.openTextDocument(resp.parameters.path).then(
            (td) => td.positionAt(resp.parameters.offset)
        )
    );
}

export function register(): Disposable {
    return languages.registerDefinitionProvider("php", {
        provideDefinition: (document, position, cancel): ProviderResult<Definition> => {
            return handle(document.fileName, position);
        }
    });
}
