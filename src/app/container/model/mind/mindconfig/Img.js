import React, {useRef, useState} from 'react';

import {Icon, Select} from 'components';

import { upload } from '../../../../../lib/rest';
import {getPrefix} from '../../../../../lib/classes';

export default React.memo(({onChange, defaultData = {}, showImgConfig = true}) => {
    const Option = Select.Option;
    const imgRef = useRef(null);
    const currentPrefix = getPrefix('container-model-mind-config-img');
    const [imgData, setImgData] = useState(() => {
        return {
            backgroundImage: 'none',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '0% 0%',
            backgroundSize: 'auto',
            ...defaultData,
        };
    });
    const onClick = () => {
        upload('image/*', (file) => {
            let fr = new FileReader();
            fr.readAsDataURL(file);
            fr.onload = (e) => {
                const result = e.target.result;
                setImgData((p) => {
                    return {
                        ...p,
                        backgroundImage: result,
                    };
                });
            };
        }, () => true, false);
    };
    const onClear = (e) => {
        e.stopPropagation();
        setImgData((p) => {
            const temp = {
                ...p,
                backgroundImage: 'none',
            };
            onChange && onChange(temp, { w: 0, h: 0});
            return temp;
        });
    };
    const _setImgPosition = (e, name) => {
        setImgData((p) => {
            const temp = {
                ...p,
                [name]: e.target.value,
            };
            onChange && onChange(temp);
            return temp;
        });
    };
    const onLoad = () => {
        onChange && onChange(imgData, { w: imgRef.current.width, h: imgRef.current.height});
    };
    return <div className={currentPrefix} onClick={onClick}>
      {imgData.backgroundImage !== 'none' && <img ref={imgRef} onLoad={onLoad} alt='' src={imgData.backgroundImage}/>}
      <div className={`${currentPrefix}-picker`}>点击选择图片</div>
      {imgData.backgroundImage !== 'none' && <span className={`${currentPrefix}-close`}><Icon onClick={onClear} type='icon-close'/></span>}
      {showImgConfig && <div className={`${currentPrefix}-position`} onClick={e => e.stopPropagation()}>
        <div>
          <span>图片重复</span>
          <span>
            <Select
              defaultValue={imgData.backgroundRepeat}
              onChange={e => _setImgPosition(e, 'backgroundRepeat')}>
              <Option value='no-repeat'>不重复</Option>
              <Option value='repeat'>重复</Option>
              <Option value='repeat-x'>水平方向重复</Option>
              <Option value='repeat-y'>垂直方向重复</Option>
            </Select>
          </span>
        </div>
        <div>
          <span>图片位置</span>
          <span>
            <Select
              defaultValue={imgData.backgroundPosition}
              onChange={e => _setImgPosition(e, 'backgroundPosition')}>
              <Option value='0% 0%'>默认</Option>
              <Option value='left top'>左上</Option>
              <Option value='left center'>左中</Option>
              <Option value='left bottom'>左下</Option>
              <Option value='right top'>右上</Option>
              <Option value='right bottom'>右下</Option>
              <Option value='center top'>中上</Option>
              <Option value='center center'>居中</Option>
              <Option value='center bottom'>中下</Option>
            </Select>
          </span>
        </div>
        <div>
          <span>图片大小</span>
          <Select
            defaultValue={imgData.backgroundSize}
            onChange={e => _setImgPosition(e, 'backgroundSize')}>
            <Option value='auto'>自动</Option>
            <Option value='cover'>覆盖</Option>
            <Option value='contain'>保持</Option>
          </Select>
        </div>
        </div>}
    </div>;
});
