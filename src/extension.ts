// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
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
        FindReferences.register(),
        Transform.register(),
        ClassInflect.register()
    ];
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
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

// this method is called when your extension is deactivated
export function deactivate() { }
