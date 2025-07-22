import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import {Button, IconTitle, Modal, openDrawer} from 'components';
import AddOrEditProgramLangType from './AddOrEditProgramLangType';
import {LOADING, NORMAL} from '../../../../lib/constant';
import {codegenNsKey} from '../../../../lib/permission';
import {
    changeProgramEnable,
    createProgram, deleteProgram, toDragProgramLang,
    updateProgram,
} from '../../../../lib/profile_data_handling';

export const defaultLangSvg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1024" width="30" height="30" style="border-color: rgba(0,0,0,0);" filter="none">
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

export default React.memo(forwardRef(({ baseClass, languageArrayDom, ...restProps }, ref) => {
    const langTypeRef = useRef();
    // eslint-disable-next-line max-len
    const { dataSource, dataTypes, doImmersiveEdit, validateForm, getCurrentUserConfig, updateUser } = restProps;
    const [programDataTypes, setProgramDataType] = useState(dataTypes);
    const programDataTypesRef = useRef(programDataTypes);
    programDataTypesRef.current = programDataTypes;
    const _onItemClick = useCallback((e, btn, programItem) => {
        let drawer = null;
        // eslint-disable-next-line no-shadow
        const confirmAddProgramLang = (ev, bt) => {
            bt.updateStatus(LOADING);
            let result = null;
            const prevObj = langTypeRef.current.getPrevObj();
            const calculatedDataTypes = langTypeRef.current.getCalculatedDataTypes();
            const validateArray = [{key: 'defKey', label: '编程语言'}];
            const programLangObj = langTypeRef.current.getProgramLangObj();
            // eslint-disable-next-line max-len
            validateForm(programLangObj, prevObj, { notNullArr: validateArray, notRepeatArr: validateArray }).then(() => {
                if (programLangObj.id) {
                    result = updateUser(updateProgram(getCurrentUserConfig,
                        { programLang: programLangObj, dataTypes: calculatedDataTypes }));
                } else {
                    !programLangObj.icon && (programLangObj.icon = defaultLangSvg);
                    // eslint-disable-next-line max-len
                    result = updateUser(createProgram(getCurrentUserConfig, { programLang: { ...programLangObj, isEnabled: 1 }, dataTypes: calculatedDataTypes }));
                }
                result.then(() => {
                    bt.updateStatus(NORMAL);
                    drawer.close();
                });
            }).catch((error) => {
                let displayTitle = '';
                validateArray.forEach((it) => {
                    error[it.key]?.forEach((p) => {
                        displayTitle += ` ${p.message}\n`;
                    });
                });
                Modal.error({
                    title: '错误',
                    message: displayTitle,
                });
                bt.updateStatus(NORMAL);
            });
        };
        // eslint-disable-next-line no-shadow
        const delProgramLang = () => {
            Modal.confirm({
                title: '警告',
                message: '删除后不可恢复，是否继续',
                onOk: (ev, bt) => {
                    bt.updateStatus(LOADING);
                    const programLangObj = langTypeRef.current.getProgramLangObj();
                    return updateUser(deleteProgram(getCurrentUserConfig, programLangObj))
                        .then(() => {
                            drawer.close();
                        });
                },
                okText: '确定',
                cancelText: '取消',
            });
        };
        // eslint-disable-next-line max-len
        drawer = openDrawer(<AddOrEditProgramLangType
          ref={langTypeRef}
          nsKey={codegenNsKey.U}
          validateForm={validateForm}
          defaultSvg={defaultLangSvg}
          doImmersiveEdit={doImmersiveEdit}
          readonly={!updateUser}
          dataTypes={programDataTypesRef.current}
          baseClass={`${baseClass}-of-program-drawer`}
          programObj={programItem} />, {
            title: `${programItem ? '编辑' : '新增'}编程语言类型`,
            placement: 'right',
            width: '100%',
            buttons: updateUser ? [
              <React.Fragment>
                {programItem && <Button nsKey={codegenNsKey.U} style={{float: 'left', marginLeft: '1%'}} onClick={delProgramLang}><IconTitle nsKey={codegenNsKey.U} icon="icon-oper-delete" title="删除" /></Button>}
              </React.Fragment>,
              <Button onClick={() => drawer.close()}>取消</Button>,
              <Button type="primary" onClick={(ev, bt) => confirmAddProgramLang(ev, bt)} nsKey={codegenNsKey.U}>确定</Button>,
            ] : [],
        });
    }, [dataTypes]);
    useEffect(() => setProgramDataType(dataTypes), [dataTypes]);
    useImperativeHandle(ref, () => ({
        _onItemClick,
        defaultSvg: defaultLangSvg,
        getLanguageArr: () => (dataSource.profile.global.programLangs || [])
            .sort((x, y) => x.orderValue - y.orderValue),
        statusUpdate: (targetObj) => {
            return updateUser(changeProgramEnable(getCurrentUserConfig,  targetObj));
        },
        locationUpdate: (operateArray, id, step) => {
            return updateUser(toDragProgramLang(getCurrentUserConfig,
                { langArray: operateArray, id, step }));
        },
        getNsKey: () => {
            return codegenNsKey.U;
        },
    }), [dataSource.profile.global.programLangs]);
    return <div className={`${baseClass}-of-program`}>
      {
        updateUser && <div className={`${baseClass}-of-program-header`}>
          <Button type="primary" onClick={_onItemClick} nsKey={codegenNsKey.U}>添加编程语言类型</Button>
          <div />
        </div>
      }
      <div className={`${baseClass}-of-program-body`}>
        {languageArrayDom}
      </div>
    </div>;
}));
