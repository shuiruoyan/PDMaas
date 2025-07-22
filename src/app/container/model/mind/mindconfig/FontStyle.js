import React, {useState} from 'react';
import {Button, Tooltip} from 'components';
import ButtonGroup from 'components/button/Group';
import Color from './Color';
import {getPrefix} from '../../../../../lib/classes';

export default React.memo(({nodeStyle, onChange}) => {
    const currentPrefix = getPrefix('container-model-mind-config-fontstyle');
    const [fontStyle, setFontStyle] = useState(nodeStyle);
    const _onChange = (name, value) => {
        setFontStyle((p) => {
            return {
                ...p,
                [name]: value,
            };
        });
        onChange(name, value);
    };
    return <div className={currentPrefix}>
      <Tooltip
        force
        title={<Color
          onChange={color => _onChange('color', color)}
          defaultValue={fontStyle.color}
            />}
        >
        <span>
          <span style={{borderBottom: `1px solid ${fontStyle.color}`}}>A</span>
        </span>
      </Tooltip>
      <span
        style={{fontWeight: fontStyle.fontWeight}}
        onClick={() => _onChange('fontWeight', fontStyle.fontWeight === 'bold' ? 'normal' : 'bold')}
        >
          B
      </span>
      <span
        style={{fontStyle: fontStyle.fontStyle}}
        onClick={() => _onChange('fontStyle', fontStyle.fontStyle === 'italic' ? 'normal' : 'italic')}
        >
          I
      </span>
      <Tooltip
        force
        title={<ButtonGroup onClick={(e, key) => _onChange('textDecoration', key)} defaultActive={fontStyle.textDecoration}>
          <Button key="none">无</Button>
          <Button key="underline">下划线</Button>
          <Button key="line-through">中划线</Button>
          <Button key="overline">上划线</Button>
        </ButtonGroup>}
      >
        <span style={{textDecoration: fontStyle.textDecoration}}>U</span>
      </Tooltip>
    </div>;
});
