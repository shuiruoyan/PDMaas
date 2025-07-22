import React, { Fragment, useState } from 'react';

const Radio = React.memo(({direction = 'row', name, defaultValue, children = [], onChange, ...restProps}) => {
  const [state, updateState] = useState(defaultValue);
  const _onChange = (e, value) => {
    onChange && onChange(e);
    updateState(value);
  };
  let tempValue = state;
  if ('value' in restProps) {
    tempValue = restProps?.value;
  }
  return (
    <Fragment>
      {children.map(c => (React.cloneElement(c, {
        direction,
        key: c.props?.value,
        name: name,
        checked: tempValue === c.props?.value,
        onChange: _onChange,
      })))}
    </Fragment>
  );
});

export default Radio;
