import React from 'react';

import TableWidget from './Table';
import ImageWidget from './Image';
import ChartWidget from './Chart';
import ReactorWidget from './Reactor';

type RenderedValueProps = {
  value: any;
};

type RenderedValueState = {};

function convert(value: any) {
  if (value === undefined) {
    return 'undefined';
  }

  if (typeof value === 'number') {
    console.log('convert', value);
    return value.toString();
  }

  if (typeof value === 'string') {
    return `"${value}"`;
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (typeof value === 'function') {
    // TODO(michael) can we display more info than just <function> ?
    return '<function>';
  }

  if (value.$brand === '$table') {
    return (
      <TableWidget
        headers={value._headers}
        rows={value._rows}
        htmlify={(v) => convert(v)}
      />
    );
  }

  if (value.$brand === 'image') {
    return (
      <ImageWidget image={value} />
    );
  }

  if (value.$brand === 'chart') {
    return (
      <ChartWidget
        headers={value._headers}
        rows={value._rows}
        chartType={value.chartType}
      />
    );
  }

  if (value.$brand === 'reactor') {
    return (
      <ReactorWidget reactor={value} convert={convert} />
    );
  }

  if (value['$template-not-finished'] !== undefined) {
    return (
      <div>
        an expression containing a template
      </div>
    );
  }

  if (typeof value === 'object') {
    if (Array.isArray(value) && value.length > 100) {
      const message = `${value.length - 100} elements hidden`;
      return JSON.stringify(value.slice(0, 100).concat([`... ${message}`]));
    }
    // TODO(michael) palceholder for better object display
    return JSON.stringify(value);
  }
  return 'error: data is not string-convertible';
}

export default class RenderedValue extends React.Component<RenderedValueProps, RenderedValueState> {
  render() {
    const { value } = this.props;
    return convert(value);
  }
}
