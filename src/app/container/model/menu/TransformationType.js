import React from 'react';
import {Radio, Form, Tooltip, Icon} from 'components';
import {getPrefix} from '../../../../lib/classes';

export default React.memo(({onChange}) => {
    const FormItem = Form.FormItem;
    const RadioGroup = Radio.RadioGroup;
    const currentPrefix = getPrefix('container-model-left-modelTransformationType');
    return <div className={currentPrefix}>
      <Form>
        <FormItem label={<span><span>模型转换冲突</span><span>
          <Tooltip force title="转换关系图，会自动转换该关系图内的模型，如转换过程中模型出现重复的情况，将根据此处选择的规则自动处理"><Icon type='icon-issue'/></Tooltip>
        </span></span>} >
          <RadioGroup
            defaultValue='create'
            onChange={e => onChange(e)}
            >
            <Radio value='use' key="use">
                        使用存在的模型(转换后的新关系图中，该模型的关联信息可能丢失)
            </Radio>
            <Radio value='create' key="create">
                        自动重命名创建新模型
            </Radio>
          </RadioGroup>
        </FormItem>
      </Form>
    </div>;
});
