import React, { forwardRef, useImperativeHandle } from 'react';
import { getPrefix } from '../../../../../../lib/classes';
import './style/index.less';

export default React.memo(forwardRef(({ cellType, renderDetail }, ref) => {
    const currentPrefix = getPrefix('container-model-relation-celltool-model');
    const iconArray = ['color', 'fill', 'bold'];
    const getModelTools = () => {
        if(cellType.startsWith('concept-entity-node')) {
            if(cellType !== 'concept-entity-node') {
                return [
                    {
                        name: 'titleStyle',
                        title: '标题区',
                        icon: [...iconArray],
                    },
                    {
                        name: 'borderStyle',
                        title: '边框和填充',
                        icon: ['fill', 'stroke'],
                    },
                ];
            }
            return [
                {
                    name: 'titleStyle',
                    title: '标题区',
                    icon: [...iconArray],
                },
                {
                    name: 'contentStyle',
                    title: '内容区',
                    icon: [...iconArray],
                },
                {
                    name: 'borderStyle',
                    title: '边框和填充',
                    icon: ['fill', 'stroke'],
                },
            ];
        }
        return [
            {
                name: 'titleStyle',
                title: '标题区',
                icon: [...iconArray],
            },
            {
                name: 'primaryKeyStyle',
                title: '主键区',
                icon: [...iconArray],
            },
            {
                name: 'foreignKeyStyle',
                title: '外键区',
                icon: [...iconArray],
            },
            {
                name: 'fieldStyle',
                title: '属性区',
                icon: [...iconArray],
            },
            {
                name: 'borderStyle',
                title: '边框和填充',
                icon: ['fill', 'stroke'],
            },
            {
                name: 'divideLineStyle',
                title: '分割线 ',
                icon: ['stroke'],
            },
        ];
    };
    const modelTools = getModelTools();
    // if (cellType === 'logic-entity-node') {
    //     modelTools.splice(4, 0, {
    //         name: 'contentStyle',
    //         title: '内容区',
    //         icon: [...iconArray],
    //     });
    // }
    useImperativeHandle(ref, () => {
        return {

        };
    }, []);
    return <div className={`${currentPrefix}-item-group`}>
      {
            modelTools.map((tool,i) => {
                return <div
                  key={i}
                  className={`${currentPrefix}-item`}>
                  <div className={`${currentPrefix}-item-title`}>
                    {tool.title}
                  </div>
                  <div className={`${currentPrefix}-item-body`}>
                    {
                            tool.icon.map((icon, index) => {
                                return <div
                                  key={index}
                                >{renderDetail(icon, tool.name)}
                                </div>;
                            })
                        }
                  </div>
                </div>;
            })
        }
    </div>;
}));
