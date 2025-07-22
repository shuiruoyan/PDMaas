import React from 'react';
import {Checkbox, Select} from 'components';
import {getPrefix} from '../../../../../lib/classes';

export default React.memo(({defaultValue, onChange}) => {
    const Option = Select.Option;
    const _onChange = (data) => {
        onChange(data);
    };
    const currentPrefix = getPrefix('container-model-mind-config-base');
    return <div className={`${currentPrefix}-line-item`}>
      <span>
        <span>是否开启节点自由拖拽</span>
        <span>
          <Checkbox
            onChange={e => _onChange({
                  enableFreeDrag: e.target.checked,
              })}
            defaultChecked={defaultValue.enableFreeDrag}
          />
        </span>
      </span>
      <span>
        <span>鼠标滚轮行为</span>
        <span>
          <Select
            defaultValue={defaultValue.mousewheelAction}
            onChange={e => _onChange({
                  mousewheelAction: e.target.value,
              })}
          >
            <Option value='zoom'>缩放</Option>
            <Option value='move'>移动</Option>
          </Select>
        </span>
      </span>
      <span>
        <span>创建新节点的行为</span>
        <span>
          <Select
            defaultValue={defaultValue.createNewNodeBehavior}
            onChange={e => _onChange({
                  createNewNodeBehavior: e.target.value,
              })}
          >
            <Option value='notActive'>不激活</Option>
            <Option value='default'>激活编辑</Option>
            <Option value='activeOnly'>只激活</Option>
          </Select>
        </span>
      </span>
    </div>;
});
