import React, {useState, forwardRef, useImperativeHandle, useRef} from 'react';
import { Input, Checkbox, NumberInput } from 'components';
import {classesMerge, getPrefix} from '../../../../../../lib/classes';

export default React.memo(forwardRef((props, ref) => {
    const downTypeList = [
        {
            name: '专有文件',
            type: 'smm',
            desc: '可用于导入',
        },
        {
            name: 'JSON',
            type: 'json',
            desc: '流行的数据交换格式，可用于导入',
        },
        {
            name: '图片',
            type: 'png',
            desc: '适合查看分享',
        },
        {
            name: 'SVG',
            type: 'svg',
            desc: '可缩放矢量图形',
        },
        {
            name: 'PDF',
            type: 'pdf',
            desc: '适合打印',
        },
        {
            name: 'Markdown',
            type: 'md',
            desc: '便于其他软件打开',
        },
        {
            name: 'XMind',
            type: 'xmind',
            desc: 'XMind格式',
        },
        {
            name: 'Txt',
            type: 'txt',
            desc: '纯文本文件',
        },
    ];
    const [downType, setDownType] = useState(downTypeList[0].type);
    const downTypeRef = useRef(downType);
    downTypeRef.current = downType;
    const currentPrefix = getPrefix('container-model-mind-export-config');
    const configList = ['png', 'svg', 'pdf'];
    const configRef = useRef({
        fileName: '思维导图',
    });
    const onChange = (name, value) => {
        configRef.current[name] = value;
    };
    useImperativeHandle(ref, () => {
        return {
            getDownloadData: () => {
                return {
                    downType: downTypeRef.current,
                    ...configRef.current,
                };
            },
        };
    }, []);
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-filename`}>
        <span>
          <span>导出文件名</span>
          <Input defaultValue='思维导图' onChange={e => onChange('fileName', e.target.value)}/>
        </span>
      </div>
      {configList.includes(downType)
          && <div className={`${currentPrefix}-fileconfig`}>
            <span>
              <span>水平内边距</span>
              <NumberInput onChange={e => onChange('paddingX', e.target.value)}/>
            </span>
            <span>
              <span>垂直内边距</span>
              <NumberInput onChange={e => onChange('paddingY', e.target.value)}/>
            </span>
            <span>
              <span>底部添加文字</span>
              <Input onChange={e => onChange('extraText', e.target.value)}/>
            </span>
            <span>
              <span>背景是否透明</span>
              <Checkbox onChange={e => onChange('isTransparent', e.target.checked)}/>
            </span>
          </div>}
      <div className={`${currentPrefix}-filelist`}>
        {downTypeList.map((l) => {
            return <div
              onClick={() => setDownType(l.type)}
              key={l.type}
              className={classesMerge({
                  [`${currentPrefix}-filelist-item`]: true,
                  [`${currentPrefix}-filelist-active`]: l.type === downType,
              })}
            >
              <span>{l.name}</span>
              <span>{l.desc}</span>
            </div>;
        })}
      </div>
    </div>;
}));
