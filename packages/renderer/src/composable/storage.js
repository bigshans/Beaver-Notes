import { ref, watch } from 'vue';

function invokeEvent(name, param) {
  const { ipcRenderer } = window.electron;

  if (param.value) param.value = JSON.parse(JSON.stringify(param.value));

  return ipcRenderer.callMain(`storage:${name}`, param);
}

export function useStorage(name = 'data') {
  return {
    get: (key, def, storeName) =>
      invokeEvent('get', { name: storeName || name, key, def }),
    set: (key, value, storeName) =>
      invokeEvent('set', { name: storeName || name, key, value }),
    has: (key, storeName) =>
      invokeEvent('has', { name: storeName || name, key }),
    replace: (data, storeName) =>
      invokeEvent('replace', { name: storeName || name, data }),
    delete: (key, storeName) =>
      invokeEvent('delete', { name: storeName || name, key }),
    clear: (storeName) => invokeEvent('clear', storeName || name),
    store: (storeName) => invokeEvent('store', storeName || name),
  };
}

export function storageTools(key) {
  return {
    set: (value) => localStorage.setItem(key, value),
    get: () => localStorage.getItem(key),
    del: () => localStorage.removeItem(key),
  };
}

export function useLocalStorage(key, options) {
  const {
    defaultValue: dValue,
    parse = (v) => JSON.parse(v),
    stringify = (v) => JSON.stringify(v),
  } = { ...options };

  const storage = storageTools(key);

  const set = (value) => {
    if (value == null) {
      storage.del();
      return;
    }
    value = typeof value === 'object' ? stringify(value) : value;
    storage.set(value);
  };
  const get = () => {
    let value = storage.get();
    if (dValue != null && value == null) {
      value = typeof dValue === 'function' ? dValue(value) : dValue;
      set(value);
    }
    if (typeof value !== 'string') {
      return value;
    }
    return parse(value);
  };
  const _ref = () => {
    const value = ref(get());
    watch(value, set, { deep: true });
    return value;
  };
  return {
    get,
    set,
    ref: _ref,
  };
}
