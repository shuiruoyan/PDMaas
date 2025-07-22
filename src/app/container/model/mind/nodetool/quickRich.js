import React, {useState} from 'react';
import ReactDom from 'react-dom';

import { Icon, Tooltip } from 'components';
import Color from '../mindconfig/Color';
import {classesMerge, getPrefix} from '../../../../../lib/classes';


const QuickIcon = React.memo(({formatInfo, mind}) => {
    // bold
    // :
    // true
    // color
    // :
    // "#ffffff"
    // font
    // :
    // "微软雅黑, Microsoft YaHei"
    // size
    // :
    // "16px"
    const [format, setFormat] = useState({...formatInfo});
    const updateFontStyle = (name, value) => {
        mind.richText.formatText({
            [name]: value,
        });
        setFormat((p) => {
            return {
                ...p,
                [name]: value,
            };
        });
    };
    const onRemove = () => {
        mind.richText.removeFormat();
    };
    const currentPrefix = getPrefix('container-model-mind-nodetool-rich-list');
    return <div className={currentPrefix}>
      <span
        //ref={boldRef}
        onClick={() => updateFontStyle('bold', !format.bold)}
        className={classesMerge({
          [`${currentPrefix}-active`]: format.bold,
      })}
        style={{fontWeight: 'bold'}}
      >
          B
      </span>
      <span
        //ref={italicRef}
        onClick={() => updateFontStyle('italic', !format.italic)}
        className={classesMerge({
              [`${currentPrefix}-active`]: format.italic,
          })}
        style={{fontStyle: 'italic'}}
      >I</span>
      <span
        //ref={underlineRef}
        onClick={() => updateFontStyle('underline', !format.underline)}
        className={classesMerge({
              [`${currentPrefix}-active`]: format.underline,
          })}
        style={{textDecoration: 'underline'}}
      >U</span>
      <span
        //ref={strikeRef}
        onClick={() => updateFontStyle('strike', !format.strike)}
        className={classesMerge({
              [`${currentPrefix}-active`]: format.strike,
          })}
        style={{textDecoration: 'line-through'}}
      >S</span>
      <span>{format.size.replace(/[^\d.]/g, '')}</span>
      <Tooltip
        force
        title={<Color
          onChange={color => updateFontStyle('background', color)}
          defaultValue={format.background}
            />}
        >
        <span style={{color: format.background}}>
          <Icon type='icon-style-fill'/>
        </span>
      </Tooltip>
      <Tooltip
        force
        title={<Color
          onChange={color => updateFontStyle('color', color)}
          defaultValue={format.color}
        />}
      >
        <span style={{borderBottom: `3px solid ${format.color}`}}>A</span>
      </Tooltip>
      <span onClick={onRemove}><Icon type='icon-oper-delete'/></span>
    </div>;
});

export const hidden = (nodeToolId, mind) => {
    mind.event.bind();
    let richToolDom = document.getElementById(`${nodeToolId}-rich`);
    if(richToolDom) {
        ReactDom.unmountComponentAtNode(richToolDom);
        document.body.removeChild(richToolDom);
    }
};

export const show = (nodeToolId, rect, formatInfo, mind) => {
    const currentPrefix = getPrefix('container-model-mind-nodetool-rich');
    hidden(nodeToolId, mind);
    mind.event.unbind();
    const richToolDom = document.createElement('div');
    richToolDom.setAttribute('id', `${nodeToolId}-rich`);
    richToolDom.setAttribute('class', currentPrefix);
    document.body.append(richToolDom);
    const left = `${rect.left + rect.width / 2  }px`;
    const top = `${rect.top - 60  }px`;
    richToolDom.style.left = left;
    richToolDom.style.top = top;
    ReactDom.render(<QuickIcon
      formatInfo={formatInfo}
      mind={mind}
    />, richToolDom);
};

