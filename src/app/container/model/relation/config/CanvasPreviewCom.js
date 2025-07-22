import React, { useImperativeHandle, forwardRef } from 'react';
import './style/index.less'
import {getPrefix} from '../../../../../lib/classes';
import {Icon, Tooltip} from 'components'
import {originData, PREVIEW_TYPE } from './canvasData';
import {calcNodeSize} from '../util/celltools';

const cellStyle = {
    flexGrow: 1,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    display: 'inline-block'
};


const ConceptualPreview  = React.memo(forwardRef(({style}, ref) => {
    const title = style.entitySetting.titleText.customValue
        .replace(/\{defKey\}/g, originData.defKey)
        .replace(/\{defName\}/g, originData.defName);
    const defaultSizeStyle = {...(style.entitySetting.defaultSize || {})}.optionValue === 'A' ? {
        width: 200,
        height: 100
    } : {
        width: {...(style.entitySetting.defaultSize || {})}.width,
        height: {...(style.entitySetting.defaultSize || {})}.height
    };
    const entityStyle = style.entitySetting.titleStyle;
    const contentStyle = style.entitySetting.contentStyle;
    const borderStyle = style.entitySetting.borderStyle;
    const currentPrefix = getPrefix('container-model-relation-canvasconfig-preview')
    return <div
        className={`${currentPrefix}-conceptual`}
        style={{
            ...borderStyle.body,
            ...defaultSizeStyle
        }}
    >
        <Tooltip
            title={title}>
            <span style={{
                ...entityStyle.text,
                ...entityStyle.body,
            }}>
                {title}
            </span>
        </Tooltip>
        <span style={{
            ...contentStyle.body,
            ...contentStyle.text,
        }}>
            教师类对象
        </span>
    </div>;
}));

const LogicPreview  = React.memo(forwardRef(({style,
    fields, relationDisplayName,displayContent}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig-preview')
    const currentDisplayName = typeof relationDisplayName === 'object' ?  relationDisplayName : relationDisplayName.split(',');
    const {nodeSize, maxFieldSize} = calcNodeSize(originData, currentDisplayName);
    const defaultSizeStyle = {...(style.entitySetting.defaultSize || {})}.optionValue === 'A' ? {
        ...nodeSize
    } : {
        width: {...(style.entitySetting.defaultSize || {})}.width,
        height: {...(style.entitySetting.defaultSize || {})}.height
    };
    const primaryKeyStyle = {
        ...style.entitySetting.primaryKeyStyle.text,
        ...style.entitySetting.primaryKeyStyle.body,
        ...cellStyle
    };
    const foreignKeyStyle = {
        ...style.entitySetting.foreignKeyStyle.text,
        ...style.entitySetting.foreignKeyStyle.body,
        ...cellStyle
    }
    const fieldStyle = {
        ...style.entitySetting.fieldStyle.text,
        ...style.entitySetting.fieldStyle.body,
        // ...cellStyle
    };
    const titleStyle = style.entitySetting.titleStyle;
    const borderStyle = style.entitySetting.borderStyle;
    const divideLineStyle = style.entitySetting.divideLineStyle;
    const title = style.entitySetting.titleText.customValue
        .replace(/\{defKey\}/g, originData.defKey)
        .replace(/\{defName\}/g, originData.defName);
    return <div className={`${currentPrefix}-logic`}
        style={{
            ...borderStyle.body,
            ...defaultSizeStyle
        }}>
        <Tooltip
            title={title}>
            <span style={{
                ...titleStyle.text,
                ...titleStyle.body,
            }}>
                {title}
            </span>
        </Tooltip>
        <span>
            <span
                style={{
                    backgroundColor: primaryKeyStyle.backgroundColor,
                    borderBottomStyle: divideLineStyle.body.borderStyle,
                    borderBottomWidth: divideLineStyle.body.borderWidth,
                    borderBottomColor: divideLineStyle.body.borderColor,
                }}
            >
                <span
                    style={{
                        ...primaryKeyStyle,
                        width: maxFieldSize.primaryKey,
                    }}
                ><Icon type='icon-db-primary-key'/></span>
                    {
                        currentDisplayName.map((p) => {
                            return <Tooltip
                                title={fields[0][p]}
                                key={p}
                            >
                                <span
                                    style={{
                                        ...primaryKeyStyle,
                                        paddingLeft: 5,
                                        width: maxFieldSize[p],
                                    }}>
                                    {fields[0][p]}
                                </span>
                            </Tooltip>;
                        })
                    }
            </span>
            <span style={{backgroundColor: foreignKeyStyle.backgroundColor}}>
                <span
                    style={{
                        ...foreignKeyStyle,
                        width: maxFieldSize.primaryKey,
                    }}> <Icon type='icon-db-foreign-key'/></span>
                {
                    currentDisplayName.map((p) => {
                        return <Tooltip
                            title={fields[1][p]}
                            key={p}
                        >
                                <span
                                    style={{
                                        ...foreignKeyStyle,
                                        paddingLeft: 5,
                                        width: maxFieldSize[p],
                                    }}>
                                    {fields[1][p]}
                                </span>
                        </Tooltip>;
                    })
                }
            </span>
        </span>
        <Tooltip
            title={displayContent}>
            <span style={{
                ...fieldStyle,
                WebkitLineClamp: Math.floor((defaultSizeStyle.height - 97) / 26) || 1
            }}>
                {displayContent}
            </span>
        </Tooltip>
    </div>
}));

