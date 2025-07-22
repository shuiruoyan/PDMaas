import React, {useContext, useRef} from 'react';

import { Drawio, openModal, Button } from 'components';
import {sendData} from '../../../../lib/utils';
import {WS} from '../../../../lib/constant';
import {baseFlowNsKey, checkDataPermission} from '../../../../lib/permission';
import {ViewContent} from '../../../../lib/context';
import NodeLink from './link';

export default React.memo(({defaultData, getCurrentDataSource, open}) => {
    const drawRef = useRef(null);
    const nodeLinkRef = useRef(null);
    const readonly = checkDataPermission(baseFlowNsKey) < 2 || useContext(ViewContent);
    const onChange = (data) => {
        // 发送全量
        sendData({
            event: WS.DIAGRAM.MOP_DIAGRAM_FL_UPDATE,
            payload: [{
                diagramId: defaultData.id,
                defName: defaultData.defName,
                defKey: defaultData.defKey,
                type: defaultData.type,
                data,
            }],
        });
    };
    const openCellLink = (data) => {
        let modal;
        const onCancel = () => {
            modal.close();
        };
        const onOK = () => {
            const currentLink = nodeLinkRef.current.linkData();
            drawRef.current.updateCellLink(currentLink.hyperlink);
            modal.close();
        };
        modal = openModal(<NodeLink
          ref={nodeLinkRef}
          getCurrentDataSource={getCurrentDataSource}
          defaultData={{
                hyperlink: data,
            }}
        />, {
            title: '设置链接',
            buttons: [
              <Button key='onCancel' onClick={onCancel}>取消</Button>,
              <Button key='onOk' type="primary" onClick={onOK} >确定</Button>,
            ],
        });
    };
    return <Drawio
      openCellLink={openCellLink}
      key={readonly}
      open={open}
      getCurrentDataSource={getCurrentDataSource}
      ref={drawRef}
      readonly={readonly}
      onChange={onChange}
      defaultData={defaultData}/>;
});
