import React, {useContext, useEffect, useMemo, useRef} from 'react';

import { Mind } from 'components';

import MindTool from './mindtool';
import MiniMap from './minimap';
import MindConfig from './mindconfig';
import MindBar from './mindbar';
import MindSearch from './mindsearch';
import * as quickIcon from './nodetool/quickIcon';
import * as quickRich from './nodetool/quickRich';

import './style/index.less';
import {getPrefix} from '../../../../lib/classes';
import {sendData} from '../../../../lib/utils';
import {WS} from '../../../../lib/constant';
import {baseMindNsKey, checkDataPermission} from '../../../../lib/permission';
import {ViewContent} from '../../../../lib/context';

export default React.memo(({defaultData, getCurrentDataSource, open, expandHome}) => {
    const readonly = checkDataPermission(baseMindNsKey) < 2 || useContext(ViewContent);
    const currentPrefix = getPrefix('container-model-mind');
    const mindRef = useRef(null);
    const toolRef = useRef(null);
    const currentMind = useRef(null);
    const miniRef = useRef(null);
    const mindConfigRef = useRef(null);
    const barRef = useRef(null);
    const searchRef = useRef(null);
    const nodeToolId = useMemo(() => `com-${Math.uuid()}`, []);
    const currentNode = useRef(null);
    const getMind = () => {
        return currentMind.current;
    };

    const undo = () => {
        currentMind.current.execCommand('BACK');
    };

    const redo = () => {
        currentMind.current.execCommand('FORWARD');
    };

    const minMapChange = (status) => {
        miniRef.current.show(currentMind.current, status);
    };

    const onFullScreen = (isFullScreen) => {
        expandHome(!isFullScreen);
    };

    useEffect(() => {
        currentMind.current = mindRef.current.getMind();

        const backForward = (index, len) => {
            toolRef.current.setHistory({
                canRedo: index < len - 1,
                canUndo: index > 0,
            });
        };
        const scaleChange = (scale) => {
            toolRef.current.scaleChange(scale);
        };
        const dataChangeDetail = (data) => {
            // 节点内容变化 发送命令
            sendData({
                event: WS.DIAGRAM.MOP_DIAGRAM_MM_UPDATE,
                payload: [{
                    diagramId: defaultData.id,
                    defName: defaultData.defName,
                    defKey: defaultData.defKey,
                    type: defaultData.type,
                    data: data.filter(d => d.action === 'update'),
                }],
            });
        };
        const mindConfigChange = (name, value) => {
            sendData({
                event: WS.DIAGRAM.MOP_DIAGRAM_MM_SETTING,
                payload: {
                    id: defaultData.id,
                    defName: defaultData.defName,
                    defKey: defaultData.defKey,
                    type: defaultData.type,
                    data: {
                      [name]: value,
                    },
                },
            });
        };
        const viewThemeChange = (value) => {
            // 主题发生后 发送命令 重置主题设置
            mindConfigChange('theme', value);
        };
        const setData = () => {
            // 导入数据
            sendData({
                event: WS.DIAGRAM.MOP_DIAGRAM_MM_UPDATE,
                payload: [{
                    diagramId: defaultData.id,
                    defName: defaultData.defName,
                    defKey: defaultData.defKey,
                    type: defaultData.type,
                    data: [{
                        action: 'import',
                        data: currentMind.current.getData(),
                    }],
                }],
            });
            // 调整思维导图主题相关
            mindConfigChange();
        };
        const layoutChange = (value) => {
            mindConfigChange('layout', value);
            // 修改布局后发送命令
        };
        const viewThemeConfigChange = (value) => {
            mindConfigChange('themeConfig', value);
            // 修改基础设置
        };
        const nodeActive = (...args) => {
            mindConfigRef.current.setNodeActive(args[1]);
            barRef.current.setNodeActive(args[1]);
            if (args[0] !== currentNode.current) {
                quickIcon.hidden(nodeToolId);
            }
        };
        const painterStart = () => {
            barRef.current.setPainter(true);
        };
        const painterEnd = () => {
            barRef.current.setPainter(false);
        };
        const showQuickIcon = (...args) => {
            currentNode.current = args[0];
            quickIcon.show(nodeToolId, ...args);
        };
        const svgMousedown = () => {
            quickIcon.hidden(nodeToolId);
        };
        const searchChange = (data) => {
            searchRef.current.setSearchInfo(data);
        };
        currentMind.current.keyCommand.addShortcut('Control+f', () => {
            searchRef.current.showSearch(true);
        });
        const selectionChange = (hasRange, rect, formatInfo) => {
            if(hasRange) {
                setTimeout(() => {
                    quickRich.show(nodeToolId, rect, formatInfo, currentMind.current);
                });
            } else {
                setTimeout(() => {
                    quickRich.hidden(nodeToolId, currentMind.current);
                });
            }
        };
        // 监听撤销重做
        currentMind.current.on('back_forward', backForward);
        currentMind.current.on('scale', scaleChange);
        currentMind.current.on('data_change_detail', dataChangeDetail);
        currentMind.current.on('node_active', nodeActive);
        currentMind.current.on('painter_start', painterStart);
        currentMind.current.on('painter_end', painterEnd);
        currentMind.current.on('node_icon_click', showQuickIcon);
        currentMind.current.on('svg_mousedown', svgMousedown);
        currentMind.current.on('search_info_change', searchChange);
        currentMind.current.on('rich_text_selection_change', selectionChange);
        currentMind.current.on('theme_ui_change', viewThemeChange);
        currentMind.current.on('set_data', setData);
        currentMind.current.on('layout_ui_change', layoutChange);
        currentMind.current.on('theme_config_ui_change', viewThemeConfigChange);
        return () => {
            currentMind.current.off('back_forward', backForward);
            currentMind.current.off('scale', scaleChange);
            currentMind.current.off('data_change_detail', scaleChange);
            currentMind.current.off('node_active', nodeActive);
            currentMind.current.off('painter_start', painterStart);
            currentMind.current.off('painter_end', painterEnd);
            currentMind.current.off('node_icon_click', showQuickIcon);
            currentMind.current.off('svg_mousedown', svgMousedown);
            currentMind.current.off('search_info_change', searchChange);
            currentMind.current.on('rich_text_selection_change', selectionChange);
            currentMind.current.keyCommand.removeShortcut('Control+f');
            currentMind.current.off('theme_ui_change', viewThemeChange);
            currentMind.current.off('set_data', setData);
            currentMind.current.off('layout_ui_change', layoutChange);
            currentMind.current.off('theme_config_ui_change', viewThemeConfigChange);
            currentMind.current.destroy();
        };
    }, []);

    return <div className={currentPrefix}>
      <MindSearch ref={searchRef} getMind={getMind}/>
      <MindBar
        readonly={readonly}
        getCurrentDataSource={getCurrentDataSource}
        hiddenTool={() => quickIcon.hidden(nodeToolId)}
        ref={barRef}
        getMind={getMind}/>
      <Mind
        open={open}
        readonly={readonly}
        defaultData={defaultData}
        getCurrentDataSource={getCurrentDataSource}
        ref={mindRef}/>
      <MiniMap ref={miniRef}/>
      <MindConfig readonly={readonly} ref={mindConfigRef} getMind={getMind}/>
      <MindTool
        readonly={readonly}
        minMapChange={minMapChange}
        ref={toolRef}
        getMind={getMind}
        undo={undo}
        redo={redo}
        onFullScreen={onFullScreen}
      />
    </div>;
});
