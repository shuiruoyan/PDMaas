const generateMarkdownTable = (headers, rows) => {
    if((rows || []).length === 0) {
        return ''
    }
    const escape = (str) => String(str).replace(/\|/g, '\\|');

    const headerRow = '| ' + headers.map(escape).join(' | ') + ' |';
    const separatorRow = '| ' + headers.map(() => '---').join(' | ') + ' |';
    const dataRows = rows.map(
        row => '| ' + row.map(escape).join(' | ') + ' |'
    );

    return [headerRow, separatorRow, ...dataRows].join('\n');
}

const generateTableListTable = (category) => {
    const headers = ['数据表', '名称', '备注说明'];
    const row = (category.children || []);
    return generateMarkdownTable(headers, row.map(entity => [entity.defKey, entity.defName || '', entity.intro || '']));
};

const generateTableColumnListTable = (entity, props) => {
    const { freezeEntityHeader, columns, maxWidth, defKeyMapping, booleanColumn } = props;
    const headers = columns.map(column =>defKeyMapping[column])
    const checkFieldValue = (field, n) => {
        if(booleanColumn.includes(n)) {
            if(field[n]) {
                return '√'
            }
            return ''
        } else if(n === 'stndDictId' || n === 'stndFieldId') {
            const tempN = n === 'stndDictId' ? 'stndDictKey' : 'stndFieldKey'
            return  field[tempN] || (field[tempN] === null || field[tempN] === undefined ? '' : field[tempN])
        }else {
            return field[n] || (field[n] === null || field[n] === undefined ? '' : field[n])
        }
    }
    const rows = (entity.fields || []).map((field, i) => {
        return columns.reduce((p, n) => {
            p.push(checkFieldValue(field, n))
            return p;
        }, [])
    })
    return generateMarkdownTable(headers, rows);
};

const generateRelation = (diagram, img) => {
    if (img) {
        return `${img.svg}\n`
    }
    return '';
};

const generateModuleBody = (modelData, images = [], props) => {
    let categoriesString = ``;
    const categories = modelData || [];
    const generateBodyEntityIndex = (id, category, index, subIndex) => {
        categoriesString += `## ${index}.${subIndex} 表清单\n`;
        categoriesString += `${generateTableListTable(category)}\n`
        categoriesString += `## ${index}.${subIndex + 1} 表字段明细\n`;
        (category.children || []).forEach((c, i) => {
            categoriesString += `### ${index}.${subIndex + 1}.${i + 1} ${c.defKey}[${c.defName}] \n`;
            categoriesString += `${generateTableColumnListTable(c, props)} \n`;
        });
    }
    const generateBodyDiagramIndex = (id, category, index, subIndex) => {
        categoriesString += `## ${index}.${subIndex} 关系图 \n`;
        (category.children || []).forEach((c, i) => {
            categoriesString += `### ${index}.${subIndex}.${i + 1} ${c.defKey}[${c.defName}] \n`;
            const img = images.find(i => i.id === c.id);
            categoriesString += generateRelation(c, img)
        });
    }
    const generateCategoryString = (category, index) => {
        categoriesString += `# ${index} ${category.defName || category.defKey}\n`;
        (category.children || []).forEach((child, subIndex) => {
            categoriesString += '\n';
            if(child.value === 'physicEntityNode') {
                generateBodyEntityIndex(category.id, child, index, subIndex + 1)
            } else if(child.value === 'diagramNode') {
                generateBodyDiagramIndex(category.id, child, index, subIndex === 0 ? subIndex + 1 : subIndex + 2)
            } else {
                generateCategoryString(child, `${index}.${subIndex + 2}`)
            }
        })
    }
    categories.forEach((category, index) => {
        generateCategoryString(category, `${index + 1}`)
    });
    return categoriesString;
};

export const markdown = (dataSource, modelData, images, user, props, callBack) => {
    const data = generateModuleBody(modelData, images, props);
    callBack && callBack(`${data}`);
};
