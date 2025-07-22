import * as memory from "./memory";

const cache = localStorage || {};

export const getMemoryCache = (key) => {
  return memory.getMemoryCache(key);
};

export const setMemoryCache = (key, value) => {
  memory.setMemoryCache(key, value);
};

export const clearMemoryCache = () => {
  memory.clearMemoryCache();
};

export const getCache = (key, needParse) => {
  const item = cache.getItem(key);
  return needParse ? JSON.parse(item) : item;
};

export const setCache = (key, value) => {
  cache.setItem(key, typeof value !== 'string' ? JSON.stringify(value) : value);
};

export const clearCache = (item) => {
  if (item) {
    cache.removeItem(item);
  } else {
    cache.clear();
  }
};

export const setSimpleUserCache = (user) => {
  setMemoryCache('user', user);
}

export const getSimpleUserCache = () => {
  return getMemoryCache('user');
}

export const setRecommend = (projectId, recommend) => {
// 获取推荐开关
  const user = getCache('user', true);
  if(user) {
    const tempRecommend = getCache('recommend', true) || {};
    setCache('recommend', {
      ...tempRecommend,
      [projectId]: recommend
    })
  }
}

export const getRecommend = (projectId) => {
  // 获取推荐开关
  const user = getCache('user', true);
  if(user) {
    const recommend = getCache('recommend', true);
    if(recommend) {
      return recommend[projectId] || {};
    }
    return {}
  }
  return {}
}