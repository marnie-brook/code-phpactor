const { spawn } = require('child_process');

function testForPhpActor(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const cmd = spawn(path, {
      shell: '/bin/bash'
    });
    let result = '';
    cmd.stdout.on('data', function (data: Buffer) {
      result += data.toString();
    });
    cmd.on('close', function () {
      if (result.split('\n')[0].toLowerCase().indexOf('phpactor', 0) === -1) {
        reject('Phpactor not found');
      } else {
        resolve(result);
      }
    });
    cmd.on('error', function (err: Error) {
      reject(err);
    });
    cmd.stdin.end();
  });
}

export function rpcPhpActor(path: string, workingDir: string, command: { action: string, parameters: any}): Promise<any> {
  if (command.action === 'return') {
    return command.parameters.value;
  }
  return new Promise((resolve, reject) => {
    const sh = path + ' rpc --working-dir=\'' + workingDir + '\'';
    const cmd = spawn(sh, {
      shell: '/bin/bash'
    });
    cmd.stdin.write(JSON.stringify(command));
    let result = '';
    cmd.stdout.on('data', function (data: Buffer) {
      result += data.toString();
    });
    cmd.on('close', function () {
      resolve(JSON.parse(result));
    });
    cmd.on('error', function (err: Error) {
      reject(err);
    });
    cmd.stdin.end();
  });
}

export interface Response {
    action: "return" | "return_choice" | "echo" | "error" | "collection" | "open_file" | "close_file" | "file_references" | "input_callback" | "information" | "replace_file_source";
    parameters: any;
}

export function validatePath(path: string) {
    return testForPhpActor(path);
}

export function goToDefinition(path: string, workingDir: string, source: string, offset: number, currentFilePath: string) {
    const command = {
        action: 'goto_definition',
        parameters: {
            source,
            offset,
            path: currentFilePath
        }
    };
    return rpcPhpActor(path, workingDir, command);
}

export function copyClass(path: string, workingDir: string, sourcePath: string, targetPath: string) {
    const command = {
        action: 'copy_class',
        parameters: {
            source_path: sourcePath,
            dest_path: targetPath
        }
    };
    return rpcPhpActor(path, workingDir, command);
}

export function moveClass(path: string, workingDir: string, sourcePath: string, targetPath: string) {
    const command = {
        action: 'move_class',
        parameters: {
            source_path: sourcePath,
            dest_path: targetPath
        }
    };
    return rpcPhpActor(path, workingDir, command);
}

export function newClass(path: string, workingDir: string, currentPath: string, targetPath: string) {
    const command = {
        action: 'class_new',
        parameters: {
            current_path: currentPath,
            new_path: targetPath
        }
    };
    return rpcPhpActor(path, workingDir, command);
}

export function importClass(phpactorPath: string, workingDir: string, source: string, offset: number, name: string, path: string, qualifiedName: string|null) {
    const command: any = {
        action: 'import_class',
        parameters: {
            source,
            offset,
            name,
            path
        }
    };
    if (qualifiedName !== null) {
        command.parameters.qualified_name = qualifiedName;
    }
    return rpcPhpActor(phpactorPath, workingDir, command);
}

export function complete(phpactorPath: string, workingDir: string, source: string, offset: number) {
    const command = {
        action: 'complete',
        parameters: {
            source,
            offset
        }
    };
    return rpcPhpActor(phpactorPath, workingDir, command);
}

export function hover(phpactorPath: string, workingDir: string, source: string, offset: number) {
    const command = {
        action: 'hover',
        parameters: {
            source,
            offset
        }
    };
    return rpcPhpActor(phpactorPath, workingDir, command);
}

export function contextMenu(phpactorPath: string, workingDir: string, source: string, offset: number, currentPath: string) {
    const command = {
        action: 'context_menu',
        parameters: {
            source,
            offset,
            current_path: currentPath
        }
    };
    return rpcPhpActor(phpactorPath, workingDir, command);
}

export function findReferences(phpactorPath: string, workingDir: string, source: string, offset: number, currentPath: string) {
    const command = {
        action: 'references',
        parameters: {
            source,
            offset,
            path: currentPath
        }
    };
    return rpcPhpActor(phpactorPath, workingDir, command);
}

export function transformFile(phpactorPath: string, workingDir: string, source: string, path: string) {
    const command = {
        action: 'transform',
        parameters: {
            source,
            path
        }
    };
    return rpcPhpActor(phpactorPath, workingDir, command);
}

export function classInflect(phpactorPath: string, workingDir: string, path: string) {
    const command = {
        action: 'class_inflect',
        parameters: {
            path
        }
    };
    return rpcPhpActor(phpactorPath, workingDir, command);
}