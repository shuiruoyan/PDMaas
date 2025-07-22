import React from 'react';
import {getPrefix} from '../../../../../lib/classes';

export const OperationTip = React.memo(() => {
    const currentPrefix = getPrefix('container-model-entity-physical-content');
    return <div className={`${currentPrefix}-operationtip`}>
      <div>操作提示:</div>
      <div>1. 单击行号选中当前行</div>
      <div>2. 按住Ctrl+单击行号，选中跳跃行</div>
      <div>3. 按住Shift+单击行号，选中连续行</div>
      <div>4. 选中行后，Ctrl+C复制，Ctrl+V粘贴</div>
      <div>5. 单元格内部使用Ctrl+Shift+K转换大小写</div>
      <div>6. 选择多行，能够批量调整数据域</div>
    </div>;
});
