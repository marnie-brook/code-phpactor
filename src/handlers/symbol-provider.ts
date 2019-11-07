import { Disposable, languages, TextDocument, workspace, SymbolInformation, SymbolKind, Location, Position } from "vscode";
import { Repository, Class } from 'php-reflection';

async function handle(document: TextDocument) {
    const workspaces = workspace.workspaceFolders;
    if (!workspaces) {
        return;
    }
    const workingDirs = workspaces.filter(
        (wf) => document.uri.toString().startsWith(wf.uri.toString())
    );
    if (workingDirs.length === 0) {
        return;
    }
    const workingDir = workingDirs[0];
    const repo = new Repository(workingDir.uri.fsPath);
    await repo.parse(document.uri.fsPath);
    if (!repo.getByType('class')) {
        return undefined;
    }
    return extractSymbols(document, repo);
}

function extractSymbols(document: TextDocument, repo: Repository) {
    const symbols = ([] as Array<SymbolInformation>)
        .concat(getClassSymbols(document, repo))
        .concat(getMethodSymbols(document, repo))
        .concat(getPropertySymbols(document, repo));
    return symbols;
}

function getClassSymbols(document: TextDocument, repo: Repository) {
    const classes = (repo.getByType('class') as Array<Class>);
    const symbols: Array<SymbolInformation> = [];
    for (const clazz of classes) {
        symbols.push(new SymbolInformation(
            clazz.name,
            SymbolKind.Class,
            clazz.name,
            new Location(
                document.uri,
                new Position(
                    clazz.position.start.line - 1,
                    clazz.position.start.column
                )
            )
        ));
    }
    return symbols;
}

function getMethodSymbols(document: TextDocument, repo: Repository) {
    const classes = (repo.getByType('class') as Array<Class>);
    const symbols: Array<SymbolInformation> = [];
    for (const clazz of classes) {
        const methods = clazz.getMethods();
        for (const key in methods) {
            const method = methods[key];
            symbols.push( new SymbolInformation(
                method.name,
                SymbolKind.Method,
                method.name,
                new Location(
                    document.uri,
                    new Position(
                        method.position.start.line - 1,
                        method.position.start.column
                    )
                )
            ));
        }
    }
    return symbols;
}

function getPropertySymbols(document: TextDocument, repo: Repository) {
    const classes = (repo.getByType('class') as Array<Class>);
    const symbols: Array<SymbolInformation> = [];
    for (const clazz of classes) {
        const methods = clazz.getProperties();
        for (const key in methods) {
            const method = methods[key];
            symbols.push( new SymbolInformation(
                method.name,
                SymbolKind.Property,
                method.name,
                new Location(
                    document.uri,
                    new Position(
                        method.position.start.line - 1,
                        method.position.start.column
                    )
                )
            ));
        }
    }
    return symbols;
}

export function register(): Disposable {
    return languages.registerDocumentSymbolProvider("php", {
        provideDocumentSymbols: (document) => {
            return handle(document);
        }
    });
}