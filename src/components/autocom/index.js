import React, { useRef } from 'react';
import Checkbox from '../checkbox';
import Input from '../input';
import NumberInput from '../numberinput';
import Select from '../select';
import MultipleSelect from '../multipleselect';
import TreeSelect from '../treeselect';
import SearchInputTree from '../searchinputtree';
import Textarea from '../textarea';
import MultiplTreeSelect from '../multipltreeselect';
import TextareaInput from '../textareainput';

export default React.memo(({onChange, value, onBlur, onFocus, options,
                               component, readOnly, fieldNames, props}) => {
    const preValueRef = useRef('');
    const checkboxValueFormat = {
        checked: 1,
        unchecked: 0,
    };
    const defaultProps = {
        ...props,
        disable: readOnly,
        value,
        onChange: (e, otherValue) => {
            onChange && onChange(e.target ?
                e.target.value : e, value, otherValue);
        },
    };
    const _onBlur = (e) => {
        onBlur && onBlur(e.target.value, preValueRef.current);
    };
    const _onFocus = (e) => {
        onFocus && onFocus(e);
        preValueRef.current = value;
    };
    switch (component) {
        case 'Input': return <Input
          {...defaultProps}
          onBlur={_onBlur}
          onFocus={_onFocus}
        />;
        case 'Checkbox': return <Checkbox
          valueFormat={checkboxValueFormat}
          {...props}
          disable={readOnly}
          checked={value}
          onChange={e => onChange(e.target.checked, value, null)}/>;
        case 'MultipleSelect': return <MultipleSelect {...defaultProps}>
          {
                (options || []).map((o) => {
                    return <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>;
                })
            }
        </MultipleSelect>;
        case 'Select': return <Select {...defaultProps}>
          {
                (options || []).map((o) => {
                    // eslint-disable-next-line max-len
                    return <Select.Option disable={o.disable} style={o.style} key={o.value} value={o.value} nsKey={o.nsKey}>{o.label}</Select.Option>;
                })
            }
        </Select>;
        case 'TreeSelect': return <TreeSelect
          {...defaultProps}
          onFocus={onFocus}
          onBlur={_onBlur}
          fieldNames={fieldNames || {defKey: 'value', defName: 'label'}}
          options={options}/>;
        case 'MultiplTreeSelect': return <MultiplTreeSelect
          {...defaultProps}
          onFocus={onFocus}
          onBlur={_onBlur}
          fieldNames={fieldNames || {defKey: 'value', defName: 'label'}}
          options={options}/>;
        case 'SearchInputTree': return <SearchInputTree
          {...defaultProps}
          onFocus={onFocus}
          onBlur={_onBlur}
          fieldNames={fieldNames || {defKey: 'value', defName: 'label'}}
          options={options}/>;
        case 'NumberInput': return <NumberInput
          {...defaultProps}
          onBlur={_onBlur}
          onFocus={_onFocus}/>;
        case 'Textarea': return <Textarea
          {...defaultProps}
          onBlur={_onBlur}
          onFocus={_onFocus}/>;
        case 'TextareaInput': return <TextareaInput
          {...defaultProps}
          onBlur={_onBlur}
          onFocus={_onFocus}
        />;
        default: return <span>{value}</span>;
    }
});
