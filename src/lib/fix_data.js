// 专门修正历史版本遗留问题

const fix = (dataSource) => {
  return [].reduce((pre, next) => {
      return next(pre);
  }, dataSource)
}

export default {
    fix
}
