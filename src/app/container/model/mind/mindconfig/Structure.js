import React, {useState} from 'react';
import {classesMerge, getPrefix} from '../../../../../lib/classes';

export default React.memo(({getMind}) => {
    const currentPrefix = getPrefix('container-model-mind-config-theme');
    const [layout, setLayout] = useState(() => {
        const mind = getMind();
        return mind.getLayout();
    });
    const imgBase = './asset/mind/structures/';
    const layoutImgMap = {
        logicalStructure: `${imgBase}logicalStructure.png`,
        mindMap: `${imgBase}mindMap.png`,
        organizationStructure: `${imgBase}organizationStructure.png`,
        catalogOrganization: `${imgBase}catalogOrganization.png`,
        timeline: `${imgBase}timeline.png`,
        timeline2: `${imgBase}timeline2.png`,
        fishbone: `${imgBase}fishbone.png`,
        verticalTimeline: `${imgBase}verticalTimeline.png`,
    };
    const layoutList = [
        {
            name: '逻辑结构图',
            value: 'logicalStructure',
        },
        {
            name: '思维导图',
            value: 'mindMap',
        },
        {
            name: '组织结构图',
            value: 'organizationStructure',
        },
        {
            name: '目录组织图',
            value: 'catalogOrganization',
        },
        {
            name: '时间轴',
            value: 'timeline',
        },
        {
            name: '时间轴2',
            value: 'timeline2',
        },
        {
            name: '竖向时间轴',
            value: 'verticalTimeline',
        },
        {
            name: '鱼骨图',
            value: 'fishbone',
        },
    ];
    const updateLayout = (value) => {
        setLayout(value);
        const mind = getMind();
        mind.setLayout(value);
        mind.emit('layout_ui_change', value);
    };
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-list`}>
        {
            layoutList.map((t) => {
                    return <div
                      key={t.value}
                      onClick={() => updateLayout(t.value)}
                      className={classesMerge({
                            [`${currentPrefix}-list-item`]: true,
                            [`${currentPrefix}-list-item-active`]: layout === t.value,
                        })}>
                      <div>
                        <img alt='' src={layoutImgMap[t.value]}/>
                      </div>
                      <div>{t.name}</div>
                    </div>;
                })
            }
      </div>
    </div>;
});
