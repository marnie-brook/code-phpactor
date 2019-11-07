import { Disposable, languages, TextDocument, CodeLens, workspace, Range, Position } from 'vscode';
import { Repository, Class } from 'php-reflection';

async function provide(document: TextDocument) {
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
    const lenses = ([] as Array<CodeLens>)
        .concat(getClassLenses(repo))
        .concat(getMethodLenses(repo))
        .concat(getPropertyLenses(repo));
    return lenses;
}

function getClassLenses(repo: Repository) {
    const lenses: Array<CodeLens> = [];
    const classes = (repo.getByType('class') as Array<Class>);
    for (const clazz of classes) {
        const range = new Range(
            new Position(clazz.position.start.line - 1, clazz.position.start.column),
            new Position(clazz.position.end.line - 1, clazz.position.end.column)
        );
        const pos = range.start.with(
            undefined,
            range.start.character + "class ".length + 2
        );
        lenses.push(new CodeLens(
            range,
            {
                command: 'extension.phpactorFindReferences',
                title: 'Find References',
                tooltip: '[ Find References ]',
                arguments: [pos]
            }
        ));
        lenses.push(new CodeLens(
            range,
            {
                command: 'extension.phpactorContextMenu',
                title: 'Context Menu',
                tooltip: '[ Context Menu ]',
                arguments: [pos]
            }
        ));
        lenses.push(new CodeLens(
            range,
            {
                command: 'extension.phpactorTransformFile',
                title: 'Transform File',
                tooltip: '[ Transform File ]'
            }
        ));
    }
    return lenses;
}

function getMethodLenses(repo: Repository) {
    const lenses: Array<CodeLens> = [];
    const classes = repo.getByType('class') as Array<Class>;
    for (const clazz of classes) {
        const methods = clazz.getMethods();
        for (const key in methods) {
            const method = methods[key];
            const range = new Range(
                new Position(method.position.start.line - 1, method.position.start.column),
                new Position(method.position.end.line - 1, method.position.end.column)
            );
            const pos = range.start.with(
                undefined,
                range.start.character + "function ".length + 2
            );
            lenses.push(new CodeLens(
                range,
                {
                    command: 'extension.phpactorFindReferences',
                    title: 'Find References',
                    tooltip: '[ Find References ]',
                    arguments: [pos]
                }
            ));
            lenses.push(new CodeLens(
                range,
                {
                    command: 'extension.phpactorContextMenu',
                    title: 'Context Menu',
                    tooltip: '[ Context Menu ]',
                    arguments: [pos]
                }
            ));
        }
    }
    return lenses;
}

function getPropertyLenses(repo: Repository) {
    const lenses: Array<CodeLens> = [];
    const classes = repo.getByType('class') as Array<Class>;
    for (const clazz of classes) {
        const methods = clazz.getProperties();
        for (const key in methods) {
            const method = methods[key];
            const range = new Range(
                new Position(method.position.start.line - 1, method.position.start.column),
                new Position(method.position.end.line - 1, method.position.end.column)
            );
            const pos = range.start.with(
                undefined,
                range.start.character + 2
            );
            lenses.push(new CodeLens(
                range,
                {
                    command: 'extension.phpactorFindReferences',
                    title: 'Find References',
                    tooltip: '[ Find References ]',
                    arguments: [pos]
                }
            ));
            lenses.push(new CodeLens(
                range,
                {
                    command: 'extension.phpactorContextMenu',
                    title: 'Context Menu',
                    tooltip: '[ Context Menu ]',
                    arguments: [pos]
                }
            ));
        }
    }
    return lenses;
}

export function register(): Disposable {
    return languages.registerCodeLensProvider("php", {
        provideCodeLenses: (document) => {
            if (!workspace.getConfiguration("phpactor").get("enableCodeLenses")) {
                return undefined;
            }
            return provide(document);
        },
        resolveCodeLens: (cl) => {
            console.log('resolve', cl);
            return undefined;
        }
    });
}