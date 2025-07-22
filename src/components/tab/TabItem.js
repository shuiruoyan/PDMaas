import React, {useMemo} from 'react';
import {getPrefix, classesMerge} from '../../lib/classes';

export default React.memo(({children, currentActive, currentKey}) => {
    const currentPrefix = getPrefix('components-tab-body-item');
    // 标签页下的内容 缓存优化 更新通过订阅事件触发
    const childrenMemo = useMemo(() => children, []);
    return <div className={classesMerge({
        [currentPrefix]: true,
        [`${currentPrefix}-hidden`]: currentActive !== currentKey,
        [`${currentPrefix}-show`]: currentActive === currentKey,
    })}>{childrenMemo}</div>;
});
