import React, {useEffect, useRef, useState, forwardRef, useImperativeHandle, useMemo} from 'react';
import { Loading } from '../loading';
import Message from '../message';

import './style/index.less';
import {getPrefix} from '../../lib/classes';
import {PROJECT} from '../../lib/constant';
import {notify, subscribeEvent, unSubscribeEvent} from '../../lib/subscribe';
import {openLink} from '../../lib/app_tool';

export default React.memo(forwardRef(({defaultData, getCurrentDataSource,
                                          onChange, readonly, open, openCellLink}, ref) => {
    const iframeRef = useRef(null);
    const [loading, setLoading] = useState(true);
    //const isInit = useRef(true);
    const tabId = useMemo(() => Math.uuid(), []);
    const currentPrefix = getPrefix('components-drawio');
    useImperativeHandle(ref, () => {
        return {
            update: (data) => {
                iframeRef.current.contentWindow.postMessage({
                    status: 'update',
                    data,
                    id: tabId,
                });
            },
            updateCellLink: (data) => {
                iframeRef.current.contentWindow.postMessage({
                    status: 'cellLinkUpdate',
                    data,
                    id: tabId,
                });
            },
        };
    }, []);
    const initListener = () => {
        const message = (e) => {
            if(e.data.id === tabId) {
                if(e.data.status === 'load') {
                    iframeRef.current.contentWindow.postMessage({
                        status: 'load',
                        data: defaultData.cellsData[0]?.data,
                        id: tabId,
                    });
                    setLoading(false);
                } else if(e.data.status === 'update') {
                    // if(!isInit.current) {
                    onChange && onChange(e.data.data);
                    // }
                    // isInit.current = false;
                } else if(e.data.status === 'cellLinkClick') {
                    if(e.data.data.startsWith('in:')) {
                        const link = e.data.data.split(':')[1];
                        const { project: { entities, diagrams }} = getCurrentDataSource();
                        const originEntity = entities.find(entity => entity.id === link);
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
                            const originDiagram = diagrams.find(d => d.id === link);
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
                        openLink(e.data.data);
                    }
                } else if(e.data.status === 'cellLinkEdit') {
                    openCellLink && openCellLink(e.data.data);
                } else if(e.data.status === 'save') {
                    notify('save');
                }
            }
        };
        window.addEventListener('message', message);
        return message;
    };
    const listener = useMemo(() => {
        return initListener();
    }, []);
    useEffect(() => {
        const subscribeEventId = Math.uuid();
        subscribeEvent('startResize', () => {
            iframeRef.current.style.pointerEvents = 'none';
        }, subscribeEventId);
        subscribeEvent('endResize', () => {
            iframeRef.current.style.pointerEvents = 'auto';
        }, subscribeEventId);
        return () => {
            unSubscribeEvent('startResize', subscribeEventId);
            unSubscribeEvent('endResize', subscribeEventId);
            window.removeEventListener('message', listener);
        };
    }, []);
    const onLoad = () => {
        // /setLoading(false);
    };
    return <div className={`${currentPrefix}-container`}>
      <Loading index={997} visible={loading} title='正在加载流程图资源...'>
        <iframe ref={iframeRef} onLoad={onLoad} className={currentPrefix} title='drawio' src={`asset/drawio/index.html?readonly=${readonly ? '1' : '2'}&ui=min&offline=1&pwa=0&language=zh&id=${tabId}`}/>
      </Loading>
    </div>;
}));
