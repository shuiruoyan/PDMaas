import { PresetColorPicker, PresetStroke } from 'components';
import CanvasTitle from './CanvasTitle';
import _ from 'lodash'
import {opacity} from '../../../../../lib/color';
import CanvasSize from './CanvasSize';
import lineJumper from "./LineJumper";

export const iconTypes = {
    TEXT: 'TEXT',
    ICON: 'ICON',
    SEPARATOR : 'SEPARATOR',
    COMPONENT: 'COMPONENT'
}

export const BUTTON_ID = {
    A : 'A',
    N : 'N',
    K : 'K',
    C : 'C'
}

export const LOGICAL_COMPACT = {
    N: 'N',
    K: 'K'
}

export const PREVIEW_TYPE = {
    CONCEPTUAL: 'CONCEPTUAL',
    BASIC_SHAPE: 'BASIC_SHAPE',
    LINK_LINE: 'LINK_LINE',
    TEXT_BOX: 'TEXT_BOX',
    LOGIC: 'LOGIC',
    PHYSICAL: 'PHYSICAL'
}

const separatorTools = [
    { id: Math.uuid(), icon: 'separator'}
]

const colorPickerTools = [
    {id: Math.uuid(), icon: 'icon-font-color', Com: PresetColorPicker, property: 'color', value: '', defaultValue: '', diagramsProperty: 'colorFill', defKey: 'text'},
]

const textStyleTools = [
    {id: Math.uuid(), icon: 'icon-font-bold', property: 'fontWeight', value: 'bold', defaultValue: 'normal', diagramsProperty: 'font-weight', defKey: 'text'},
    {id: Math.uuid(), icon: 'icon-font-italics', property: 'fontStyle', value: 'italic', defaultValue: 'normal', diagramsProperty: 'font-style', defKey: 'text'},
    {id: Math.uuid(), icon: 'icon-font-underline', property: 'textDecoration', value: 'underline', defaultValue: 'none', diagramsProperty: 'text-decoration', defKey: 'text'},
]

const fontSizeAndFontFamilyTools = [
    {id: Math.uuid(), icon: 'text', text: 14},
    {id: Math.uuid(), icon: 'text', text: '思源黑体'},
]

const horizontalAlignTools = [
    {id: Math.uuid(), icon: 'icon-text-align-left', property: 'justifyContent', value: 'flex-start', defaultValue: '', diagramsProperty: 'textAnchor', diagramsPropertyValue: 'start', defKey: 'text'},
    {id: Math.uuid(), icon: 'icon-text-align-center', property: 'justifyContent',  value: 'center', defaultValue: '', diagramsProperty: 'textAnchor', diagramsPropertyValue: 'middle', defKey: 'text'},
    {id: Math.uuid(), icon: 'icon-text-align-right', property: 'justifyContent', value: 'flex-end', defaultValue: '', diagramsProperty: 'textAnchor', diagramsPropertyValue: 'end',  defKey: 'text'},
]

const verticalAlignTools = [
    {id: Math.uuid(), icon: 'icon-to-top', property: 'alignItems', value: 'flex-start', defaultValue: '', diagramsProperty: 'textVerticalAnchor', diagramsPropertyValue: 'top', defKey: 'text'},
    {id: Math.uuid(), icon: 'icon-to-middle', property: 'alignItems', value: 'center', defaultValue: '', diagramsProperty: 'textVerticalAnchor', diagramsPropertyValue: 'middle', defKey: 'text'},
    {id: Math.uuid(), icon: 'icon-to-bottom', property: 'alignItems', value: 'flex-end',  defaultValue: '', diagramsProperty: 'textVerticalAnchor', diagramsPropertyValue: 'bottom', defKey: 'text'},
]

const backgroundColorPickerTools = [
    {id: Math.uuid(), icon: 'icon-style-fill', Com: PresetColorPicker, property: 'backgroundColor', value: '', defaultValue: '', diagramsProperty: 'bgFill', defKey: 'body'}
]

const strokeStylePickerTools = [
    {id: Math.uuid(), icon: 'icon-style-border', Com: PresetStroke, property: 'border', value: '', defaultValue: '', diagramsProperty: 'stroke', defKey: 'body'}
]


