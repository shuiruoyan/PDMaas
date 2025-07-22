import React, {useContext, useState} from 'react';

import './style/index.less';
import {classesMerge, getPrefix} from '../../lib/classes';
import {PermissionContext, ViewContent} from '../../lib/context';
import {checkPermission} from '../../lib/permission';

const Switch = React.memo(({checked, valueFormat,
                               nsKey, defaultChecked, onChange, disable}) => {
    const finalNsKey = nsKey || useContext(PermissionContext);
    const isView = useContext(ViewContent);
    const finalDisable = isView ||
        (finalNsKey ? (!checkPermission(finalNsKey) || disable) : disable);
    const currentPrefix = getPrefix('components-switch');
    const [currentChecked, setChecked] = useState(defaultChecked);
    const onClick = (c) => {
        if(!finalDisable) {
            const tempChecked = !c ? valueFormat.checked : valueFormat.unchecked;
            setChecked(tempChecked);
            onChange && onChange(tempChecked);
        }
    };
    const finalChecked = valueFormat.checked === (checked === undefined ? currentChecked : checked);
    return <div
      onClick={() => onClick(finalChecked)}
      className={classesMerge({
        [currentPrefix]: true,
        [`${currentPrefix}-checked`]: finalChecked,
        [`${currentPrefix}-unchecked`]: !finalChecked,
        [`${currentPrefix}-disable`]: finalDisable,
    })}>
      <div className={`${currentPrefix}-bar`} />
    </div>;
});

Switch.defaultProps = {
    valueFormat: {
        checked: true,
        unchecked: false,
    },
};

export default Switch;
