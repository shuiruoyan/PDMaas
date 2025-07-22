import { ObjectExt } from '@antv/x6';
import {entityAttr2Simple} from '../../util/celltools';

export default {
    shape: 'concept-entity-node-diamond',
    markup: [
        {
            tagName: 'polygon',
            selector: 'body',
        },
        {
            tagName: 'text',
            selector: 'text',
        },
    ],
    attrs: {
        body: {
            refPoints: '0,10 10,0 20,10 10,20',
        },
        text: {
            refX: 0.5,
            refY: 0.5,
        },
    },
    propHooks: {
        originData(metadata) {
            const { originData, count, entitySetting, ...others } = metadata;
            if(originData && entitySetting) {
                // 设置样式
                ObjectExt.setByPath(others, 'attrs', entityAttr2Simple(entitySetting));
                // 设置标题
                const text = `${entitySetting.titleText.customValue
                    .replace(/\{defKey\}/g, originData.defKey)
                    .replace(/\{defName\}/g, originData.defName)}${count > 1 ? `:${count}` : ''}`;
                ObjectExt.setByPath(others, 'attrs/text/text', text);
            }
            return {
                originData,
                count,
                entitySetting,
                ...others,
            };
        },
    },
};
