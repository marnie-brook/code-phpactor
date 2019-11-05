import { Disposable, languages, workspace, TextDocument, Position, CancellationToken, CompletionItem, CompletionItemKind, CompletionContext } from "vscode";
import { complete } from "../phpactor/phpactor";
import { handleResponse } from "../phpactor/response-handler";

async function provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
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
    const encountered: any = {};
    return handled.suggestions.filter((suggestion: any) => {
        const label: string = suggestion.label;
        if (label in encountered) {
            return false;
        }
        encountered[label] = true;
        return true;
    }).map((suggestion: any) => {
        const ci = new CompletionItem(suggestion.label);
        ci.kind = mapTypeToCompletionItemKind(suggestion.type);
        ci.detail = suggestion.short_description;
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
        provideCompletionItems: (document, position, token, context) => {
            return provideCompletionItems(document, position, token, context);
        },
        resolveCompletionItem: (item) => {
            return undefined;
        }
    }, ':', '>', '$');
}