export const commonCanvasSetup = [
    {
        firstTitle: '基本形状-默认设置',
        secondTitle: '',
        firstKey: 'shapeGeneral',
        previewType: PREVIEW_TYPE.BASIC_SHAPE,
        children: [
            {
                title: '文本样式',
                secondKey: '',
                items: colorPickerTools.concat(separatorTools)
                    .concat(textStyleTools).concat(separatorTools)
                    // .concat(fontSizeAndFontFamilyTools).concat(separatorTools)
                    .concat(horizontalAlignTools).concat(separatorTools)
                    .concat(verticalAlignTools)

            },
            {
                title: '边框和填充',
                secondKey: '',
                items: strokeStylePickerTools.concat(separatorTools)
                    .concat(backgroundColorPickerTools),
            },
            // {
            //     title: '边框样式',
            //     secondKey: '',
            //     items: strokeStylePickerTools
            // },
        ]
    },
    {
        firstTitle: '连接线-默认设置',
        secondTitle: '',
        firstKey: 'linkLine',
        previewType: PREVIEW_TYPE.LINK_LINE,
        children: [
            {
                title: '线条样式',
                secondKey: '',
                items: strokeStylePickerTools
            }
        ]
    },
    {
        firstTitle: '文本框-默认设置',
        secondTitle: '',
        firstKey: 'textbox',
        previewType: PREVIEW_TYPE.TEXT_BOX,
        children: [
            {
                title: '文本框',
                secondKey: '',
                items: colorPickerTools
                    // .concat(backgroundColorPickerTools)
                    .concat(separatorTools)
                    .concat(textStyleTools).concat(separatorTools)
                    // .concat(fontSizeAndFontFamilyTools).concat(separatorTools)
                    .concat(horizontalAlignTools).concat(separatorTools)
                    .concat(verticalAlignTools)
                    // .concat(separatorTools)

            },
        ]
    }
]

export const  conceptualModelData = [
    {
        firstTitle: '概念模型-默认设置',
        secondTitle: '(对使用默认设置以及后续新建对象有效)',
        firstKey: 'entitySetting',
        previewType: PREVIEW_TYPE.CONCEPTUAL,
        children: [
            {title: '标题文本', items: [], Com: CanvasTitle},
            {
                title: '标题样式',
                secondKey: 'titleStyle',
                items: colorPickerTools.concat(backgroundColorPickerTools).concat(separatorTools)
                    .concat(textStyleTools.slice(1, textStyleTools.length))
                    // .concat(separatorTools)
                    // .concat(fontSizeAndFontFamilyTools).concat(separatorTools)
            },
            {
                title: '内容样式',
                secondKey: 'contentStyle',
                items: colorPickerTools.concat(backgroundColorPickerTools).concat(separatorTools)
                    .concat(textStyleTools.slice(1, textStyleTools.length))
                    // .concat(separatorTools)
                    // .concat(fontSizeAndFontFamilyTools).concat(separatorTools)
            },
            {
                title: '模型',
                secondKey: 'borderStyle',
                items: strokeStylePickerTools.concat(separatorTools)
                    .concat(backgroundColorPickerTools)
            },
            { title: '新形状默认尺寸', items: [], Com: CanvasSize}
        ]
    }
].concat(commonCanvasSetup);

export const logicAndPhysicalCanvasSetup = {
    firstTitle: '',
    secondTitle: '(对使用默认设置以及后续新建对象有效)',
    firstKey: 'entitySetting',
    children: [
        {title: '标题文本', items: [], Com: CanvasTitle},
        {
            title: '标题样式',
            secondKey: 'titleStyle',
            items: colorPickerTools.concat(backgroundColorPickerTools).concat(separatorTools)
                .concat(textStyleTools.slice(1, textStyleTools.length))
                // .concat(separatorTools)
                // .concat(fontSizeAndFontFamilyTools).concat(separatorTools)

        },
        {
            title: '主键样式',
            secondKey: 'primaryKeyStyle',
            items: colorPickerTools.concat(backgroundColorPickerTools).concat(separatorTools)
                .concat(textStyleTools.slice(1, textStyleTools.length))
                // .concat(separatorTools)
                // .concat(fontSizeAndFontFamilyTools).concat(separatorTools)

        },
        {
            title: '外键样式',
            secondKey: 'foreignKeyStyle',
            items: colorPickerTools.concat(backgroundColorPickerTools).concat(separatorTools)
                .concat(textStyleTools.slice(1, textStyleTools.length))
                // .concat(separatorTools)
                // .concat(fontSizeAndFontFamilyTools).concat(separatorTools)
        },
        {
            title: '属性样式',
            secondKey: 'fieldStyle',
            items: colorPickerTools.concat(backgroundColorPickerTools).concat(separatorTools)
                .concat(textStyleTools.slice(1, textStyleTools.length))
                // .concat(separatorTools)
                // .concat(fontSizeAndFontFamilyTools).concat(separatorTools)
        },
        {
            title: '模型',
            secondKey: 'borderStyle',
            items: strokeStylePickerTools.concat(separatorTools)
                .concat(backgroundColorPickerTools)
        },
        {
            title: '内部分割线',
            secondKey: 'divideLineStyle',
            items: strokeStylePickerTools
        },
        { title: '新形状默认尺寸', items: [], Com: CanvasSize}
    ]
}

