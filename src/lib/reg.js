export const getSafeReg = (search) => {
    return new RegExp((search || '').replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'ig')
}
