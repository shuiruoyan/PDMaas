import React, {useState} from 'react';
import {
    Button,
    Checkbox,
    CodeEditor,
    IconTitle,
    Input,
    MultipleSelect, NumberInput,
    openModal,
    Select, Textarea,
    TreeSelect,
    MultiplTreeSelect,
} from 'components';
import PhysicEntityPresetFields from './PhysicEntityPresetFields';
import PhysicEntity from './PhysicEntity';
import PhysicEntityField from './PhysicEntityField';
import physicEntityHeader from './PhysicEntityHeader';
import PhysicEntityDatasource from './PhysicEntityDatasource';
import {classesMerge} from '../../../../lib/classes';

const exampleData = `
[
  {
    "label": "Node1",
    "value": "0-0",
    "children": [
      {
        "label": "Child Node1",
        "value": "0-0-0"
      }
    ]
  },
  {
    "label": "Node2",
    "value": "0-1",
    "children": [
      {
        "label": "Child Node3",
        "value": "0-1-0"
      },
      {
        "label": "Child Node4",
        "value": "0-1-1"
      },
      {
        "label": "Child Node5",
        "value": "0-1-2"
      }
    ]
  }
]
`;

export const selectFrameOptions = [
    {value: 'SingleText', label: '单行文本框', component: Input},
    {value: 'SingleDropdown', label: '单项下拉框', component: Select},
    {value: 'MultiDropdown', label: '多项下拉框', component: MultipleSelect},
    {value: 'MultiCheckbox', label: '多项复选框', component: Checkbox},
    {value: 'SingleTreeSelect', label: '单行树选择', component: TreeSelect},
    {value: 'MultiTreeSelect', label: '多行树选择', component: MultiplTreeSelect},
    {value: 'IntegerInput', label: '整数输入框', component: NumberInput},
    {value: 'DecimalInput', label: '小数输入框', component: NumberInput},
    {value: 'MultiText', label: '多行文本框', component: Textarea},
];

// eslint-disable-next-line import/no-mutable-exports
export let projectConfigTabs = [
    // eslint-disable-next-line react/react-in-jsx-scope
    {
        id: 'physicEntityPresetFields',
        className: 'default-field',
        name: '新建表预设字段',
        component: PhysicEntityPresetFields,
        dataList: [],
    },
    // eslint-disable-next-line react/react-in-jsx-scope
    {id: 'physicEntityAttr', className: 'sheet-setting', name: '数据表自定义属性', component: PhysicEntity},
    // eslint-disable-next-line react/react-in-jsx-scope
    {id: 'physicEntityFieldAttr', className: 'field-setting', name: '字段自定义属性', component: PhysicEntityField},
    // eslint-disable-next-line react/react-in-jsx-scope
    {id: 'physicEntityHeader', className: 'header-setting', name: '表头显示设置（字段）', component: physicEntityHeader},
];

// eslint-disable-next-line max-len
export const editOrChoseDatasource = (id, {row, setTableData, baseClass}) => {
    let modal = null;
    let modalRef = null;
    const DatasourceTitleCom = React.memo(() => {
        const [showExample, setShowExample] = useState(false);
        return <div className={`${baseClass}-datasource-title`}>
          <div
            className={classesMerge({
                    [`${baseClass}-datasource-title-example`]: true,
                    [`${baseClass}-datasource-title-example-display`]: showExample,
                })}
            onMouseOver={() => setShowExample(true)}
            onMouseLeave={() => setShowExample(false)}>
            <CodeEditor value={exampleData} width="100%" height="100%"/>
          </div>
          <div>编辑数据源</div>
          {/* eslint-disable-next-line max-len */}
          <div
            onMouseOver={() => setShowExample(true)}
            onMouseLeave={() => setShowExample(false)}>(<span>样例数据</span><IconTitle/>)
          </div>
        </div>;
    });
    const confirmDatasource = () => {
        Promise.resolve(setTableData(prevState => prevState.map((it) => {
            if (it.id === id) {
                return {
                    ...it,
                    optionsData: modalRef.getDatasource(),
                    optionsFetcher: modalRef.getUrlStr(),
                };
            }
            return it;
        }))).then(() => modal?.close());
    };
    modal = openModal(<PhysicEntityDatasource
      ref={instance => modalRef = instance}
      baseClass={`${baseClass}-datasource`}
      row={row}/>, {
        title: <DatasourceTitleCom/>,
        bodyStyle: {
            width: '40%',
        },
        buttons: [
          <Button onClick={() => modal.close()}>取消</Button>,
          <Button type="primary" onClick={confirmDatasource}>确定</Button>,
          <span
            className={`${baseClass}-datasource-url`}
            onClick={() => modalRef?.changeShowInputDiv()}>从远程提取</span>,
        ],
    });
};

export const getHeaderDefaultColumns = (profile) => {
    return [
        {key: 'defKey', component: Input},
        {key: 'defName', component: Input},
        {key: 'primaryKey', component: Checkbox},
        {key: 'notNull', component: Checkbox},
        {key: 'autoIncrement', component: Checkbox},
        {
            key: 'bizDomainType',
            component: Select,
            options: profile.team.bizDomainTypes.map((d) => {
                return {
                    value: d.defKey,
                    label: d.defName,
                };
            }),
        },
        {
            key: 'baseDataType',
            component: Select,
            options: profile.global.dataTypes.map((d) => {
                return {
                    value: d.defKey,
                    label: d.defName,
                };
            }),
        },
        {key: 'dbDataType', component: Input},
        {key: 'dataLen', component: NumberInput},
        {key: 'numScale', component: NumberInput},
        {key: 'notnull', component: Checkbox},
        {key: 'defaultValue', component: Input},
        {key: 'stndDictId', component: Input},
        {key: 'stndFieldId', component: Input},
    ];
};
