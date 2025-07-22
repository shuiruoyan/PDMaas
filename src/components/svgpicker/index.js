import React, { useState } from 'react';
import Icon from '../icon';
import Button from '../button';
import { openModal } from '../modal';
import Textarea from '../textarea';
import {classesMerge, getPrefix} from '../../lib/classes';
import './style/index.less';

export default React.memo(({defaultValue,
                               width = 30,
                               height = 30,
                               onChange,
                               readOnly,
                               ...restProps}) => {
    const [svg, setSvg] = useState(defaultValue);
    const getSaveSvg = (svgStr = '') => {
        const safe = svgStr
            .replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, '')
            .replace(/\r|\n|\r\n/g, '');
        if(/^<svg(.*)<\/svg>$/.test(safe)) {
            return safe;
        }
        return safe.split('')[0] || '';
    };
    const finalValue = 'value' in restProps ? restProps.value : svg;
    const currentPrefix = getPrefix('components-svgpicker');
    const onPicker = () => {
      let modal = null;
      let tempValue = finalValue;
      const previewRef = React.createRef();
      const onOk = () => {
          setSvg(tempValue);
          onChange && onChange(tempValue);
          modal.close();
      };
      const svgChange = (e) => {
          tempValue = e.target.value;
          previewRef.current.innerHTML = getSaveSvg(e.target.value);
      };
        modal = openModal(<div className={`${currentPrefix}-svg-edit`}>
          <div className={`${currentPrefix}-svg-edit-preview`}>
            <span>预览</span>
            {/* eslint-disable-next-line react/no-danger */}
            <div ref={previewRef} dangerouslySetInnerHTML={{__html: getSaveSvg(finalValue)}} />
          </div>
          <Textarea onChange={svgChange} defaultValue={finalValue}/>
        </div>, {
          bodyStyle: {
              width: '80%',
          },
          title: '图标SVG代码',
          buttons: [
            <Button onClick={() => modal.close()}>取消</Button>,
            <Button type="primary" onClick={onOk}>确定</Button>,
          ],
      });
    };
    return <div
      className={classesMerge({
        [currentPrefix]: true,
        [`${currentPrefix}-readOnly`]: readOnly,
    })}
      style={{width, height}}>
      {/* eslint-disable-next-line react/no-danger */}
      <div className={`${currentPrefix}-svg`} dangerouslySetInnerHTML={{__html: getSaveSvg(finalValue)}}/>
      {!readOnly && <div className={`${currentPrefix}-opt`}>
        <Icon className={`${currentPrefix}-opt-icon`} onClick={onPicker} type='icon-oper-edit'/>
        </div>}
    </div>;
});
