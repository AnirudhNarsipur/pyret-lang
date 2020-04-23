import React from 'react';
import { connect, ConnectedProps } from 'react-redux';
import { Controlled as CodeMirror } from 'react-codemirror2';
import { State } from './state';
import { Chunk, getStartLineForIndex, newId } from './chunk';
import { Action } from './action';
import * as control from './control';

// type stateProps = {
//   name: string,
//   failures: string[],
//   highlights: number[][],
//   index: number,
//   startLine: number,
//   chunk: string,
//   isLast: boolean
// };

type stateProps = {
  chunks: Chunk[],
  focusedChunk: number | undefined,
};

function mapStateToProps(state: State): stateProps {
  const { chunks, focusedChunk } = state;
  return {
    chunks,
    focusedChunk,
  };
}

type propsFromReact = {
  index: number,
  onEdit: (key: number, chunk: string, shouldCreateNewChunk: boolean) => void,
  highlights: any,
  failures: any,
  name: string,
  focused: boolean,
};

type dispatchProps = {
  setFocusedChunk: (index: number) => void,
  unfocusChunk: (index: number) => void,
  initializeEditor: (chunks: Chunk[], index: number, editor: CodeMirror.Editor) => void,
  setChunks: (chunks: Chunk[]) => void,
};

function mapDispatchToProps(dispatch: (action: Action) => any): dispatchProps {
  return {
    setFocusedChunk(index: number) {
      dispatch({ type: 'setFocusedChunk', index });
    },
    unfocusChunk(index: number) {
      dispatch({ type: 'unfocusChunk', index });
    },
    initializeEditor(chunks: Chunk[], index: number, editor: CodeMirror.Editor) {
      const newChunks = chunks.slice();
      newChunks[index].editor = editor;
      dispatch({ type: 'setChunks', chunks: newChunks });
    },
    setChunks(chunks: Chunk[]) {
      console.log('setting chunks ...');
      dispatch({ type: 'setChunks', chunks });
    },
  };
}

// type DefChunkState = {
//   editor: CodeMirror.Editor | null,
//   focused: boolean,
//   updateTimer: NodeJS.Timeout
// };

