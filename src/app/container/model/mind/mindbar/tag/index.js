import React, { useState} from 'react';
import {Input, Button, Icon} from 'components';
import {getPrefix} from '../../../../../../lib/classes';

import './style/index.less';
import MersenneTwister from './mersenneTwister';

export default React.memo(({defaultData, onChange, close}) => {
    const [tags, setTags] = useState([...defaultData]);
    const [value, setValue] = useState('');
    const currentPrefix = getPrefix('container-model-mind-tag');
    // 根据内容生成颜色
    const generateColorByContent = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i += 1) {
            // eslint-disable-next-line no-bitwise
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        // 这里使用伪随机数的原因是因为
        // 1. 如果字符串的内容差不多，根据hash生产的颜色就比较相近，不好区分，比如v1.1 v1.2，所以需要加入随机数来使得颜色能够区分开
        // 2. 普通的随机数每次数值不一样，就会导致每次新增标签原来的标签颜色就会发生改变，所以加入了这个方法，使得内容不变随机数也不变
        const rng = new MersenneTwister(hash);
        const h = rng.genrand_int32() % 360;
        return `hsla(${  h  }, 50%, 50%, 1)`;
    };
    const _onChange = (e) => {
        setValue(e.target.value);
    };
    const onOk = () => {
        onChange && onChange(tags);
        close();
    };
    const onKeyDown = (e) => {
        const currentValue = e.target.value;
        if(e.key === 'Enter' && currentValue) {
            setValue('');
            setTags(p => [...new Set(p.concat(currentValue))].slice(0, 10));
        }
    };
    const removeTag = (v) => {
        setTags(p => p.filter(t => t !== v));
    };
    const onMouseLeave = (e) => {
      e.stopPropagation();
    };
    return <div className={currentPrefix}>
      <div>
        <Input onMouseLeave={onMouseLeave} onKeyDown={onKeyDown} placeholder="请按回车键添加" value={value} onChange={_onChange}/>
      </div>
      <div className={`${currentPrefix}-list`}>
        {tags.map((t) => {
                return <span
                  key={t}
                  className={`${currentPrefix}-item`}
                  style={{background: generateColorByContent(t)}}>
                  {t}
                  <Icon onClick={() => removeTag(t)} type='icon-close'/>
                </span>;
            })}
      </div>
      <div className={`${currentPrefix}-footer`}>
        <Button type='primary' onClick={onOk}>确定</Button>
      </div>
    </div>;
});
