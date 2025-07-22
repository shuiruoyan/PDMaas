import React, { useState } from 'react';

import Input from '../input';
import Icon from '../icon';
import { upload } from '../../lib/rest';

import './style/index.less';
import {getPrefix} from '../../lib/classes';

export default React.memo(({defaultValue, onChange, accept, ...restProps}) => {
    const [fileName, setFileName] = useState(defaultValue);
    const currentPrefix = getPrefix('components-upload');
    const _onChange = (file) => {
        onChange && onChange(file);
        setFileName(file.name);
    };
    const onClick = () => {
        upload(accept, _onChange, () => true, false);
    };
    const finalValue = 'value' in restProps ? restProps.value : fileName;
    return <div className={currentPrefix}>
      <Input value={finalValue} {...restProps} disable suffix={<Icon onClick={onClick} className={`${currentPrefix}-icon`} type='icon-ellipsis-more'/>}/>
    </div>;
});
