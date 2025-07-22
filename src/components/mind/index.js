import React, {useEffect, useRef, forwardRef, useImperativeHandle} from 'react';
import MindMap from 'simple-mind-map-pdmaas';
import { addDomResize, removeDomResize } from '../../lib/listener';


import './style/index.less';
import customicon from './customicon';
import {getPrefix} from '../../lib/classes';
import oreo from './customthemes/oreo';
import shallowSea from './customthemes/shallowSea';
import lemonBubbles from './customthemes/lemonBubbles';
import rose from './customthemes/rose';
import seaBlueLine from './customthemes/seaBlueLine';
import neonLamp from './customthemes/neonLamp';
import darkNightLceBlade from './customthemes/darkNightLceBlade';
import morandi from './customthemes/morandi';
import classic5 from './customthemes/classic5';
import dark3 from './customthemes/dark3';
import dark4 from './customthemes/dark4';
import cactus from './customthemes/cactus';
import classic6 from './customthemes/classic6';
import classic7 from './customthemes/classic7';

// eslint-disable-next-line import/order
import MiniMap from 'simple-mind-map-pdmaas/src/plugins/MiniMap';
// eslint-disable-next-line import/order
import Watermark from 'simple-mind-map-pdmaas/src/plugins/Watermark';
// eslint-disable-next-line import/order
import KeyboardNavigation from 'simple-mind-map-pdmaas/src/plugins/KeyboardNavigation';
// eslint-disable-next-line import/order
import ExportPDF from 'simple-mind-map-pdmaas/src/plugins/ExportPDF';
// eslint-disable-next-line import/order
import ExportXMind from 'simple-mind-map-pdmaas/src/plugins/ExportXMind';
// eslint-disable-next-line import/order
import Export from 'simple-mind-map-pdmaas/src/plugins/Export';
// eslint-disable-next-line import/order
import Drag from 'simple-mind-map-pdmaas/src/plugins/Drag';
// eslint-disable-next-line import/order
import Select from 'simple-mind-map-pdmaas/src/plugins/Select';
// eslint-disable-next-line import/order
import RichText from 'simple-mind-map-pdmaas/src/plugins/RichText';
// eslint-disable-next-line import/order
import AssociativeLine from 'simple-mind-map-pdmaas/src/plugins/AssociativeLine';
// eslint-disable-next-line import/order
import TouchEvent from 'simple-mind-map-pdmaas/src/plugins/TouchEvent';
// eslint-disable-next-line import/order
import NodeImgAdjust from 'simple-mind-map-pdmaas/src/plugins/NodeImgAdjust';
// eslint-disable-next-line import/order
import SearchPlugin from 'simple-mind-map-pdmaas/src/plugins/Search';
// eslint-disable-next-line import/order
import Painter from 'simple-mind-map-pdmaas/src/plugins/Painter';
// eslint-disable-next-line import/order
import Formula from 'simple-mind-map-pdmaas/src/plugins/Formula';
// eslint-disable-next-line import/order
import RainbowLines from 'simple-mind-map-pdmaas/src/plugins/RainbowLines';
import {PROJECT} from '../../lib/constant';
import {Message} from '../index';
import {openLink} from '../../lib/app_tool';

const customerTheme = [
    {
        value: 'oreo',
        theme: oreo,
    },
    {
        value: 'shallowSea',
        theme: shallowSea,
    },
    {
        value: 'lemonBubbles',
        theme: lemonBubbles,
    },
    {
        value: 'rose',
        theme: rose,
    },
    {
        value: 'seaBlueLine',
        theme: seaBlueLine,
    },
    {
        value: 'neonLamp',
        theme: neonLamp,
    },
    {
        value: 'darkNightLceBlade',
        theme: darkNightLceBlade,
    },
    {
        value: 'morandi',
        theme: morandi,
    },
    {
        value: 'classic5',
        theme: classic5,
    },
    {
        value: 'dark3',
        theme: dark3,
    },
    {
        value: 'dark4',
        theme: dark4,
    },
    {
        value: 'cactus',
        theme: cactus,
    },
    {
        value: 'classic6',
        theme: classic6,
    },
    {
        value: 'classic7',
        theme: classic7,
    }];

