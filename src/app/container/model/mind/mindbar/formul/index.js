import React, {useMemo, useState} from 'react';
import { Textarea } from 'components';
import {getPrefix} from '../../../../../../lib/classes';

import './style/index.less';

export default React.memo(({katexConfig, onChange, close}) => {
    const [value, setValue] = useState('');
    const currentPrefix = getPrefix('container-model-mind-formul');
    const formulaList = useMemo(() => [
        'a^2',
        'a_2',
        'a^{2+2}',
        'a_{i,j}',
        'x_2^3',
        '\\overbrace{1+2+\\cdots+100}',
        '\\sum_{k=1}^N k^2',
        '\\lim_{n \\to \\infty}x_n',
        '\\int_{-N}^{N} e^x\\, dx',
        '\\sqrt{3}',
        '\\sqrt[n]{3}',
        '\\sin\\theta',
        '\\log X',
        '\\log_{10}',
        '\\log_\\alpha X',
        '\\lim_{t\\to n}T',
        '\\frac{1}{2}=0.5',
        '\\binom{n}{k}',
        '\\begin{matrix}x & y \\\\z & v\\end{matrix}',
        '\\begin{cases}3x + 5y +  z \\\\7x - 2y + 4z \\\\-6x + 3y + 2z\\end{cases}',
    ].map((item) => {
        return {
            overview: window.katex.renderToString(
                item,
                katexConfig,
            ),
            text: item,
        };
    }), []);
    const _onChange = () => {
        onChange && onChange(value.trim());
        close();
    };

    const onMouseLeave = (e) => {
      e.stopPropagation();
    };

    return <div className={currentPrefix}>
      <div>
        <Textarea onChange={e => setValue(e.target.value)} onMouseLeave={onMouseLeave} value={value} placeholder='请输入 LaTeX 语法'/>
      </div>
      <div>
        <div onClick={_onChange}>完成</div>
      </div>
      <div>
        <div>常用公式</div>
        <div>
          {
                formulaList.map((l) => {
                    return <div>
                      {/* eslint-disable-next-line react/no-danger */}
                      <span dangerouslySetInnerHTML={{__html: l.overview}}/>
                      <span onClick={() => setValue(l.text)}>{l.text}</span>
                    </div>;
                })
          }
        </div>
      </div>
    </div>;
});