const textAnchorMap = {
    start: 'flex-start',
    middle: 'center',
    end: 'flex-end'
}

const textVerticalAnchorMap = {
    top: 'flex-start',
    middle: 'center',
    bottom: 'flex-end'
}
export const dasharrayMap = {
    '0': 'solid',
    '2': 'dotted',
    '5, 2': 'dashed',
}

export const borderStyleMap = {
    'solid': '0',
    'dotted': '2',
    'dashed': '5, 2',
}
const getTitleStyle = (props, key) => {
    return  {
        text: {
            color: props[key]['text']['fill'],
            fontWeight: props[key]['text']['font-weight'] || 'normal',
            fontStyle: props[key]['text']['font-style'] || 'normal',
            textDecoration: props[key]['text']['text-decoration'] || 'none',
            fontFamily: props[key]['text']['fill'],
            fontSize: props[key]['text']['fontSize'],
            justifyContent: textAnchorMap[props[key]['text']['textAnchor']],
            alignItems: textVerticalAnchorMap[props[key]['text']['textVerticalAnchor']],
        },
        body: {
            backgroundColor: opacity(props[key]['body']['fill'], props[key]['body']['fill-opacity']),
        },
    }
}
const getBorderStyle = (props, key) => {
    return {
        body: {
            borderColor: opacity(props[key]['body']['stroke'], props[key]['body']['stroke-opacity']),
            borderStyle: dasharrayMap[props[key]['body']['stroke-dasharray']],
            borderWidth: props[key]['body']['stroke-width'],
        }
    }
}

const getShapeGeneral = (props, key) => {
    return  {
        text: {
            color: props[key]['text']['fill'],
            fontWeight: props[key]['text']['font-weight'] || 'normal',
            fontStyle: props[key]['text']['font-style'] || 'normal',
            textDecoration: props[key]['text']['text-decoration'] || 'none',
            fontFamily: props[key]['text']['fill'],
            fontSize: props[key]['text']['fontSize'],
            justifyContent: textAnchorMap[props[key]['text']['textAnchor']],
            alignItems: textVerticalAnchorMap[props[key]['text']['textVerticalAnchor']],
        },
        body: {
            backgroundColor:  opacity(props[key]['body']['fill'], props[key]['body']['fill-opacity']),
            borderColor: opacity(props[key]['body']['stroke'], props[key]['body']['stroke-opacity']),
            borderStyle: dasharrayMap[props[key]['body']['stroke-dasharray']],
            borderWidth: props[key]['body']['stroke-width'],
        },
    }
}
export const getDiagramsStyle = (props) => {
    const titleStyle = getTitleStyle(props.entitySetting, 'titleStyle')
    const contentStyle = getTitleStyle(props.entitySetting, 'contentStyle')
    const primaryKeyStyle = getTitleStyle(props.entitySetting, 'primaryKeyStyle')
    const foreignKeyStyle = getTitleStyle(props.entitySetting, 'foreignKeyStyle')
    const fieldStyle = getTitleStyle(props.entitySetting, 'fieldStyle')
    return {
        entitySetting: {
            titleText : {
                ...props.entitySetting.titleText
            },
            titleStyle: {
                ...titleStyle,
                text: _.omit(titleStyle.text, ['fontWeight'])
            },
            contentStyle: {
                ...contentStyle,
                text: _.omit(contentStyle.text, ['fontWeight'])
            },
            primaryKeyStyle: {
                ...primaryKeyStyle,
                text: _.omit(primaryKeyStyle.text, ['fontWeight'])
            },
            foreignKeyStyle: {
                ...foreignKeyStyle,
                text: _.omit(foreignKeyStyle.text, ['fontWeight'])
            },
            fieldStyle: {
                ...fieldStyle,
                text: _.omit(fieldStyle.text, ['fontWeight'])
            },
            borderStyle: {
                ...getBorderStyle(props.entitySetting,'borderStyle')
            },
            divideLineStyle: {
                ...getBorderStyle(props.entitySetting,'divideLineStyle')
            },
            defaultSize: {
                optionValue: 'A',
                width: 100,
                height: 100,
                ...(props.entitySetting.defaultSize || {})
            }
        },
        shapeGeneral:{
            ...getShapeGeneral(props,'shapeGeneral')
        },
        textbox:{
            ...getTitleStyle(props,'textbox')
        },
        linkLine: {
            ...getShapeGeneral(props,'linkLine')
        }
    }
}

