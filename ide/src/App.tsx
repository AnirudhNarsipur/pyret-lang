import React from 'react';
import './App.css';
const BrowserFS = require('browserfs');

BrowserFS.install(window);

BrowserFS.configure(
    {
        fs: "LocalStorage"
    },
    function(e: any) {
        if (e) {
            throw e;
        }
    }
);

const fs = BrowserFS.BFSRequire('fs');

const programCacheFile = '/program-cache.arr';

type CompileResult = CompileSuccess | CompileFailure;
type CompileSuccess = {
    path: string;
};
type CompileFailure = string;

function pyretCompile(path: string, callback: (result: CompileResult) => void): void {

    // We don't have the infrastructure in place to compile or run Pyret programs at the
    // moment, so just echo back the path of the file as a placeholder.

    callback({path: path});
}

type RunResult = RunSuccess | RunFailure;
type RunSuccess = {
    answer: any;
};
type RunFailure = string;

function pyretRun(compileSuccess: CompileSuccess,
                  callback: (result: RunResult) => void): void {
    const contents = fs.readFileSync(programCacheFile, {encoding: 'utf-8'});

    // We don't have the infrastructure in place to compile or run Pyret programs at the
    // moment, so just echo back the contents of the file as a placeholder.

    callback({answer: {stringContents: contents}});
}

const mockRunOutput = {
    "y": 9,
    "x": 5
};

const mockRunResult: RunResult = {
    answer: mockRunOutput
};

type DefinitionsAreaProps = {};
type DefinitionsAreaState = {
    value: string;
};

class DefinitionsArea extends React.Component<DefinitionsAreaProps, DefinitionsAreaState> {
    constructor(props: DefinitionsAreaProps) {
        super(props);

        fs.writeFileSync(programCacheFile, `provide *
provide-types *

import global as G

x :: Number = 2 + 3
y :: Number = 4 + 5`)

        //if (!fs.existsSync(programCacheFile)) {
        //    fs.writeFileSync(programCacheFile, "provide *");
        //}

        this.state = {
            value: fs.readFileSync(programCacheFile)
        };
    };

    saveDefinitions = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        this.setState({value: e.target.value});
        fs.writeFileSync(programCacheFile, e.target.value);
    };

    render() {
        return (
            <textarea id="definitions-area"
                      value={this.state.value}
                      className="code"
                      onChange={this.saveDefinitions}>
            </textarea>
        );
    };
}

function isCompileSuccess(x: any): x is CompileSuccess {
    if (x.path) {
        return true;
    }

    return false;
}

function isRunSuccess(x: any): x is RunSuccess {
    if (x.answer) {
        return true;
    }

    return false;
}

type AppProps = {};
type AppStateInteractions = {name: string, value:any}[];
type AppState = {
    interactions: AppStateInteractions;
};

function makeResult(result: any): {name: string, value: any}[] {
    return Object.keys(result).map((key) => {
        return {
            name: key,
            value: result[key]
        }
    });
}

class App extends React.Component<AppProps, AppState> {
    constructor(props: AppProps) {
        super(props);
        this.state = {
            interactions: []
        };
    };

    run = () => {
        pyretCompile(
            programCacheFile,
            (compileResult) => {
                if (isCompileSuccess(compileResult)) {
                    pyretRun(
                        compileResult,
                        (runResult) => {
                            //if (isRunSuccess(runResult)) {
                            if (isRunSuccess(mockRunResult)) {
                                this.setState(
                                    {
                                        //interactions: runResult.answer.stringContents
                                        interactions: makeResult(mockRunResult.answer)
                                    }
                                );
                            } else {
                                // there was an issue at run time
                            }
                        })
                } else {
                    // there was an issue at compile time.
                }
            });
    }

    render() {
        return (
            <div id="outer-box">
                <div id="header">
                    <button id="run"
                            className="prose"
                            onClick={this.run}>
                        Run
                    </button>
                </div>
                <div id="main">
                    <div id="edit-box">
                        <div id="definitions-container">
                            <DefinitionsArea />
                        </div>
                        <div id="separator">
                        </div>
                        <div id="interactions-container">
                            <pre id="interactions-area"
                                 className="code">
                                {
                                    this.state.interactions.map(
                                        (interaction) => {
                                            return <div key={interaction.name}>
                                                {interaction.name} = {JSON.stringify(interaction.value)}
                                            </div>;
                                        })
                                }
                            </pre>
                        </div>
                    </div>
                </div>
                <div id="footer"> </div>
            </div>
        );
    };
}

export default App;
