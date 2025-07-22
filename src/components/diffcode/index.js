import React, {useEffect, useRef} from 'react';
import Diff from 'diff';
import { Diff2HtmlUI } from 'diff2html/lib/ui/js/diff2html-ui-slim';
import {getPrefix} from '../../lib/classes';

import './style/index.less';

export default React.memo(({value, language = 'json'}) => {
    const currentPrefix = getPrefix('components-diff');
    const domRef = useRef(null);
    useEffect(() => {
        const stringifyValue = (index) => {
          return typeof value[index].value === 'string' ? value.value : JSON.stringify(value[index].value, null, 2);
        };
        const diff = Diff.createPatch(`.${language}`, stringifyValue(0), stringifyValue(1));
        const configuration = {
            fileContentToggle: false,
            drawFileList: false,
            matching: 'lines',
            outputFormat: 'side-by-side',
            rawTemplates: {
                'tag-file-changed': '<span class="d2h-tag d2h-changed d2h-changed-tag">内容修改</span>',
            },
        };
        const diff2htmlUi = new Diff2HtmlUI(domRef.current, diff, configuration);
        diff2htmlUi.draw();
    }, []);
    return <div className={currentPrefix}>
      <div className={`${currentPrefix}-title`}>
        <span>{value[0].name}</span>
        <span>{value[1].name}</span>
      </div>
      <div className={`${currentPrefix}-content`} ref={domRef} />
    </div>;
});
