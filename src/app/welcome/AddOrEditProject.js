import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
} from 'react';
import {Form, Input} from 'components';
import {getPrefix} from '../../lib/classes';
import {openFileOrDirPath} from '../../lib/file';

export default React.memo(forwardRef(({open}, ref) => {
    const currentPrefix = getPrefix('welcome-addOrEditProject');
    const FormItem = Form.FormItem;

    const projectObjRef = useRef({});

    const [projectObj, setProjectObj] = useState({
        describe: '',
        name: '',
        avatar: '',
        path: '',
    });

    projectObjRef.current = {...(projectObj || {})};

    const selectFile = () => {
        openFileOrDirPath([], ['openDirectory']).then((res) => {
            setProjectObj(pre => ({
                ...pre,
                path: res,
            }));
        });
    };

    const _onInputChange = (e, key) => {
        const { value } = e.target;
        setProjectObj(pre => ({
            ...pre,
            [key]: value,
        }));
    };

    useImperativeHandle(ref, () => {
        return {
            getProjectObj: () => {
                return projectObjRef.current;
            },
        };
    }, []);

    return <div className={`${currentPrefix}`}>
      <Form>
        <FormItem label="项目名" require>
          <Input
            value={projectObj.name}
            onChange={e => _onInputChange(e, 'name')}
          />
        </FormItem>
        <FormItem label="保存位置" require>
          <div className={`${currentPrefix}-line`}>
            <Input
              value={projectObj.path}
              onChange={e => _onInputChange(e, 'path')}
            />
            <span onClick={selectFile}>...</span>
          </div>
        </FormItem>
        <FormItem label="描述">
          <Input
            value={projectObj.describe}
            onChange={e => _onInputChange(e, 'name')}
          />
        </FormItem>
        <FormItem label="图标">
          <Input
            value={projectObj.avatar}
            onChange={e => _onInputChange(e, 'avatar')}
          />
        </FormItem>
      </Form>
    </div>;
}));
