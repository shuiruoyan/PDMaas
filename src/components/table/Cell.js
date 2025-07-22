import React from 'react';
import {AutoCom} from 'components';
import {getPrefix} from '../../lib/classes';
import {shallowCompare} from '../../lib/object';

export default React.memo(({value, component, options, fieldNames, onChange, rowKey,
                               onBlur, column, row, resize, onFocus, readOnly,
                               onKeyDown, props, autoSelection, setExpand}) => {
    const cellName = column.key;
    const currentPrefix = getPrefix('components-table-cell');
    const _onKeyDown = (e) => {
        onKeyDown && onKeyDown(e, column);
    };
    const getCom = () => {
        const tempProps = {...props, row, onKeyDown: _onKeyDown, autoSelection, setExpand};
        if(typeof component === 'function') {
            return component(value, rowKey, cellName, row, onChange, resize, readOnly, tempProps, {
                onBlur,
                onFocus,
            });
        }
        return <AutoCom
          fieldNames={fieldNames}
          readOnly={readOnly}
          component={component}
          value={value}
          onFocus={() => onFocus(cellName, rowKey, column)}
          onBlur={(next, pre) => onBlur(next, cellName, rowKey, pre, column)}
          options={options}
          onChange={(next, pre, other) => onChange(next, cellName, rowKey, pre, column, other)}
          props={tempProps}
        />;
    };
    return <span className={currentPrefix} style={{textAlign: column.align || 'left'}}>
      {getCom()}
    </span>;
}, (prevProps, nextProps) => {
    return shallowCompare(prevProps, nextProps, ['value', 'column']) &&
        (prevProps.effectUpdate ? prevProps.effectUpdate(prevProps, nextProps) : true);
});
