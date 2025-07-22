export const firstUp = (str) => {
  return str.split('').map((s, i) => {
    if (i === 0) {
      return s.toLocaleUpperCase();
    }
    return s;
  }).join('');
}

const isEmptyValue = (value) => {
  return value === '' || value === null || value === undefined || value === 0;
}

// 将''/null/undefined/0 定义为相等
export const valueCompare = (value1, value2) => {
  if(isEmptyValue(value1)) {
    return isEmptyValue(value2);
  } else if(isEmptyValue(value2)) {
    return isEmptyValue(value1);
  }
  return value1 === value2;
}