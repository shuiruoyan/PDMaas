import React, {useState} from 'react';
import { SimpleTab } from 'components';
import {classesMerge, getPrefix} from '../../../../../../lib/classes';
import './style/index.less';

import icons from './icons';
import images from './images';

export default React.memo(({onIconChange, onImgChange, defaultData}) => {
    const currentPrefix = getPrefix('container-model-mind-icons');
    const [iconList, setIconList] = useState(defaultData.iconList);
    const [imageData, setImageData] = useState(defaultData.imageData);
    const setIcon = (icon) => {
        setIconList((pre) => {
            const sameTypeIndex = pre.findIndex(i => i.split('_')[0] === icon.split('_')[0]);
            if(sameTypeIndex > -1) {
                if(pre[sameTypeIndex] === icon) {
                    return pre.filter(i => i !== icon);
                }
                return pre.map((p, i) => {
                    if(i === sameTypeIndex) {
                        return icon;
                    }
                    return p;
                });
            }
            return pre.concat(icon);
        });
        onIconChange && onIconChange(icon);
    };
    const setImage = (data) => {
        if(data.url === imageData) {
            setImageData('');
            onImgChange && onImgChange({backgroundImage: 'none'}, {w: 0, h: 0});
        } else {
            setImageData(data.url);
            onImgChange && onImgChange({backgroundImage: data.url},
                {w: data.width, h: data.height});
        }
    };
    const RenderIcons = ({iconData, type}) => {
        return <div className={`${currentPrefix}-group`}>
          {iconData.map((g) => {
                return <div key={g.type} className={`${currentPrefix}-group-item`}>
                  <div>{g.name}</div>
                  <div className={`${currentPrefix}-group-item-list ${currentPrefix}-group-item-list-${type}`}>
                    {
                        g.list.map((l) => {
                            return <span
                              key={l.name}
                              className={classesMerge({
                                  [`${currentPrefix}-group-item-list-${type}-active`]: type === 'icon'
                                      ? iconList.includes(`${g.type}_${l.name}`) : imageData === l.url,
                              })}
                              onClick={type === 'icon'
                                ? () => setIcon(`${g.type}_${l.name}`) : () => setImage(l)}>
                              {
                                  l.url ? <img key={l.name} alt='' src={l.url}/> : <span
                                    key={l.name}
                                      // eslint-disable-next-line react/no-danger
                                    dangerouslySetInnerHTML={{__html: l.icon}}
                                  />
                              }
                            </span>;
                        })
                    }
                  </div>
                </div>;
          })}
        </div>;
    };
    return <div className={currentPrefix}>
      <SimpleTab
        defaultActive='icon'
        options={[
                {
                    key: 'icon',
                    content: <RenderIcons
                      type='icon'
                      iconData={icons}
                    />,
                    title: '图标',
                },
                {
                    key: 'img',
                    title: '贴纸',
                    content: <RenderIcons
                      type='img'
                      iconData={images}
                    />,
                }]}
        />
    </div>;
});
