import React from 'react';
import { Icon } from 'components';
import {getPrefix} from '../../../../../lib/classes';

export default React.memo(() => {
    // 快捷键列表
    const shortcutKeyList = [
        {
            type: '节点操作',
            list: [
                {
                    name: '插入下级节点',
                    value: 'Tab',
                    icon: 'icon-mind-child-node',
                },
                {
                    name: '插入同级节点',
                    value: 'Enter',
                    icon: 'icon-adjust',
                },
                {
                    name: '插入父节点',
                    value: 'Shift + Tab',
                    icon: 'icon-mind-parent-node',
                },
                {
                    name: '上移节点',
                    value: 'Ctrl + ↑',
                    icon: 'icon-arrow-up',
                },
                {
                    name: '下移节点',
                    value: 'Ctrl + ↓',
                    icon: 'icon-arrow-down',
                },
                {
                    name: '插入概要',
                    value: 'Ctrl + G',
                    icon: 'icon-excel',
                },
                {
                    name: '展开/收起节点',
                    value: '/',
                    icon: 'icon-plus-circle',
                },
                {
                    name: '删除节点',
                    value: 'Delete | Backspace',
                    icon: 'icon-oper-delete',
                },
                {
                    name: '仅删除当前节点',
                    value: 'Shift + Backspace',
                    icon: 'icon-oper-delete',
                },
                {
                    name: '复制节点',
                    value: 'Ctrl + C',
                    icon: 'icon-clipboard-copy',
                },
                {
                    name: '剪切节点',
                    value: 'Ctrl + X',
                    icon: 'icon-cut',
                },
                {
                    name: '粘贴节点',
                    value: 'Ctrl + V',
                    icon: 'icon-clipboard-paste',
                },
                {
                    name: '编辑节点',
                    value: 'F2',
                    icon: 'icon-oper-edit',
                },
                {
                    name: '文本换行',
                    value: 'Shift + Enter',
                    icon: 'icon-newline',
                },
                {
                    name: '回退',
                    value: 'Ctrl + Z',
                    icon: 'icon-undo-solid',
                },
                {
                    name: '前进',
                    value: 'Ctrl + Y',
                    icon: 'icon-redo-solid',
                },
                {
                    name: '全选',
                    value: 'Ctrl + A',
                    icon: 'icon-square-check',
                },
                {
                    name: '多选',
                    value: '右键 / Ctrl + 左键',
                    icon: 'icon-square-check',
                },
                {
                    name: '一键整理布局',
                    value: 'Ctrl + L',
                    icon: 'icon-auto-layout',
                },
                {
                    name: '搜索和替换',
                    value: 'Ctrl + F',
                    icon: 'icon-search',
                },
            ],
        },
        {
            type: '画布操作',
            list: [
                {
                    name: '放大',
                    value: 'Ctrl + +',
                    icon: 'icon-zoom-out',
                },
                {
                    name: '缩小',
                    value: 'Ctrl + -',
                    icon: 'icon-zoom-in',
                },
                {
                    name: '放大/缩小',
                    value: 'Ctrl + 鼠标滚动',
                    icon: 'icon-zoom-out',
                },
                {
                    name: '回到根节点',
                    value: 'Ctrl + Enter',
                    icon: 'icon-take-aim',
                },
                {
                    name: '适应画布',
                    value: 'Ctrl + i',
                    icon: 'icon-ui-restore',
                },
            ],
        },
        {
            type: '大纲操作',
            list: [
                {
                    name: '删除节点',
                    value: 'Delete',
                    icon: 'icon-oper-delete',
                },
                {
                    name: '插入下级节点',
                    value: 'Tab',
                    icon: 'icon-mind-child-node',
                },
                {
                    name: '插入同级节点',
                    value: 'Enter',
                    icon: 'icon-adjust',
                },
                {
                    name: '上移一个层级',
                    value: 'Shift + Tab',
                    icon: 'icon-mind-parent-node',
                },
            ],
        },
    ];
    const currentPrefix = getPrefix('container-model-mind-config-shortcutkey');
    return <div className={currentPrefix}>{
        shortcutKeyList.map((s) => {
            return <div key={s.type}>
              <div>{s.type}</div>
              <div>{s.list.map((l) => {
                    return <div key={l.value}>
                      <span><Icon type={l.icon}/>{l.name}</span>
                      <span>{l.value}</span>
                    </div>;
                })}</div>
            </div>;
        })
    }</div>;
});
