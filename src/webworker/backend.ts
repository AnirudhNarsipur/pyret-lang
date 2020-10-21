import { RuntimeConfig, RunnerPerfResults } from './runner';

export interface LintOptions {
  program: string,
  programSource: string,
}

export interface CompileOptions {
  program: string,
  baseDir: string,
  builtinJSDir: string,
  typeCheck: boolean,
  checks: string,
  recompileBuiltins: boolean,
}

export enum RunKind {
  Sync = 'SYNC',
  Async = 'ASYNC',
}

export type RunResult = {
  perfResults: RunnerPerfResults
  result: any,
};

let compileStart = window.performance.now();

/*
 * Handles Pyret compiler messages ONLY.
 * Ignores all other messages (including BrowserFS messages)
 */
export const makeBackendMessageHandler = (
  echoLog: (l: string) => void,
  setupFinished: () => void,
  compileFailure: (e: string[]) => void,
  runtimeFailure: (e: string[]) => void,
  lintFailure: (data: { name: string, errors: string[]}) => void,
  lintSuccess: (data: { name: string }) => void,
  compileSuccess: () => void,
  createReplSuccess: () => void,
  compileInteractionSuccess: (data: { program: string }) => void,
  compileInteractionFailure: (data: { program: string }) => void): ((e: MessageEvent) => null | void
  ) => {
  const backendMessageHandler = (e: MessageEvent) => {
    if (e.data.browserfsMessage === true) {
      return null;
    }

    try {
      const msgObject: any = JSON.parse(e.data);

      const msgType = msgObject.type;

      if (msgObject.tag === 'error') {
        try {
          console.log(JSON.parse(msgObject.data));
        } catch (err) {
          console.log(msgObject.data);
        }
      }

      if (msgType === undefined) {
        return null;
      } if (msgType === 'echo-log') {
        echoLog(msgObject.contents);
      } else if (msgType === 'lint-failure') {
        lintFailure(msgObject.data);
      } else if (msgType === 'lint-success') {
        lintSuccess(msgObject.data);
      } else if (msgType === 'setup-finished') {
        setupFinished();
      } else if (msgType === 'compile-failure') {
        compileFailure(msgObject.data);
      } else if (msgType === 'compile-success') {
        console.log('compile-time: ', window.performance.now() - compileStart);
        compileSuccess();
      } else if (msgType === 'create-repl-success') {
        createReplSuccess();
      } else if (msgType === 'compile-interaction-success') {
        compileInteractionSuccess({ program: msgObject.program });
      } else if (msgType === 'compile-interaction-failure') {
        compileInteractionFailure({ program: msgObject.program });
      } else {
        return null;
      }

      return null;
    } catch (err) {
      console.log(err);
      runtimeFailure(err);
      return null;
    }
  };

  return backendMessageHandler;
};

export const lintProgram = (
  compilerWorker: Worker,
  options: LintOptions,
): void => {
  const message = {
    request: 'lint-program',
    program: options.program,
    'program-source': options.programSource,
    lint: true,
  };

  compilerWorker.postMessage(message);
};

export const compileProgram = (
  compilerWorker: Worker,
  options: CompileOptions,
): void => {
  compileStart = window.performance.now();
  const message = {
    request: 'compile-program',
    program: options.program,
    'base-dir': options.baseDir,
    'builtin-js-dir': options.builtinJSDir,
    checks: options.checks,
    'type-check': options.typeCheck,
    'recompile-builtins': options.recompileBuiltins,
  };

  compilerWorker.postMessage(message);
};

export const createRepl = (
  compilerWorker: Worker,
): void => {
  const message = {
    request: 'create-repl',
  };

  compilerWorker.postMessage(message);
};

export const compileInteraction = (
  compilerWorker: Worker,
  interactionFullPath: string,
): void => {
  const message = {
    request: 'compile-interaction',
    program: interactionFullPath,
  };

  compilerWorker.postMessage(message);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const assertNever = (arg: never): never => {
  throw new Error('assertNever');
};

export const runProgram2 = (
  runner: any,
  baseDir: string,
  program: string,
  runKind: RunKind,
  rtCfg?: RuntimeConfig,
): Promise<any> => {
  runner.resetTimings();
  if (runKind === RunKind.Sync) {
    const result = runner.makeRequire(baseDir, rtCfg)(program);
    return Promise.resolve({
      perfResults: runner.getTimingResults(),
      result,
    });
  } if (runKind === RunKind.Async) {
    return new Promise<any>((resolve) => {
      runner.makeRequireAsync(baseDir, rtCfg)(program).then((asyncRunner: any) => {
        resolve({
          run: (callback: (result: RunResult) => void): void => {
            asyncRunner.run.then((result: any) => {
              callback({
                perfResults: runner.getTimingResults(),
                result,
              });
            }).catch((result: any) => {
              callback({
                perfResults: runner.getTimingResults(),
                result: { error: String(result.value), result },
              });
            });
          },
          pause: (callback: (line: number) => void): void => {
            asyncRunner.pause(callback);
          },
          resume: (): void => {
            asyncRunner.resume();
          },
        });
      });
    });
  }
  return assertNever(runKind);
};

export const runProgram = (
  runner: any,
  baseDir: string,
  program: string,
  runKind: RunKind,
): Promise<RunResult> => {
  runner.resetTimings();
  if (runKind === RunKind.Sync) {
    const result = runner.makeRequire(baseDir)(program);

    return Promise.resolve({
      perfResults: runner.getTimingResults(),
      result,
    });
  } if (runKind === RunKind.Async) {
    const entry = runner.makeRequireAsync(baseDir);
    const resultP = entry(program);

    const wrapper = new Promise<RunResult>((resolve) => {
      resultP.then((asyncRunner: any) => {
        console.log('asyncRunner', asyncRunner);

        asyncRunner.run((result: any) => {
          resolve({
            perfResults: runner.getTimingResults(),
            result,
          });
        });
      });
    });

    return wrapper;
  }
  // NOTE(michael): type checking in Typescript on enums is not exhaustive (as of v3.5.3)
  return assertNever(runKind);
};