const Mind =  React.memo(forwardRef(({defaultData, readonly, getCurrentDataSource, open}, ref) => {
    const containerRef = useRef();
    const currentPrefix = getPrefix('components-mind');
    const mindMapRef = useRef(null);
    useImperativeHandle(ref, () => {
        return {
            getMind: () => {
                return mindMapRef.current;
            },
        };
    }, []);

    useEffect(() => {
        // 注册自定义主题
        customerTheme.forEach((item) => {
            MindMap.defineTheme(item.value, item.theme);
        });
        MindMap.usePlugin(MiniMap)
            .usePlugin(Watermark)
            .usePlugin(Drag)
            .usePlugin(KeyboardNavigation)
            .usePlugin(ExportPDF)
            .usePlugin(ExportXMind)
            .usePlugin(Export)
            .usePlugin(Select)
            .usePlugin(AssociativeLine)
            .usePlugin(NodeImgAdjust)
            .usePlugin(TouchEvent)
            .usePlugin(SearchPlugin)
            .usePlugin(Painter)
            .usePlugin(Formula)
            .usePlugin(RainbowLines)
            .usePlugin(RichText);
        // 自定义图标
        //console.log(customicon);
        mindMapRef.current = new MindMap({
            isLimitMindMapInCanvasWhenHasScrollbar: false,
            addContentToFooter: () => {
                const text = (mindMapRef.current.extraTextOnExport || '').trim();
                if (!text) return null;
                const el = document.createElement('div');
                el.className = 'footer';
                el.innerHTML = text;
                const cssText = `
            .footer {
              width: 100%;
              height: 30px;
              display: flex;
              justify-content: center;
              align-items: center;
              font-size: 12px;
              color: #979797;
            }
          `;
                return {
                    el,
                    cssText,
                    height: 30,
                };
            },
            iconList: customicon,
            el: containerRef.current,
            data: defaultData.cellsData[0],
            layout: defaultData?.props?.layout,
            theme: defaultData?.props?.theme || 'classic7',
            themeConfig: defaultData?.props?.themeConfig || {},
            maxTag: 10,
            useLeftKeySelectionRightKeyDrag: true,
        });
        mindMapRef.current.on('node_link_click', (node, link) => {
            if(link.startsWith('in:')) {
                console.log(link);
                const { project: { entities, diagrams }} = getCurrentDataSource();
                const linkValue = link.split(':')[1];
                const originEntity = entities.find(e => e.id === linkValue);
                if(originEntity) {
                    const typeMap = {
                        P: PROJECT.ENTITY,
                        L: PROJECT.LOGIC_ENTITY,
                        C: PROJECT.CONCEPT_ENTITY,
                    };
                    open && open({
                        nodeType: typeMap[originEntity.type],
                        ...originEntity,
                    });
                } else {
                    const originDiagram = diagrams.find(d => d.id === linkValue);
                    if(originDiagram) {
                        open && open({
                            nodeType: PROJECT.DIAGRAM,
                            ...originDiagram,
                        });
                    } else {
                        Message.error({title: '无效的链接'});
                    }
                }
            } else {
                openLink(link);
            }
        });
        mindMapRef.current.setMode(!readonly ? 'edit' : 'readonly');
        const eventId = Math.uuid();
        addDomResize(containerRef.current, eventId, () => {
            mindMapRef.current.resize();
        });
        return () => {
            removeDomResize(containerRef.current, eventId);
        };
    }, []);
    return <div className={currentPrefix} ref={containerRef} />;
}));

Mind.customicon = customicon;
Mind.customerTheme = customerTheme;

export default Mind;
