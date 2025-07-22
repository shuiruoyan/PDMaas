import React, {useState} from 'react';
import ReactDom from 'react-dom';
import {classesMerge, getPrefix} from '../../../../../lib/classes';

import icons from '../mindbar/icon/icons';

const QuickIcon = React.memo(({node, icon}) => {
    const currentPrefix = getPrefix('container-model-mind-nodetool-icon-list');
    const [currentIcon, setCurrentIcon] = useState(icon);
    const iconArray = icon.split('_');
    const type = iconArray[0];
    const iconList = icons.filter(l => l.type === type)[0];
    const setIcon = (iconData) => {
        setCurrentIcon(iconData);
        const currentIcons = [...node.getData('icon') || []];
        node.setIcon(currentIcons.map((i) => {
            if(i.split('_')[0] === iconData.split('_')[0]) {
                return iconData;
            }
            return i;
        }));
    };
    return <div className={currentPrefix}>
      {
        iconList.list.map((i) => {
            return <span
              className={classesMerge({
                    [`${currentPrefix}-item-active`]: currentIcon === `${type}_${i.name}`,
                })}
              onClick={() => setIcon(`${type}_${i.name}`)}
            >
              {
                  i.url ? <img key={i.name} alt='' src={i.url}/> : <span
                    key={i.name}
                      // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{__html: i.icon}}
                  />
              }
            </span>;
        })
    }
    </div>;
});

export const hidden = (nodeToolId) => {
    let iconToolDom = document.getElementById(`${nodeToolId}-icon`);
    if(iconToolDom) {
        ReactDom.unmountComponentAtNode(iconToolDom);
        document.body.removeChild(iconToolDom);
    }
};

export const show = (nodeToolId, node, icon) => {
    const currentPrefix = getPrefix('container-model-mind-nodetool-icon');
    hidden(nodeToolId);
    const iconToolDom = document.createElement('div');
    iconToolDom.setAttribute('id', `${nodeToolId}-icon`);
    iconToolDom.setAttribute('class', currentPrefix);
    document.body.append(iconToolDom);
    const rect = node.getRect();
    iconToolDom.style.left = `${rect.x}px`;
    const top = rect.y + rect.height + 10;
    iconToolDom.style.top = `${top}px`;
    iconToolDom.style.maxHeight = `${window.innerHeight - top}px`;
    ReactDom.render(<QuickIcon
      node={node}
      icon={icon}
    />, iconToolDom);
};

