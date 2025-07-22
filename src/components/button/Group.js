import React, {useState} from 'react';
import { getPrefix } from '../../lib/classes';

const ButtonGroup = React.memo(({children, onClick, defaultActive,
                                  disableChangeActive, className = '', ...restProps}) => {
  const [active, changeActive] = useState(defaultActive);
  const currentPrefix = getPrefix('components-button');
  const finalActiveKey = 'active' in restProps ? restProps.active : active;
  const _onClick = (e, key) => {
    if(finalActiveKey !== key) {
      onClick && onClick(e, key);
      !disableChangeActive && changeActive(key);
    }
  };
  return (
    <div className={`${currentPrefix}-group ${className}`}>
      {
        children
          .map((c, index) => {
            const buttonKey = c.key || index;
            return React.cloneElement(c, {
              key: buttonKey,
              onClick: e => _onClick(e, buttonKey),
              active: finalActiveKey === buttonKey,
            });
          })
      }
    </div>
  );
});

export default ButtonGroup;