export const originData = {
    "id":"P0346.B01.3QQASYKAG4AG","type":"P","defKey":"sims_teacher","defName":"教师","intro":"","schemaName":null,"props":null,"mark":null,"attr1":null,"attr2":null,"attr3":null,"attr4":null,"attr5":null,"attr6":null,"attr7":null,"attr8":null,"attr9":null,"attr10":null,"attr11":null,"attr12":null,"attr13":null,"attr14":null,"attr15":null,"attr16":null,"attr17":null,"attr18":null,"attr19":null,"attr20":null,
    "fields":[
        {"id":"P0346.B01.3QQVIUJMG4AA","defKey":"TEACHER_ID","defName":"教师ID","intro":"","orderValue":2,"baseDataType":"int","bizDomainType":"IdOrKey","dbDataType":"INT","dataLen":null,"numScale":null,"primaryKey":0,"notNull":1,"autoIncrement":1,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},
        {"id":"P0346.B01.3QQVIUJMG4AK","defKey":"COLLEGE_ID","defName":"所在学院ID","intro":"","orderValue":1,"baseDataType":"int","bizDomainType":"","dbDataType":"INT","dataLen":null,"numScale":null,"primaryKey":1,"notNull":1,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},
        {"id":"P0346.B01.3QQVIUJMG4AB","defKey":"TEACHER_NAME","defName":"姓名","intro":"","orderValue":3,"baseDataType":"string","bizDomainType":"Name","dbDataType":"VARCHAR","dataLen":90,"numScale":null,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.3QQVIUJMG4AC","defKey":"GENDER","defName":"性别","intro":"","orderValue":4,"baseDataType":"string","bizDomainType":"Dict","dbDataType":"VARCHAR","dataLen":32,"numScale":null,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.3QQVIUJMG4AD","defKey":"BIRTH","defName":"出生日期","intro":"","orderValue":5,"baseDataType":"date","bizDomainType":"DateTime","dbDataType":"DATETIME","dataLen":null,"numScale":null,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.3QQVIUJMG4AE","defKey":"GRADUATE_INSTITUTION","defName":"毕业院校","intro":"","orderValue":6,"baseDataType":"string","bizDomainType":"DefaultString","dbDataType":"VARCHAR","dataLen":255,"numScale":null,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.3QQVIUJMG4AF","defKey":"PRACTICE_YEARS","defName":"从业年限","intro":"","orderValue":7,"baseDataType":"int","bizDomainType":"Int","dbDataType":"INT","dataLen":null,"numScale":null,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.UWT189144H00","defKey":"MONTH_SALARY","defName":"月薪","intro":"","baseDataType":"double","bizDomainType":"Money","dbDataType":"DECIMAL","dataLen":24,"numScale":6,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndFieldId":"","attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.3QQVIUJMG4AG","defKey":"POLITICAL","defName":"政治面貌","intro":"","orderValue":8,"baseDataType":"string","bizDomainType":"Dict","dbDataType":"VARCHAR","dataLen":32,"numScale":null,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.3QQVIUJMG4AH","defKey":"MARITAL","defName":"婚姻状况","intro":"","orderValue":9,"baseDataType":"string","bizDomainType":"Dict","dbDataType":"VARCHAR","dataLen":32,"numScale":null,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.3QQVIUJMG4AI","defKey":"AVATAR","defName":"头像","intro":"","orderValue":10,"baseDataType":"string","bizDomainType":"DescText","dbDataType":"VARCHAR","dataLen":1500,"numScale":"","primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"},{"id":"P0346.B01.3QQVIUJMG4AJ","defKey":"INTRO","defName":"介绍","intro":"","orderValue":11,"baseDataType":"text","bizDomainType":"","dbDataType":"TEXT","dataLen":1500,"numScale":null,"primaryKey":0,"notNull":0,"autoIncrement":0,"defaultValue":"","stndDictId":"","stndDictKey":"","stndFieldId":"","stndFieldKey":"","mark":null,"attr1":"","attr2":"","attr3":"","attr4":"","attr5":"","attr6":"","attr7":"","attr8":"","attr9":"","attr10":"","attr11":"","attr12":"","attr13":"","attr14":"","attr15":"","attr16":"","attr17":"","attr18":"","attr19":"","attr20":"","origin":"UI"}],"correlations":null,"indexes":[{"id":"P0346.B01.3QQVIUJMG4AL","type":"NORMAL","defKey":"idx_teacher_01","defName":"教师号索引","intro":"","orderValue":1,"fields":[{"id":"P0346.B01.3QQVIUJMG4AM","fieldId":"P0346.B01.3QQVIUJMG4AA","fieldDefKey":"TEACHER_ID","sortType":""}]},{"id":"P0346.B01.UQ73S8HR5M00","type":"UNIQUE","defKey":"a","defName":"","intro":"","orderValue":2,"fields":[]}]}
