import React from 'react';

// 主题 语言 等内容的支持
const defaultConfig = {
  lang: 'zh' // 默认为中文
};

export const ConfigContent = React.createContext(defaultConfig);

export const ViewContent = React.createContext(false);

export const FormContext = React.createContext({});

export const EventContext = React.createContext({});

export const TableContext = React.createContext({});

export const PermissionContext = React.createContext('');