const PhysicalPreview  = React.memo(forwardRef(({style,
                                                 fields, relationDisplayName,displayContent}, ref) => {
    const title = style.entitySetting.titleText.customValue
        .replace(/\{defKey\}/g, originData.defKey)
        .replace(/\{defName\}/g, originData.defName);
    const currentPrefix = getPrefix('container-model-relation-canvasconfig-preview')
    const currentDisplayName = typeof relationDisplayName === 'object' ?  relationDisplayName : relationDisplayName.split(',');
    const {nodeSize, maxFieldSize} = calcNodeSize(originData, currentDisplayName);
    const defaultSizeStyle = {...(style.entitySetting.defaultSize || {})}.optionValue === 'A' ? {
        ...nodeSize
    } : {
        width: {...(style.entitySetting.defaultSize || {})}.width || 0,
        height: {...(style.entitySetting.defaultSize || {})}.height || 0
    };
    const primaryKeyStyle = {
        ...style.entitySetting.primaryKeyStyle.text,
        ...style.entitySetting.primaryKeyStyle.body,
        ...cellStyle
    };
    const foreignKeyStyle = {
        ...style.entitySetting.foreignKeyStyle.text,
        ...style.entitySetting.foreignKeyStyle.body,
        ...cellStyle
    }
    const fieldStyle = {
        ...style.entitySetting.fieldStyle.text,
        ...style.entitySetting.fieldStyle.body,
        ...cellStyle
    };
    const titleStyle = style.entitySetting.titleStyle;
    const borderStyle = style.entitySetting.borderStyle;
    const divideLineStyle = style.entitySetting.divideLineStyle;


    return <div className={`${currentPrefix}-physical`}
        style={{
            ...borderStyle.body,
            ...defaultSizeStyle
        }}>
        <Tooltip
            title={title}>
            <span style={{
                ...titleStyle.text,
                ...titleStyle.body,
            }}>
                {title}
            </span>
        </Tooltip>
        <span>
            <span
                style={{
                    backgroundColor: foreignKeyStyle.backgroundColor,
                    borderBottomStyle: divideLineStyle.body.borderStyle,
                    borderBottomWidth: divideLineStyle.body.borderWidth,
                    borderBottomColor: divideLineStyle.body.borderColor,
                }}
            >
                <span
                style={{
                    ...primaryKeyStyle,
                    width: maxFieldSize.primaryKey,
                }}><Icon type='icon-db-primary-key'/></span>
                {
                    currentDisplayName.map((p) => {
                        return <Tooltip
                            title={fields[0][p]}
                            key={p}
                        >
                            <span
                                style={{
                                    ...primaryKeyStyle,
                                    paddingLeft: 5,
                                    width: maxFieldSize[p],
                                }}>
                                {fields[0][p]}
                            </span>
                        </Tooltip>;
                    })
                }
            </span>
            {
                fields.slice(1, 2).map(f => {
                    return <span key={f.id} style={{backgroundColor: foreignKeyStyle.backgroundColor}}>
                    <span
                        style={{
                            ...foreignKeyStyle,
                            width: maxFieldSize.primaryKey,
                        }}><Icon type='icon-db-foreign-key'/></span>
                    {
                        currentDisplayName.map((p) => {
                            return <Tooltip
                                title={f[p]}
                                key={p}
                            >
                                <span
                                    style={{
                                        ...foreignKeyStyle,
                                        paddingLeft: 5,
                                        width: maxFieldSize[p],
                                    }}>
                                    {f[p]}
                                </span>
                            </Tooltip>;
                        })
                    }
                    </span>;
                })
            }
        </span>
        <span>
            {
                fields.slice(2, fields.length)
                    .map(f => {
                        return <span key={f.id} style={{backgroundColor: fieldStyle.backgroundColor}}>
                        <span style={{
                            ...fieldStyle,
                            width: maxFieldSize.primaryKey,
                        }}></span>
                            {
                                currentDisplayName.map((p) => {
                                    return <Tooltip
                                        key={p}
                                        title={f[p]}>
                                    <span
                                        style={{
                                            ...fieldStyle,
                                            paddingLeft: 5,
                                            width: maxFieldSize[p],
                                        }}>
                                        {f[p]}
                                    </span>
                                </Tooltip>;
                            })
                        }
                    </span>;
                })
            }
        </span>
    </div>
}));

