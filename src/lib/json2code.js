import doT from 'dot';

const getUser = (userInfo) => {
    let user = {}
    try {
        user = typeof userInfo === 'object' ? userInfo : JSON.parse(userInfo || '{}');
    } catch (e) {
        console.error("无效的用户信息", userInfo);
    }
    return user;
}

export const getTemplate2String = (template = '', templateData = '', userInfo = '') => {
    if(!template || !templateData) return '';
    const underline = (str, upper) => {
        const ret = str?.replace(/([A-Z])/g,"_$1") || '';
        if(upper){
            return ret.toUpperCase();
        }else{
            return ret.toLowerCase();
        }
    };
    const upperCase = (str) => {
        return str?.toLocaleUpperCase() || '';
    };
    const lowerCase = (str) => {
        return str?.toLocaleLowerCase() || '';
    };
    const join = (...args) => {
        return args.reduce((pre, next) => {
            return pre.concat(next);
        }, []).filter(d => !!d).join(',');
    };
    const strJoin = (...args) => {
        if(args.length > 2) {
            const isFilter = args[args.length - 1]
            const split = args[args.length - 2];
            const str = args.slice(0, -2).reduce((pre, next) => {
                return pre.concat(next);
            }, []).filter(d => {
                if(isFilter) {
                    if(d) {
                        return !!d.replace(/\r?\n|\r/g, '');
                    }
                    return false;
                }
                return true;
            }).map(d => `${d}`).join(split);
            if(isFilter) {
                return str.replace(/\r?\n|\r/g, '')
            }
            return str
        }
        return '';
    }
    const objectkit = {
        isJSON: function(obj) {
            var isjson = typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
            return isjson;
        },
        deepClone: function(obj) {
            return JSON.parse(JSON.stringify(obj));
        },
        equals: function(v1, v2) {
            if (typeof(v1) === "object" && objectkit.isJSON(v1) && typeof(v2) === "object" && objectkit.isJSON(v2)) {
                return JSON.stringify(v1) == JSON.stringify(v2);
            } else {
                return v1 == v2;
            }

        }
    };
    const getIndex = (array, arg, n) => {
        var i = isNaN(n) || n < 0 ? 0 : n;
        for (; i < array.length; i++) {
            if (array[i] == arg) {
                return i;
            } else if (typeof(array[i]) === "object" && objectkit.equals(array[i], arg)) {
                return i;
            }
        }
        return -1;
    };
    const contains = (array, obj) => {
        return getIndex(array, obj) >= 0;
    };
    const uniquelize = (array) => {
        var copy = clone(array);
        const temp = [];
        for (var i = 0; i < copy.length; i++) {
            if (!contains(temp, copy[i])) {
                temp.push(copy[i]);
            }
        }
        return temp;
    };
    const clone = (array) => {
        var cloneList = Array();
        for (var i = 0, a = 0; i < array.length; i++) {
            cloneList.push(array[i]);
        }
        return cloneList;
    };
    const each = (array, fn) => {
        fn = fn || Function.K;
        var a = [];
        var args = Array.prototype.slice.call(arguments, 1);
        for (var i = 0; i < array.length; i++) {
            var res = fn.apply(array, [array[i], i].concat(args));
            if (res != null) a.push(res);
        }
        return a;
    };
    const intersect = (array1, array2) => {
        // 交集
        const copy = clone(array1);
        const r = each(uniquelize(copy), function(o) { return contains(array2, o) ? o : null });
        return [].concat(r);
    };
    const union = (array1, array2) => {
        var copy = clone(array1);
        var r = uniquelize(copy.concat(array2));
        return [].concat(r);
    };
    const minus = (array1, array2) => {
        var copy = clone(array1);
        var r = each(uniquelize(copy), function(o) { return contains(array2, o) ? null : o });
        return [].concat(r);
    };
    const camel = (str, firstUpper) => {
        let ret = str.toLowerCase();
        ret = ret.replace( /_([\w+])/g, function( all, letter ) {
            return letter.toUpperCase();
        });
        if(firstUpper){
            ret = ret.replace(/\b(\w)(\w*)/g, function($0, $1, $2) {
                return $1.toUpperCase() + $2;
            });
        }
        return ret;
    };
    const tplText = template.replace(/(^\s*)|(\s*$)/g, "");
    const conf = {
        evaluate:    /\{\{([\s\S]+?)\}\}/g,
        interpolate: /\{\{=([\s\S]+?)\}\}/g,
        encode:      /\{\{!([\s\S]+?)\}\}/g,
        use:         /\{\{#([\s\S]+?)\}\}/g,
        define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
        conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
        iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
        varname: 'it',
        strip: false,
        append: true,
        doNotSkipEncoded:false,
        selfcontained: false
    };
    let resultText = '';
    const user = getUser(userInfo)
    try {
        resultText = doT.template(tplText, conf)({
            user,
            ...templateData,
            func: {
                camel: camel,
                underline: underline,
                upperCase: upperCase,
                lowerCase: lowerCase,
                join: join,
                intersect: intersect,
                union: union,
                minus: minus,
                strJoin: strJoin,
            }
        });
    } catch (e) {
        resultText = JSON.stringify(e);
    }
    resultText = resultText.replace(/\n(\n)*( )*(\n)*\n/g,"\n");  //删除空行
    resultText = resultText.replace(/\r\n(\r\n)*( )*(\r\n)*\r\n/g,"\r\n"); //(不同操作系统换行符有区别)删除空行
    resultText = resultText.replace(/\$blankline/g,'');              //单独处理需要空行的情况
    return resultText;
};


const demoGroup = [{defKey: 'DEFAULT_GROUP', defName: '默认分组'}];

const fullTable = {
    "id": "P0346.B01.3QQASYKAG4AG",
    "type": "P",
    "defKey": "sims_teacher",
    "defName": "教师",
    "intro": "",
    "schemaName": null,
    "props": null,
    "mark": null,
    "attr1": null,
    "attr2": null,
    "attr3": null,
    "attr4": null,
    "attr5": null,
    "attr6": null,
    "attr7": null,
    "attr8": null,
    "attr9": null,
    "attr10": null,
    "attr11": null,
    "attr12": null,
    "attr13": null,
    "attr14": null,
    "attr15": null,
    "attr16": null,
    "attr17": null,
    "attr18": null,
    "attr19": null,
    "attr20": null,
    "fields": [
        {
            "id": "P0346.B01.3QQVIUJMG4AK",
            "defKey": "COLLEGE_ID",
            "defName": "所在学院ID",
            "intro": "",
            "orderValue": 1,
            "baseDataType": "int",
            "bizDomainType": "",
            "dbDataType": "INT",
            "langDataType": "String",
            "dataLen": null,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 1,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AA",
            "defKey": "TEACHER_ID",
            "defName": "教师ID",
            "intro": "",
            "orderValue": 2,
            "baseDataType": "int",
            "bizDomainType": "IdOrKey",
            "dbDataType": "INT",
            "langDataType": "String",
            "dataLen": null,
            "numScale": null,
            "primaryKey": 1,
            "notNull": 1,
            "autoIncrement": 1,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AB",
            "defKey": "TEACHER_NAME",
            "defName": "姓名",
            "intro": "",
            "orderValue": 3,
            "baseDataType": "string",
            "bizDomainType": "Name",
            "dbDataType": "VARCHAR",
            "langDataType": "String",
            "dataLen": 90,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AC",
            "defKey": "GENDER",
            "defName": "性别",
            "intro": "",
            "orderValue": 4,
            "baseDataType": "string",
            "bizDomainType": "Dict",
            "dbDataType": "VARCHAR",
            "langDataType": "String",
            "dataLen": 32,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AD",
            "defKey": "BIRTH",
            "defName": "出生日期",
            "intro": "",
            "orderValue": 5,
            "baseDataType": "date",
            "bizDomainType": "DateTime",
            "dbDataType": "DATETIME",
            "langDataType": "Date",
            "dataLen": null,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AE",
            "defKey": "GRADUATE_INSTITUTION",
            "defName": "毕业院校",
            "intro": "",
            "orderValue": 6,
            "baseDataType": "string",
            "bizDomainType": "DefaultString",
            "dbDataType": "VARCHAR",
            "langDataType": "String",
            "dataLen": 255,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AF",
            "defKey": "PRACTICE_YEARS",
            "defName": "从业年限",
            "intro": "",
            "orderValue": 7,
            "baseDataType": "int",
            "bizDomainType": "Int",
            "dbDataType": "INT",
            "langDataType": "Integer",
            "dataLen": null,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.UWT189144H00",
            "defKey": "MONTH_SALARY",
            "defName": "月薪",
            "intro": "",
            "baseDataType": "double",
            "bizDomainType": "Money",
            "dbDataType": "DECIMAL",
            "langDataType": "Double",
            "dataLen": 24,
            "numScale": 6,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndFieldId": "",
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AG",
            "defKey": "POLITICAL",
            "defName": "政治面貌",
            "intro": "",
            "orderValue": 8,
            "baseDataType": "string",
            "bizDomainType": "Dict",
            "dbDataType": "VARCHAR",
            "langDataType": "String",
            "dataLen": 32,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AH",
            "defKey": "MARITAL",
            "defName": "婚姻状况",
            "intro": "",
            "orderValue": 9,
            "baseDataType": "string",
            "bizDomainType": "Dict",
            "dbDataType": "VARCHAR",
            "langDataType": "String",
            "dataLen": 32,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AI",
            "defKey": "AVATAR",
            "defName": "头像",
            "intro": "",
            "orderValue": 10,
            "baseDataType": "string",
            "bizDomainType": "DescText",
            "dbDataType": "VARCHAR",
            "langDataType": "String",
            "dataLen": 1500,
            "numScale": "",
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        },
        {
            "id": "P0346.B01.3QQVIUJMG4AJ",
            "defKey": "INTRO",
            "defName": "介绍",
            "intro": "",
            "orderValue": 11,
            "baseDataType": "text",
            "bizDomainType": "",
            "dbDataType": "TEXT",
            "langDataType": "String",
            "dataLen": 1500,
            "numScale": null,
            "primaryKey": 0,
            "notNull": 0,
            "autoIncrement": 0,
            "defaultValue": "",
            "stndDictId": "",
            "stndDictKey": "",
            "stndFieldId": "",
            "stndFieldKey": "",
            "mark": null,
            "attr1": "",
            "attr2": "",
            "attr3": "",
            "attr4": "",
            "attr5": "",
            "attr6": "",
            "attr7": "",
            "attr8": "",
            "attr9": "",
            "attr10": "",
            "attr11": "",
            "attr12": "",
            "attr13": "",
            "attr14": "",
            "attr15": "",
            "attr16": "",
            "attr17": "",
            "attr18": "",
            "attr19": "",
            "attr20": "",
            "origin": "UI"
        }
    ],
    "correlations": null,
    "indexes": [
        {
            "id": "P0346.B01.3QQVIUJMG4AL",
            "type": "NORMAL",
            "defKey": "idx_teacher_01",
            "defName": "教师号索引",
            "intro": "",
            "orderValue": 1,
            "fields": [
                {
                    "id": "P0346.B01.3QQVIUJMG4AM",
                    "fieldId": "P0346.B01.3QQVIUJMG4AA",
                    "fieldDefKey": "TEACHER_ID",
                    "sortType": ""
                }
            ]
        },
        {
            "id": "P0346.B01.UQ73S8HR5M00",
            "type": "UNIQUE",
            "defKey": "a",
            "defName": "",
            "intro": "",
            "orderValue": 2,
            "fields": []
        }
    ]
}

export const demoTable = JSON.stringify(fullTable);

const demoField =  {
    "id": "P0346.B01.3QQVIUJMG4AK",
        "defKey": "COLLEGE_ID",
        "defName": "所在学院ID1",
        "intro": "",
        "orderValue": 1,
        "baseDataType": "int",
        "bizDomainType": "",
        "dbDataType": "INT",
        "langDataType": "String",
        "dataLen": null,
        "numScale": null,
        "primaryKey": 0,
        "notNull": 1,
        "autoIncrement": 0,
        "defaultValue": "",
        "stndDictId": "",
        "stndDictKey": "",
        "stndFieldId": "",
        "stndFieldKey": "",
        "mark": null,
        "attr1": "",
        "attr2": "",
        "attr3": "",
        "attr4": "",
        "attr5": "",
        "attr6": "",
        "attr7": "",
        "attr8": "",
        "attr9": "",
        "attr10": "",
        "attr11": "",
        "attr12": "",
        "attr13": "",
        "attr14": "",
        "attr15": "",
        "attr16": "",
        "attr17": "",
        "attr18": "",
        "attr19": "",
        "attr20": "",
        "origin": "UI"
};

const demoIndex = {
        "id": "P0346.B01.3QQVIUJMG4AL",
        "type": "NORMAL",
        "defKey": "idx_teacher_01",
        "defName": "教师号索引1",
        "intro": "",
        "orderValue": 1,
        "fields": [
            {
                "id": "P0346.B01.3QQVIUJMG4AM",
                "fieldId": "P0346.B01.3QQVIUJMG4AA",
                "fieldDefKey": "TEACHER_ID1",
                "sortType": ""
            }
        ]
    };

const demoIndexField = {
    "id": "P0346.B01.3QQVIUJMG4AM",
    "fieldId": "P0346.B01.3QQVIUJMG4AA",
    "fieldDefKey": "TEACHER_ID",
    "sortType": ""
};

const fullTableUpdate = {
    baseUpdate: {
        pre: {
            defName: '教师'
        },
        next: {
            defName: '教师1'
        },
        updateKeys: 'defName'
    },
    fieldsUpdate: [
        { opt: 'add', data: demoField},
        {opt: 'delete', data: demoField},
        {
            opt: 'update',
            data: demoField,
            baseUpdate: {
                pre: {
                    defName: '所在学院ID'
                },
                next: {
                    defName: '所在学院ID1'
                },
                updateKeys: 'defName'
            }
        }
    ],
    indexesUpdate: [
        {opt: 'add', data: demoIndex},
        {opt: 'delete', data: demoIndex},
        {
            opt: 'update',
            data: demoIndex,
            baseUpdate: {
                pre: {
                    defName: '教师号索引'
                },
                next: {
                    defName: '教师号索引1'
                },
                updateKeys: 'defName'
            },
            fieldsUpdate: [
                { opt: 'add', data: demoIndexField},
                {opt: 'delete', data: demoIndexField},
                {
                    opt: 'update',
                    data: demoIndexField,
                    baseUpdate: {
                        pre: {
                            defName: 'TEACHER_ID'
                        },
                        next: {
                            defName: 'TEACHER_ID1'
                        },
                        updateKeys: 'fieldDefKey'
                    }
                }
            ]
        }
    ]
}

// {label: '表-新建', value: 'tableCreate'},
// {label: '表-修改', value: 'tableUpdate'},
// {label: '表-删除', value: 'tableDelete'},
// {label: '字段-添加', value: 'columnCreate'},
// {label: '字段-修改', value: 'columnUpdate'},
// {label: '字段-删除', value: 'columnDelete'},
// {label: '索引-添加', value: 'indexCreate'},
// {label: '索引-修改', value: 'indexUpdate'},
// {label: '索引-删除', value: 'indexDelete'},

export const getFullStandTable = () => {
    return {
        ...fullTable,
        fields: fullTable.fields.map(((f, i) => {
            if(i === 0) {
                return {
                    ...f,
                    "stndDictData": {
                        "defKey": "Political",
                        "defName": "政治面貌",
                        "scopeLevel": null,
                        "scopeTargetId": null,
                        "stndDictId": "SD00001964",
                        "subjectId": "1MJ73FVLP9D01",
                        "effectVersion": null,
                        "trivialName": null,
                        "intro": "",
                        "policyDocId": null,
                        "policyDocName": null,
                        "publishDateTime": null,
                        "publishStatus": "N",
                        "latestVersion": null,
                        "latestPublishStatus": null,
                        "updatedTime": "2025-02-21 18:43:51",
                        "dictItems": [
                            {
                                "itemKey": "10",
                                "itemName": "共青团员",
                                "dictItemId": "1MJ73K5LK9D02",
                                "stndDictId": "SD00001964",
                                "parentKey": "",
                                "sort": "0",
                                "intro": "",
                                "attr1": "",
                                "attr2": "",
                                "attr3": "",
                                "attr4": null,
                                "attr5": null
                            },
                            {
                                "itemKey": "20",
                                "itemName": "中共党员",
                                "dictItemId": "1MJ73K5LK9D03",
                                "stndDictId": "SD00001964",
                                "parentKey": "",
                                "sort": "0",
                                "intro": "",
                                "attr1": "",
                                "attr2": "",
                                "attr3": "",
                                "attr4": null,
                                "attr5": null
                            },
                            {
                                "itemKey": "30",
                                "itemName": "民主党派",
                                "dictItemId": "1MJ73K5NK9D02",
                                "stndDictId": "SD00001964",
                                "parentKey": "",
                                "sort": "0",
                                "intro": "",
                                "attr1": "",
                                "attr2": "",
                                "attr3": "",
                                "attr4": null,
                                "attr5": null
                            },
                            {
                                "itemKey": "40",
                                "itemName": "群众",
                                "dictItemId": "1MJ73K5NK9D03",
                                "stndDictId": "SD00001964",
                                "parentKey": "",
                                "sort": "0",
                                "intro": "",
                                "attr1": "",
                                "attr2": "",
                                "attr3": "",
                                "attr4": null,
                                "attr5": null
                            },
                            {
                                "itemKey": "90",
                                "itemName": "未知",
                                "dictItemId": "1MJ73K5NT9D01",
                                "stndDictId": "SD00001964",
                                "parentKey": "",
                                "sort": "0",
                                "intro": "",
                                "attr1": "",
                                "attr2": "",
                                "attr3": "",
                                "attr4": null,
                                "attr5": null
                            }
                        ]
                    },
                }
            }
            return f;
        }))
    }
}

export const getDemoUpdate = (value, data, userInfo = '') => {
    const currentTable = {
        ...(data || fullTable),
        user: getUser(userInfo)
    };
    const currentTableUpdate = data || fullTableUpdate;
    const getDemoData = (key, fuc) => {
        const c = fuc(currentTableUpdate[key]);
        if(c.length === 0) {
            return fuc(fullTableUpdate[key]);
        }
        return c;
    }
    switch (value) {
        case 'tableCreate': return currentTable;
        case 'tableUpdate': return {
            ...currentTable,
            ...currentTableUpdate,
            baseUpdate: currentTableUpdate?.baseUpdate?.updateKeys ? currentTableUpdate.baseUpdate : fullTableUpdate.baseUpdate,
        };
        case 'tableDelete': return currentTable;
        case 'columnCreate': return {
            ...currentTable,
            fieldsUpdate: getDemoData('fieldsUpdate', (execData) => {
                return execData.filter(u => u.opt === 'add').map(u => u.data)
            })
        };
        case 'columnUpdate': return {
            ...currentTable,
            fieldsUpdate: getDemoData('fieldsUpdate', (execData) => {
                return execData.filter(u => u.opt === 'update').map(u => {
                    return {
                        ...u.data,
                        baseUpdate: u.baseUpdate,
                    }
                })
            })
        };
        case 'columnDelete': return {
            ...currentTable,
            fieldsUpdate: getDemoData('fieldsUpdate', (execData) => {
                return execData.filter(u => u.opt === 'delete').map(u => u.data)
            })
        };
        case 'indexCreate': return {
            ...currentTable,
            indexes: getDemoData('indexesUpdate', (execData) => {
                return execData.filter(u => u.opt === 'add').map(u => u.data)
            })
        };
        case 'indexUpdate': return {
            ...currentTable,
            indexesUpdate: getDemoData('indexesUpdate', (execData) => {
                return execData.filter(u => u.opt === 'update').map(u => {
                    return {
                        ...u.data,
                        baseUpdate: u.baseUpdate,
                    }
                })
            })
        };
        case 'indexDelete': return {
            ...currentTable,
            indexesUpdate: getDemoData('indexesUpdate', (execData) => {
                return execData.filter(u => u.opt === 'delete').map(u => u.data)
            })
        };
    }
};