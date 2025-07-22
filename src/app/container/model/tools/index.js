import React from 'react';
import {openDrawer, openModal } from 'components';
import FromModelFile from './FromModelFile';
import ExportDDL from './ExportDDL';
import ExportWord from './ExportWord';
import {MODAL_ID} from '../menu/tool';
import ExportHtml from './ExportHtml';
import ExportProject from './ExportProject';
import ExportMarkDown from './ExportMarkDown';

export const hardwareDropClick = (m, hardwareRef, getCurrentDataSource, defaultTreeData,
                                  onRefresh, treeData, getCurrentStandard) => {
    let Com, drawer, title;
    const onCancel = () => {
        drawer.close();
    };
    switch (m.key) {
        case 'exportProject':
            Com = ExportProject;
            title = '导出并下载项目文件-请您选择导出内容';
            break;
        case 'fromEZDML':
        case 'fromPDManer':
        case 'fromPDManerEE':
            Com = FromModelFile;
            title = '从模型文件读取';
            break;
        case 'exportDDL':
            Com = ExportDDL;
            title = '导出DDL';
            break;
        case 'exportWORD':
            Com = ExportWord;
            title = '导出WORD';
            break;
        case 'exportHtml':
            Com = ExportHtml;
            title = '导出HTML';
            break;
        case 'exportMarkDown':
            Com = ExportMarkDown;
            title = '导出Markdown';
            break;
        default:
            break;
    }
    if(m.key === 'exportWORD' || m.key === 'exportProject' || m.key === 'exportHtml' || m.key === 'exportMarkDown') {
        openModal(<Com
          getCurrentDataSource={getCurrentDataSource}
          getCurrentStandard={getCurrentStandard}
          treeData={treeData}
        />, {
            id: MODAL_ID,
            bodyStyle: {
                width: '60%',
            },
            title: title,
        });
    } else {
        drawer = openDrawer(<Com
          ref={hardwareRef}
          getCurrentStandard={getCurrentStandard}
          getCurrentDataSource={getCurrentDataSource}
          close={onCancel}
          defaultTreeData={defaultTreeData}
          defaultActive={m.key}
          onRefresh={onRefresh}
          treeData={treeData}
        />, {
            title: title || m.name,
            maskClosable: false,
            closeable: false,
            placement: 'right',
            width: '90%',
        });
    }

};

