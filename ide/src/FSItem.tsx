/* An item (a directory or a file entry) in the file system browser. FSItems are
   created in FSBrowser.tsx. */

import React from 'react';
import {
  File,
  Folder,
} from 'react-feather';
import * as control from './control';

type FSItemProps = {
  onClick: () => void;
  path: string;
  selected: boolean;
};

type FSItemState = {};

export default class FSItem extends React.Component<FSItemProps, FSItemState> {
  render() {
    const { path, selected, onClick } = this.props;

    const stats = control.fs.statSync(path);

    const label = (() => {
      if (stats.isDirectory()) {
        return (
          <Folder />
        );
      } if (stats.isFile()) {
        return (
          <File />
        );
      }
      return '?';
    })();

    const background = selected ? 'darkgray' : 'rgba(0, 0, 0, 0.3)';

    return (
      <button
        onClick={onClick}
        style={{
          background,
          border: 0,
          height: '2.7em',
          color: '#fff',
          textAlign: 'left',
          flex: 'none',
          cursor: 'pointer',
        }}
        type="button"
      >
        <div style={{
          display: 'flex',
          flexDirection: 'row',
        }}
        >
          <div style={{
            width: '1em',
            paddingRight: '1em',
          }}
          >
            {label}
          </div>
          <div>
            {control.bfsSetup.path.parse(path).base}
          </div>
        </div>
      </button>
    );
  }
}
