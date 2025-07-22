import React, {useRef} from 'react';
import {Textarea, Button} from 'components';
import {getPrefix} from '../../../../../../lib/classes';

import './style/index.less';

export default React.memo(({defaultData, onChange, close}) => {
    const currentPrefix = getPrefix('container-model-mind-note');
    const valueRef = useRef({...defaultData});
    const _onChange = (e) => {
        valueRef.current = e.target.value;
    };
    const onOk = () => {
        onChange && onChange(valueRef.current);
        close();
    };
    const onMouseLeave = (e) => {
        e.stopPropagation();
    };
    return <div className={currentPrefix}>
      <Textarea onMouseLeave={onMouseLeave} placeholder="请输入备注" defaultValue={defaultData} onChange={_onChange}/>
      <div className={`${currentPrefix}-footer`}>
        <Button type='primary' onClick={onOk}>确定</Button>
      </div>
    </div>;
});
