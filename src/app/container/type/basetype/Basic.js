import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import _ from 'lodash';
import { Button, openDrawer, Modal, Tooltip, IconTitle, SVGPicker, openLoading, closeLoading } from 'components';
import {classesMerge, getPrefix} from '../../../../lib/classes';
import AddType from './AddType';
import {LOADING, NORMAL, WS} from '../../../../lib/constant';
import {
    baseDataTypeNsKey,
    checkPermission,
    codegenNsKey,
    dbTypeNsKey,
} from '../../../../lib/permission';
import {
    deleteBaseDataType,
    dragBaseDataType,
    updateBaseDataType,
} from '../../../../lib/profile_data_handling';
import {sendData} from '../../../../lib/utils';

const defaultDBSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" width="30" height="30"
            style="border-color: rgba(0,0,0,0);" filter="none">
          <g>
            <path d="M870.4 57.6C780.8 19.2 652.8 0 512 0 371.2 0 243.2 19.2 153.6 57.6 51.2 102.4 0 153.6 0 211.2l0 595.2c0 57.6 51.2 115.2 153.6 153.6C243.2 
            1004.8 371.2 1024 512 1024c140.8 0 268.8-19.2 358.4-57.6 
            96-38.4 153.6-96 153.6-153.6L1024 211.2C1024 153.6 972.8 102.4 870.4 57.6L870.4 57.6zM812.8 320C729.6 352 614.4 364.8 512 364.8 403.2 364.8 294.4 352 
            211.2 320 115.2 294.4 70.4 256 70.4 211.2c0-38.4 51.2-76.8 140.8-108.8C294.4 76.8 403.2 64 512 64c102.4 0 217.6 19.2 300.8 44.8 89.6 32 140.8 70.4 140.8 108.8C953.6 
            256 908.8 294.4 812.8 320L812.8 320zM819.2 505.6C736 531.2 620.8 550.4 512 550.4c-108.8 0-217.6-19.2-307.2-44.8C115.2 473.6 64 435.2 
            64 396.8L64 326.4C128 352 172.8 384 243.2 396.8 326.4 416 416 428.8 512 428.8c96 0 185.6-12.8 268.8-32C851.2 384 
            896 352 960 326.4l0 76.8C960 435.2 908.8 473.6 819.2 505.6L819.2 505.6zM819.2 710.4c-83.2 25.6-198.4 44.8-307.2 
            44.8-108.8 0-217.6-19.2-307.2-44.8C115.2 684.8 64 646.4 64 601.6L64 505.6c64 32 108.8 57.6 179.2 76.8C326.4 601.6 
            416 614.4 512 614.4c96 0 185.6-12.8 268.8-32C851.2 563.2 896 537.6 960 505.6l0 96C960 646.4 908.8 684.8 819.2 710.4L819.2 
            710.4zM512 960c-108.8 0-217.6-19.2-307.2-44.8C115.2 889.6 64 851.2 64 812.8l0-96c64 32 108.8 57.6 179.2 76.8 76.8 19.2 172.8 
            32 262.4 32 96 0 185.6-12.8 268.8-32 76.8-19.2 121.6-44.8 185.6-76.8l0 96c0 38.4-51.2 76.8-140.8 108.8C736 947.2 614.4 960 512 
            960L512 960zM512 960" fill="rgba(69.105,123.92999999999999,239.95499999999998,1)" p-id="24071" stroke="none"></path>
          </g>
         </svg>`;
const defaultLangSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" width="30" height="30" style="border-color: rgba(0,0,0,0);" filter="none">
    <g>
    <path d="M377.597072 791.989575s-39.199979 22.799988 27.799985 
    30.399983c81.197956 9.198995 122.597934 7.998996 211.996886-8.999995
     0 0 23.599987 14.798992 56.39897 27.598985-200.396892 85.798954-453.593756-4.999997-296.195841-48.999973m-24.399987-112.19794s-43.799976 
     32.399983 23.199988 39.399979c86.598953 8.999995 155.197917 9.599995 273.595853-13.199993 0 0 16.399991 16.599991 42.199977 25.599986-242.59687 
     70.997962-512.593725 5.799997-338.995818-51.799972m206.396889-190.196898c49.399973 56.798969-12.999993 107.997942-12.999993 
     107.997942s125.398933-64.798965 67.799964-145.797922c-53.799971-75.598959-94.999949-113.197939 128.197931-242.596869 0.2 0-350.394812 
     87.599953-182.997902 280.396849m265.196858 385.193793s28.999984 23.799987-31.799983 42.399977c-115.797938 34.999981-481.592741 
     45.599976-583.191687 1.4-36.59998-15.799992 31.999983-37.99998 53.599972-42.599978 22.398988-4.799997 35.398981-3.999998
      35.398981-3.999997-40.599978-28.599985-262.596859 56.19997-112.79894 80.399956 408.394781 66.398964 744.7896-29.799984 
      638.791657-77.599958M396.397062 563.592697s-186.1979 44.198976-65.999964 60.198968c50.799973 6.799996 151.997918 5.199997 
      246.196867-2.599999 76.999959-6.399997 154.397917-20.399989 154.397917-20.399989s-27.199985 11.599994-46.799974 
      24.999987c-188.996898 49.799973-553.991702 26.599986-448.992759-24.199987 88.997952-42.799977 161.197913-37.99998 161.197913-37.99998M730.391883 
      750.189597c192.197897-99.798946 103.198945-195.796895 41.199978-182.797902-15.199992 3.199998-21.999988 5.999997-21.999989 5.999997s5.599997-8.799995
       16.399992-12.599993c122.597934-43.198977 216.996883 127.198932-39.599979 194.597895 0-0.2 2.999998-2.799998 3.999998-5.199997M614.393945 0s106.397943 
       106.398943-100.998946 269.995855c-166.197911 131.19893-37.99998 206.197889 0 291.596843-96.998948-87.599953-168.19791-164.597912-120.397935-236.396873C463.196026 
       220.196882 657.392922 168.997909 614.393945 0M415.396052 1020.786452c184.397901 11.799994 467.593749-6.599996 474.193745-93.79995 0 0-12.799993 32.999982-152.397918 59.399968-157.397915 
       29.599984-351.594811 26.199986-466.593749 7.199996 0-0.2 23.599987 19.39999 144.797922 27.199986" p-id="36790" fill="rgba(69.105,123.92999999999999,239.95499999999998,1)" stroke="none"></path>
    </g>
  </svg>`;

