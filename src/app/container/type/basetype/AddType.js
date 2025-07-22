import {Checkbox, Form, Input, NumberInput, Select, SVGPicker} from 'components';
import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import _ from 'lodash';
import {getPrefix} from '../../../../lib/classes';
import './style/index.less';
import {baseDataTypeNsKey} from '../../../../lib/permission';

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

export default React.memo(forwardRef(({ baseDataType,
  dbDialects,programLangs, nsKey, sysDataTypeOften, isReadonly},ref) => {
  const currentPrefix = getPrefix('type-add');
  const FormItem = Form.FormItem;
  const [isShow, setIsShow] = useState(baseDataType ? baseDataType.requireLen : false);
  const SelectOption = Select.Option;
  const preDbDataType = baseDataType && {...(baseDataType.dbDataType || {})};
  const formData = useRef(baseDataType || {
    defKey: '',
    icon: '',
    defName: '',
    requireLen: 0,
    requireScale: 0,
    often: sysDataTypeOften[0].value || 1,
    lenMax: 0,
    dbDataType: {

    },
    langDataType: {

    },
  });
  const checkBoxValueFormat = {
    checked: 1,
    unchecked: 0,
  };
  const [svgValue, setSvgValue] = useState(formData.current.icon || formData.current.defKey);
  const isSetSVGRef = useRef(!!formData.current.icon);
  const svgSet = (value) => {
    setSvgValue(value);
    formData.current.icon = value;
    if(value === '') {
      setSvgValue(formData.defKey);
      formData.current.icon = formData.current.defKey;
      isSetSVGRef.current = false;
      return;
    }
    isSetSVGRef.current = true;
  };
  const inputBlur = (e, key) => {
    const value =  e.target.value;
    formData.current[key] = value;
    console.log(formData.current[key]);
    if(key === 'defKey' &&  !isSetSVGRef.current) {
      setSvgValue(value);
      formData.current.icon = value;
    }
  };
  useImperativeHandle(ref, () => {
    return {
      formData: formData.current,
      updateDbDialectKeys: () => {
        let updateDbDialectKeys = [];
        if(preDbDataType) {
          const currentDbDataType = formData.current.dbDataType;
          updateDbDialectKeys = _.filter(_.keys(currentDbDataType),
              key => !_.isEqual(currentDbDataType[key], preDbDataType[key]));
        }
        return updateDbDialectKeys;
      },
    };
  },[]);
  const checkboxChange = (e, key) => {
    const checkedValue = e.target.checked;
    formData.current[key] = checkedValue;
    if(key === 'requireLen') {
      setIsShow(checkedValue);
    }
  };
  const onSelectChange = (e, key) => {
    formData.current[key] = e.target.value;
  };
  return <div className={`${currentPrefix}`}>
    <div className={`${currentPrefix}-head`}>
      <div >
        <SVGPicker
          nsKey={baseDataTypeNsKey.U}
          width={60}
          height={60}
          value={svgValue}
          onChange={svgSet}
        />
      </div>
      <div>
        <Form
          nsKey={nsKey}
          labelWidth={150}
          readonly={isReadonly}
        >
          <div className={`${currentPrefix}-head-line`}>
            <FormItem label='基本数据类型代码' require >
              <Input
                disable={baseDataType?.id?.startsWith?.('S_')}
                maxLength={20}
                defaultValue={formData.current.defKey}
                onBlur={(e) => { inputBlur(e, 'defKey'); }} />
            </FormItem>
            <FormItem label='基本数据类型名称' require>
              <Input
                maxLength={20}
                defaultValue={formData.current.defName}
                onBlur={(e) => { inputBlur(e, 'defName'); }}/>
            </FormItem>
          </div>
          <FormItem label='长度及精度'>
            <div className={`${currentPrefix}-len`}>
              <Checkbox
                valueFormat={checkBoxValueFormat}
                defaultChecked={formData.current.requireLen}
                onChange={(e) => { checkboxChange(e, 'requireLen'); }}>
                有长度
              </Checkbox>
              {
                  isShow === 1 && <>
                    <Checkbox
                      valueFormat={checkBoxValueFormat}
                      defaultChecked={formData.current.requireScale}
                      onChange={(e) => { checkboxChange(e, 'requireScale'); }}>
                      有小数位
                    </Checkbox>
                    <span>
                      <span>长度最大值</span>
                      <NumberInput
                        defaultValue={formData.current.lenMax}
                        onBlur={(e) => { inputBlur(e, 'lenMax'); }}/>
                    </span>
                  </>
              }
            </div>
          </FormItem>
          <FormItem label='使用频率'>
            <Select
              notAllowEmpty
              defaultValue={formData.current.often}
              allowClear={false}
              onChange={(e) => { onSelectChange(e, 'often'); }}
              valueRender={itemProps => (itemProps?.children ? itemProps.children?.split('-')[1] : '')}
            >
              {
                sysDataTypeOften.map((it) => {
                  return <SelectOption value={it.value}>
                    {`${it.value}-${it.label}`}
                  </SelectOption>;
                })
              }
            </Select>
          </FormItem>
        </Form>
      </div>
    </div>
    <div className={`${currentPrefix}-body`}>
      <div className={`${currentPrefix}-body-left`}>
        <span >
          数据库数据类型映射
        </span>
        <div>
          <Form
            nsKey={nsKey}
            labelWidth={165}
            readonly={isReadonly}
          >
            {
              dbDialects.map((dbData) => {
                return <FormItem label={<>
                  <div className={`${currentPrefix}-body-svg`}>
                    <SVGPicker
                      width={25}
                      height={25}
                      readOnly
                      value={dbData.icon || defaultDBSvg}
                    />
                    <span>{dbData.defKey}</span>
                  </div>
                </>} >
                  <Input
                    maxLength={90}
                    defaultValue={formData.current.dbDataType[dbData.defKey]}
                    onBlur={(e) => {
                        formData.current.dbDataType[dbData.defKey] = e.target.value;
                      }}/>
                </FormItem>;
              })
            }
          </Form>
        </div>
      </div>
      <div className={`${currentPrefix}-body-right`}>
        <span>
          编程语言数据类型映射
        </span>
        <div>
          <Form
            nsKey={nsKey}
            readonly={isReadonly}
            labelWidth={100}>
            {
              programLangs.map((programLang) => {
                return <FormItem label={<>
                  <div className={`${currentPrefix}-body-svg`}>
                    <SVGPicker
                      width={25}
                      height={25}
                      readOnly
                      value={programLang.icon || defaultDBSvg}
                    />
                    <span>{programLang.defKey}</span>
                  </div>
                </>}>
                  <Input
                    maxLength={90}
                    defaultValue={formData.current.langDataType[programLang.defKey]}
                    onBlur={(e) => {
                      formData.current.langDataType[programLang.defKey] = e.target.value;
                      }}/>
                </FormItem>;
              })
            }
          </Form>
        </div>
      </div>
    </div>
  </div>;
}));
