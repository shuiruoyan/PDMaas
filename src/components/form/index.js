import React, {useMemo} from 'react';
import FormItem from './FormItem';
import {getPrefix} from '../../lib/classes';
import './style/index.less';
import { FormContext, PermissionContext, ViewContent } from '../../lib/context';

const Form = React.memo(({readonly, children, nsKey, cols = 4, labelWidth = 100}) => {
    const currentPrefix = getPrefix('components-form');
    const formContextData = useMemo(() => {
        return {
            labelWidth,
            formCols: cols,
            nsKey,
        };
    }, [labelWidth]);
    return <FormContext.Provider value={formContextData}>
      <PermissionContext.Provider value={nsKey}>
        <ViewContent.Provider value={readonly}>
          <div className={currentPrefix}>
            {children}
          </div>
        </ViewContent.Provider>
      </PermissionContext.Provider>
    </FormContext.Provider>;
});

Form.FormItem = FormItem;

export default Form;
