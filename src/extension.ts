import * as vscode from 'vscode';
import * as GotoDefinition from './handlers/go-to-definition';
import * as CopyClass from './handlers/copy-class';
import * as MoveClass from './handlers/move-class';
import * as NewClass from './handlers/new-class';
import * as ImportClass from './handlers/import-class';
import * as Complete from './handlers/complete';
import * as Hover from './handlers/hover';
import * as ContextMenu from './handlers/context-menu';
import * as FindReferences from './handlers/find-references';
import * as Transform from './handlers/transform';
import * as ClassInflect from './handlers/class-inflect';
// import * as CodeLensProvider from './handlers/lens-provider';
// import * as SymbolProvider from './handlers/symbol-provider';
// import * as TestRunner from './handlers/test-runner';
import { validatePath } from './phpactor/phpactor';

function createHandlers(): Array<vscode.Disposable> {
    return [
        GotoDefinition.register(),
        CopyClass.register(),
        MoveClass.register(),
        NewClass.register(),
        ImportClass.register(),
        Complete.register(),
        Hover.register(),
        ContextMenu.register(),
        ...FindReferences.register(),
        Transform.register(),
        ClassInflect.register(),
        // CodeLensProvider.register(),
        // SymbolProvider.register(),
        // ...TestRunner.register()
    ];
}

export async function activate(context: vscode.ExtensionContext) {
    const phpactor = vscode.workspace.getConfiguration("phpactor").get("phpactorExecutablePath");
    if (typeof phpactor !== "string") {
        return;
    }
    validatePath(phpactor).then(() => {
        context.subscriptions.push(...createHandlers());
    }).catch(() => {
    });
}

export function deactivate() { }