const BasicShapePreview = React.memo(forwardRef(({style}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig-preview');
    return <div className={`${currentPrefix}-basicshape`}>
        <span style={{
            ...style.shapeGeneral.text,
            ...style.shapeGeneral.body
        }}>
            基本形状-默认设置
        </span>

    </div>;
}));

const LinkLinePreview = React.memo(forwardRef(({style}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig-preview');
    const linkLineStyle = style.linkLine;
    return <div className={`${currentPrefix}-linkline`}>
        <span style={{
            borderBottomStyle: linkLineStyle.body.borderStyle,
            borderBottomWidth: linkLineStyle.body.borderWidth,
            borderBottomColor: linkLineStyle.body.borderColor,
        }}></span>
    </div>;
}));

const TextBoxPreview = React.memo(forwardRef(({style}, ref) => {
    const currentPrefix = getPrefix('container-model-relation-canvasconfig-preview')
    return <div className={`${currentPrefix}-textbox`}>
        <span style={{
            ...style.textbox.text,
            ...style.textbox.body
        }}>文本框样例</span>
    </div>;
}));


const CanvasPreviewCom = React.memo(forwardRef(({
                                                    previewType,
                                                    fields,
                                                    relationDisplayName,
                                                    displayContent,
                                                    previewStyle
                                                }, ref) => {
    useImperativeHandle(ref, () => {
        return {}
    }, []);
    let Com;
    switch (previewType) {
        case PREVIEW_TYPE.CONCEPTUAL:
            Com = ConceptualPreview;
            break;
        case PREVIEW_TYPE.BASIC_SHAPE:
            Com = BasicShapePreview;
            break;
        case PREVIEW_TYPE.LINK_LINE:
            Com = LinkLinePreview;
            break;
        case PREVIEW_TYPE.TEXT_BOX:
            Com = TextBoxPreview;
            break;
        case PREVIEW_TYPE.LOGIC:
            Com = LogicPreview;
            break;
        case PREVIEW_TYPE.PHYSICAL:
            Com = PhysicalPreview;
            break;
        default:
            Com = React.Fragment;
    }
    return <Com
        style={previewStyle}
        fields={fields}
        relationDisplayName={relationDisplayName}
        displayContent={displayContent}
    />;
}));
export default CanvasPreviewCom;
