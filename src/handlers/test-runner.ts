import { Disposable, commands, Uri, window, workspace, OutputChannel } from "vscode";
import { execFile } from 'child_process';
import { Readable, Writable } from "stream";


let lastOutput: OutputChannel | null = null;

function handle(path: Uri, methodName?: string) {
    const phpunitPath = workspace.getConfiguration("phpactor").get("phpunitPath");
    if (typeof phpunitPath !== "string" || phpunitPath === "") {
        return;
    }
    const workspaces = workspace.workspaceFolders;
    if (workspaces === undefined) {
        return;
    }
    const workingDirs = workspaces.filter(
        (wf) => path.toString().startsWith(wf.uri.toString())
    );
    if (workingDirs.length === 0) {
        return;
    }
    const workingDir = workingDirs[0];
    if (lastOutput) {
        lastOutput.dispose();
    }
    const output = window.createOutputChannel("PHPUnit");
    let args = [path.fsPath];
    if (methodName) {
        args = args.concat("--filter", methodName);
    }
    const cmd = execFile(phpunitPath, args, {
        shell: '/bin/bash',
        cwd: workingDir.uri.fsPath
    });
    (cmd.stdout as Readable).on('data', (data: Buffer) => {
        output.append(data.toString());
    });
    (cmd.stdin as Writable).end();
    output.show();
    lastOutput = output;
}

export function register(): Array<Disposable> {
    return [
        commands.registerCommand("extension.phpactorRunTest", (uri, methodName?: string) => {
            handle(uri, methodName);
        })
    ];
}