import React, {useRef} from 'react';
import {Button, openModal, Icon} from 'components';

import ExportConfig from './ExportConfig';
import './style/index.less';

export default React.memo(({onExportData, getMind}) => {
    const configRef = useRef(null);
    const open = () => {
        let modal = null;
        const oncancel = () => {
            modal.close();
        };
        const onOK = () => {
            const configData = configRef.current.getDownloadData();
            const mind = getMind();
            mind.extraTextOnExport = configData.extraText;
            if (configData.downType === 'svg') {
                onExportData(configData.downType, true, configData.fileName,
                    `* {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }`);
            } else if (['smm', 'json'].includes(configData.downType)) {
                onExportData(
                    configData.downType,
                    true,
                    configData.fileName,
                    true,
                );
            } else if (configData.downType === 'png') {
                onExportData(
                    configData.downType,
                    true,
                    configData.fileName,
                    configData.isTransparent,
                );
            } else if (configData.downType === 'pdf') {
                onExportData(
                    configData.downType,
                    true,
                    configData.fileName,
                    configData.isTransparent,
                );
            } else {
                onExportData(configData.downType, true, configData.fileName);
            }
        };
        modal = openModal(<ExportConfig ref={configRef}/>, {
            title: '导出',
            bodyStyle: {
                width: '60%',
            },
            buttons: [
              <Button
                onClick={oncancel}
                key='oncancel'>
                    取消
              </Button>,
              <Button
                onClick={onOK}
                key='onOK'
                type='primary'>
                    确认
              </Button>],
        });
    };
    return <span onClick={open}>
      <Icon type='icon-inout-export' />
      <span>导出</span>
    </span>;
});