export default React.memo(forwardRef(({dataSource, dbDialects,
                programLangs, baseDataTypes, setActive,updateUser,
                getCurrentUserConfig, sysDataTypeOften}, ref) => {

    const currentPrefix = getPrefix('type-basic');
    const sysDataTypeOftenMap = sysDataTypeOften?.reduce((pre, cur) => {
        // eslint-disable-next-line no-param-reassign
        pre[cur.value] = cur.label;
        return pre;
    }, {});
    const addTypeRef = useRef(null);
    useImperativeHandle(ref, () => {
        return {
        };
    }, []);
    const onUpdateClick = (baseDataType) => {
        let drawer;
        const onOk = (e, btn) => {
            btn.updateStatus(LOADING);
            const updateDbDialectKeys = (addTypeRef.current.updateDbDialectKeys() || []);
            updateUser(updateBaseDataType(getCurrentUserConfig, {
                dataType: addTypeRef.current.formData,
                updateDbDialectKeys: (addTypeRef.current.updateDbDialectKeys() || []).join(','),
            })).then(() => {
                btn.updateStatus(NORMAL);
                drawer.close();
                const cur =  dataSource?.profile?.project?.dbDialect;
                if(updateDbDialectKeys.length > 0 && cur) {
                    openLoading('正在更新数据类型');
                    sendData({
                        event: WS.USER.SWITCH_DBDIALECT,
                        ctId: Math.uuid(),
                        payload: {
                            dbDialect:  cur,
                        },
                    }, null, () => {
                        closeLoading();
                    }, true);
                    // Modal.confirm({
                    //     title: '警告',
                    //     message: '是否立即刷新页面？(数据类型修改会影响全局，请提醒项目成员刷新项目，以避免数据混乱)',
                    //     onOk: () => {
                    //         window.location.reload();
                    //     },
                    //     okText: '确定',
                    //     cancelText: '取消',
                    // });
                }
            }).catch((err) => {
                Modal.error({
                    title: '错误',
                    message: JSON.stringify(err?.message || err),
                });
            });
        };
        const oncancel = () => {
            drawer.close();
        };

        const buttons = updateUser ? [
          <Button
            key='onOK'
            onClick={oncancel}>
                取消
          </Button>,
          <Button
            nsKey={baseDataTypeNsKey.U}
            key='onCancel'
            type='primary'
            onClick={(e,btn) => onOk(e,btn)}
            >
                确认
          </Button>,
        ] : [];

        drawer = openDrawer(<AddType
          nsKey={baseDataTypeNsKey.U}
          baseDataType={_.cloneDeep(baseDataType)}
          sysDataTypeOften={sysDataTypeOften}
          dataSource={dataSource}
          dbDialects={dbDialects}
          programLangs={programLangs}
          isReadonly={!updateUser}
          ref={addTypeRef} />, {
            title: '编辑基本数据库类型',
            placement: 'right',
            width: 900,
            buttons: buttons,
        });
    };
    const delBaseDataType = (baseDataType) => {
        Modal.confirm({
            title: '删除',
            okText: '确认',
            cancelText: '取消',
            message: `是否要删除${baseDataType.defKey}?`,
            onOk: (e, btn) => {
                btn.updateStatus(LOADING);
                return updateUser(deleteBaseDataType(getCurrentUserConfig, baseDataType))
                    .catch((err) => {
                        Modal.error({
                            title: '错误',
                            message: JSON.stringify(err?.message || err),
                        });
                    });
            },
        });
    };

    // useEffect(() => {
    //     setBaseDataTypes(dataSource.profile.global.dataTypes || []);
    // }, [dataSource.profile.global.dataTypes]);
    const changeLocation = (rowIndex, baseDataType, direction) => {
        openLoading('移动中...');
        const newBaseDataTypes = [...baseDataTypes];
        if (direction === 'up') {
            const temp = newBaseDataTypes[rowIndex - 1];
            newBaseDataTypes[rowIndex - 1] = newBaseDataTypes[rowIndex];
            newBaseDataTypes[rowIndex] = temp;

            const tempOrderValue = newBaseDataTypes[rowIndex - 1].orderValue;
            newBaseDataTypes[rowIndex - 1].orderValue = newBaseDataTypes[rowIndex].orderValue;
            newBaseDataTypes[rowIndex].orderValue = tempOrderValue;
        } else {
            const temp = newBaseDataTypes[rowIndex + 1];
            newBaseDataTypes[rowIndex + 1] = newBaseDataTypes[rowIndex];
            newBaseDataTypes[rowIndex] = temp;

            const tempOrderValue = newBaseDataTypes[rowIndex + 1].orderValue;
            newBaseDataTypes[rowIndex + 1].orderValue = newBaseDataTypes[rowIndex].orderValue;
            newBaseDataTypes[rowIndex].orderValue = tempOrderValue;
        }
        updateUser(dragBaseDataType(getCurrentUserConfig, {
            dataTypes: newBaseDataTypes,
            dateTypeId: baseDataType.id,
            step: direction === 'up' ? 1 : -1,
        })).then(() => {
            closeLoading();
        });
    };
    const changeTag = (tag, disable) => {
        if(disable) {
            setActive(tag);
        }
    };
    return <div className={`${currentPrefix}`}>
      <table cellPadding="5px">
        <tbody>
          <tr>
            <td />
            <td colSpan={3}>基本数据类型</td>
            {
                dbDialects.length <= 0 || <td
                  colSpan={dbDialects?.length}
                  className={`${currentPrefix}-database`}
                  width={dbDialects?.length * 100}
                  >数据库<a
                    href="#"
                    onClick={() => changeTag('database', checkPermission(dbTypeNsKey.V))}
                    className={classesMerge({
                        [`${currentPrefix}-disable`]: !checkPermission(dbTypeNsKey.V),
                    })}
                >[管理]</a></td>
              }
            {
                programLangs.length <= 0 || <td
                  colSpan={programLangs?.length}
                  className={`${currentPrefix}-code`}
                  width={programLangs?.length * 100}
              >程序代码<a
                href="#"
                onClick={() => changeTag('program', checkPermission(codegenNsKey.V))}
                className={classesMerge({
                  [`${currentPrefix}-disable`]: !checkPermission(codegenNsKey.V),
                })}
                >[管理]</a></td>
          }
            {updateUser && <td className={`${currentPrefix}-operation-title`} rowSpan={2}>操作</td>}
          </tr>
          <tr>
            <td>#</td>
            <td>类型代码</td>
            <td>类型名称</td>
            <td>使用频率</td>
            {
                dbDialects?.map((database, index) => {
                      return <td
                        key={`database${  index}`}
                        className={`${currentPrefix}-database`}>
                        <SVGPicker
                          width={25}
                          height={25}
                          readOnly
                          value={database.icon || defaultDBSvg}
                        />
                        <Tooltip
                          force
                          title={database.defKey}>
                          <span>{database.defKey}</span>
                        </Tooltip>
                      </td>;
                })
          }
            {
                programLangs?.map((programDataType,index) => {
                    return <td key={`programDataType${  index}`} className={`${currentPrefix}-code`}>
                      <SVGPicker
                        width={25}
                        height={25}
                        readOnly
                        value={programDataType.icon || defaultLangSvg}
                      />
                      <Tooltip
                        force
                        title={programDataType.defKey}
                        >
                        <span>{programDataType.defKey}</span>
                      </Tooltip>
                    </td>;
                })
            }

          </tr>
          {
              baseDataTypes?.map((baseDataType,index) => {
                  return <tr key={index}>
                    <td>{index + 1}</td>
                    <td onClick={() => {
                        onUpdateClick(baseDataType);
                    }}>
                      <div>
                        <SVGPicker
                          width={25}
                          height={25}
                          readOnly
                          value={baseDataType.icon || baseDataType.defKey}
                          />
                        <span>{baseDataType.defKey}</span>
                      </div>
                    </td>
                    <td>{baseDataType.defName}</td>
                    <td className={classesMerge({
                        [`${currentPrefix}-common`] : baseDataType.often === '9',
                        [`${currentPrefix}-general`] : baseDataType.often === '5',
                        [`${currentPrefix}-low`] : !baseDataType.often || baseDataType.often === '1',
                    })}><span>{sysDataTypeOftenMap[baseDataType.often] || '低频'}</span></td>
                    {
                        dbDialects.map((database, i) => {
                            return <td
                              key={i}
                            >
                              <Tooltip
                                force
                                title={baseDataType.dbDataType[database.defKey]}
                                >
                                <span>{baseDataType.dbDataType[database.defKey]}</span>
                              </Tooltip>
                            </td>;
                        })
                    }
                    {
                        programLangs.map((programLang, i) => {
                            return <td key={i}>
                              <Tooltip
                                force
                                title={baseDataType.langDataType[programLang.defKey]}
                                >
                                <span>{baseDataType.langDataType[programLang.defKey]}</span>
                              </Tooltip>
                            </td>;
                        })
                      }
                    {
                      updateUser && <td className={`${currentPrefix}-operation-opr`}>
                        {/* eslint-disable-next-line no-use-before-define */}
                        <IconTitle icon="icon-arrow-up" onClick={() => changeLocation(index, baseDataType, 'up')} disable={index === 0} nsKey={baseDataTypeNsKey.U}/>
                        {/* eslint-disable-next-line no-use-before-define */}
                        <IconTitle icon="icon-arrow-down" onClick={() => changeLocation(index, baseDataType, 'down')} disable={index === baseDataTypes.length - 1} nsKey={baseDataTypeNsKey.U} />
                        {/* eslint-disable-next-line no-use-before-define */}
                        <IconTitle disable={baseDataType.id.startsWith('S_')} onClick={() => delBaseDataType(baseDataType)} icon="icon-oper-delete" nsKey={baseDataTypeNsKey.D} />
                      </td>
                      }
                  </tr>;
              })
          }
        </tbody>
      </table>
    </div>;
}));
