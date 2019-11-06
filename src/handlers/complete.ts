import { Disposable, languages, workspace, TextDocument, Position, CompletionItem, CompletionItemKind } from "vscode";
import { complete } from "../phpactor/phpactor";
import { handleResponse } from "../phpactor/response-handler";

async function provideCompletionItems(document: TextDocument, position: Position) {
    const phpactorPath = workspace.getConfiguration("phpactor").get("phpactorExecutablePath");
    if (typeof phpactorPath !== "string") {
        return;
    }
    const workspaces = workspace.workspaceFolders;
    if (workspaces === undefined) {
        return;
    }
    const workingDirs = workspaces.filter(
        (wf) => document.uri.toString().startsWith(wf.uri.toString())
    );
    if (workingDirs.length === 0) {
        return;
    }
    const workingDir = workingDirs[0];
    const source = document.getText();
    const offset = document.offsetAt(position);
    const response = await complete(phpactorPath, workingDir.uri.fsPath, source, offset);
    const handled = await handleResponse(response.action, response.parameters);
    if (!handled) {
        return undefined;
    }
    return handled.suggestions.map((suggestion: any) => {
        const ci = new CompletionItem(suggestion.label);
        ci.kind = mapTypeToCompletionItemKind(suggestion.type);
        ci.detail = suggestion.short_description;
        if (ci.kind === CompletionItemKind.Class) {
            ci.command = {
                command: "extension.phpactorImportClass",
                title: "PhpActor: Import Class"
            };
        }
        return ci;
    });
}

function mapTypeToCompletionItemKind(type: string): CompletionItemKind | undefined {
    if (type === "variable") {
        return CompletionItemKind.Variable;
    }
    if (type === "method") {
        return CompletionItemKind.Method;
    }
    if (type === "property") {
        return CompletionItemKind.Property;
    }
    if (type === "function") {
        return CompletionItemKind.Function;
    }
    if (type === "class") {
        return CompletionItemKind.Class;
    }
    if (type === "constant") {
        return CompletionItemKind.Constant;
    }
    console.info(`Unknown CompletionItemKind mapping for: ${type}`);
    return undefined;
}

export function register(): Disposable {
    return languages.registerCompletionItemProvider("php", {
        provideCompletionItems: (document, position) => {
            return provideCompletionItems(document, position);
        },
        resolveCompletionItem: (item) => {
            return undefined;
        }
    }, ':', '>', '$');
}