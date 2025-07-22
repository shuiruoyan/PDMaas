import variables from '../style/variables.module.less';

export const getPrefix = (classes) => {
  if(classes) {
    return `${variables.prefix}-${classes}`
  }
  return variables.prefix;
}

export const classesMerge = (classes) => {
  return Object.keys(classes).reduce((p, n) => {
    const nextClass = `${classes[n] ? n : ''}`;
    if(nextClass) {
      return `${p} ${nextClass}`;
    }
    return p;
  }, '')
}