const connector = connect(mapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;
type DefChunkProps = PropsFromRedux & dispatchProps & stateProps & propsFromReact;

class DefChunk extends React.Component<DefChunkProps, any> {
  private input: React.RefObject<any>;

  constructor(props: DefChunkProps) {
    super(props);
    this.input = React.createRef();
  }
  // constructor(props : DefChunkProps) {
  //   super(props);
  //   const onFirstUpdate = () => {
  //     const { chunk } = this.props;
  //     this.lint(chunk);
  //   };
  //   this.state = { editor: null, updateTimer: setTimeout(onFirstUpdate, 0), focused: false };
  // }

  // TODO (michael): investigate alternatives for this method
  UNSAFE_componentWillReceiveProps() {
    const { chunks, index } = this.props;
    const { editor } = chunks[index];
    if (editor !== undefined) {
      const marks = editor.getDoc().getAllMarks();
      marks.forEach((m: any) => m.clear());
    }
  }

  componentDidUpdate() {
    const { chunks, index, highlights } = this.props;
    const { editor, startLine } = chunks[index];
    if (editor !== undefined) {
      const marks = editor.getDoc().getAllMarks();
      marks.forEach((m) => m.clear());
      if (highlights.length > 0) {
        for (let i = 0; i < highlights.length; i += 1) {
          editor.getDoc().markText(
            {
              line: highlights[i][0] - 1 - startLine,
              ch: highlights[i][1],
            },
            {
              line: highlights[i][2] - 1 - startLine,
              ch: highlights[i][3],
            },
            { className: 'styled-background-error' },
          );
        }
      }
    }

    const { focusedChunk } = this.props;
    if (index === focusedChunk && this.input.current !== null) {
      console.log('FOCUSING ...');
      this.input.current.editor.focus();
    } else if (index === focusedChunk) {
      console.log('null errors eek');
    } else {
      console.log('total fail');
    }
  }

  scheduleUpdate(value: string) {
    const { chunks, index, setChunks } = this.props;

    // // const { editor, updateTimer } = this.state;

    // // Returns true if this edit corresponds to a press of the 'enter' key.
    // function getEnterPressed() {
    //   return data.removed.length === 1
    //       && data.removed[0] === ''
    //       && data.text.length === 2
    //       && data.text[0] === ''
    //       && data.text[1] === '';
    // }

    // this.lint(value);
    // if (editor !== undefined) {
    //   const token = editor.getTokenAt(data.to);
    //   const shouldCreateNewChunk = token.state.lineState.tokens.length === 0
    //                             && getEnterPressed()
    //                             && chunk.trim() !== '';
    //   console.log('should create new chunk?', shouldCreateNewChunk, data, value);
    //   onEdit(index, value, shouldCreateNewChunk);
    // } else {
    const newChunks = [...chunks];
    newChunks[index] = {
      startLine: newChunks[index].startLine,
      text: value,
      editor: undefined,
      id: newChunks[index].id,
    };
    for (let i = index; i < newChunks.length; i += 1) {
      newChunks[i] = {
        startLine: getStartLineForIndex(newChunks, i),
        text: newChunks[i].text,
        editor: undefined,
        id: newChunks[i].id,
      };
    }
    setChunks(newChunks);
    // }

    // clearTimeout(updateTimer);
    // this.setState({
    //   updateTimer: setTimeout(() => {
    //     if (editor !== null) {
    //       const token = editor.getTokenAt(data.to);
    //       const shouldCreateNewChunk = token.state.lineState.tokens.length === 0
    //                                 && getEnterPressed()
    //                                 && chunk.trim() !== '';
    //       console.log('should create new chunk?', shouldCreateNewChunk, data, value);
    //       onEdit(index, value, shouldCreateNewChunk);
    //     } else {
    //       onEdit(index, value, false);
    //     }
    //     this.lint(value);
    //   }, 250),
    // });
  }

  lint(value : string) {
    const { name } = this.props;
    control.lint(value, name);
  }

  render() {
    const borderWidth = '2px';
    let borderColor = '#eee';
    const {
      chunks, focused, highlights, index, failures, focusedChunk, setChunks, setFocusedChunk,
    } = this.props;
    const { text, startLine } = chunks[index];
    const chunk = text;

    if (focused) {
      borderColor = 'black';
    }
    if (highlights.length > 0) { borderColor = 'red'; }
    const border = `${borderWidth} solid ${borderColor}`;
    return (
      <div style={{
        borderLeft: border,
        width: '100%',
      }}
      >
        <CodeMirror
          ref={this.input}
          onFocus={() => {
            // if (isLast) {
            //   onEdit(index, '', false);
            // }
            setFocusedChunk(index);
          }}
          // onBlur={() => {
          //   const { unfocusChunk } = this.props;
          //   unfocusChunk(index);
          // }}
          editorDidMount={(editor) => {
            console.log(`mounted editor for ${index}`);
            const marks = editor.getDoc().getAllMarks();
            marks.forEach((m) => m.clear());
            editor.setSize(null, 'auto');
          }}
          value={chunk}
          options={{
            mode: 'pyret',
            theme: 'default',
            lineNumbers: true,
            lineWrapping: true,
            lineNumberFormatter: (l) => String(l + startLine),
            autofocus: index === focusedChunk,
          }}
          onBeforeChange={(editor, data, value) => {
            // const newChunks = chunks.slice();
            // newChunks[index].text = value;
            // setChunks(newChunks);
            this.scheduleUpdate(value);
          }}
          // onChange={(editor, data, value) => {
          // }}
          onKeyDown={(editor, event) => {
            switch ((event as any).key) {
              case 'Enter': {
                const pos = (editor as any).getCursor();
                const token = editor.getTokenAt(pos);
                if (token.state.lineState.tokens.length === 0) {
                  if (index + 1 === chunks.length) {
                    console.log('my index', index);
                    console.log('CASE 1');
                    const newChunks = [
                      ...chunks.slice(),
                      {
                        text: '',
                        startLine: getStartLineForIndex(chunks, index + 1),
                        editor: undefined,
                        id: newId(),
                      },
                    ];
                    setChunks(newChunks);
                    setFocusedChunk(index + 1);
                  } else if (chunks[index + 1].text.trim() !== '') {
                    console.log('CASE 2');
                    const newChunks: Chunk[] = [
                      ...chunks.slice(0, index + 1),
                      {
                        text: '',
                        startLine: getStartLineForIndex(chunks, index + 1),
                        editor: undefined,
                        id: newId(),
                      },
                      ...chunks.slice(index + 1),
                    ];
                    for (let i = index + 1; i < newChunks.length; i += 1) {
                      newChunks[i] = {
                        text: newChunks[i].text,
                        startLine: getStartLineForIndex(newChunks, i),
                        editor: undefined,
                        id: newChunks[i].id,
                      };
                    }
                    setChunks(newChunks);
                    setFocusedChunk(index + 1);
                  } else if (chunks[index + 1].text.trim() === '') {
                    console.log('CASE 3');
                    setFocusedChunk(index + 1);
                  }
                  event.preventDefault();
                } else {
                  console.log('token fail');
                }
              }
                break;
              case 'Backspace':
                if (index > 0 && chunks[index].text.trim() === '') {
                  const newChunks = [...chunks.slice(0, index), ...chunks.slice(index + 1)];
                  for (let i = index; i < newChunks.length; i += 1) {
                    newChunks[i] = {
                      text: newChunks[i].text,
                      startLine: getStartLineForIndex(newChunks, i),
                      editor: undefined,
                      id: newChunks[i].id,
                    };
                  }
                  setChunks(newChunks);
                  setFocusedChunk(index - 1);
                  event.preventDefault();
                }
                break;
              default:
                console.log((event as any).key);
            }
          }}
          autoCursor
        />
        {failures.length !== 0 && (
          <ul>
            {failures.map((f: any, ix: number) => <li key={String(ix)}>{f}</li>)}
          </ul>
        )}
      </div>
    );
  }
}

export default connector(DefChunk);