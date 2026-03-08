import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useLocalStorage } from '../composable/storage';

export const useAppStore = defineStore('appStore', () => {
  const settingStorage = {
    collapsibleHeading: useLocalStorage('collapsibleHeading', {
      defaultValue: true,
      parse: (v) => (typeof v === 'boolean' ? v : v === 'true'),
    }),
    openLastEdited: useLocalStorage('openLastEdited', {
      defaultValue: true,
      parse: (v) => (typeof v === 'boolean' ? v : v === 'true'),
    }),
    openAfterCreation: useLocalStorage('openAfterCreation', {
      defaultValue: true,
      parse: (v) => (typeof v === 'boolean' ? v : v === 'true'),
    }),
    // Toolbar order/visibility — raw JSON array, logic lives in useToolbarConfig
    toolbarConfig: useLocalStorage('toolbarConfig', {
      defaultValue: null,
      parse: (v) => {
        try {
          const parsed = typeof v === 'string' ? JSON.parse(v) : v;
          return Array.isArray(parsed) ? parsed : null;
        } catch {
          return null;
        }
      },
    }),
    enableTabs: useLocalStorage('enableTabs', {
      defaultValue: false,
      parse: (v) => (typeof v === 'boolean' ? v : v === 'true'),
    }),
    backgroundImage: useLocalStorage('backgroundImage', {
      defaultValue: '',
      parse: (v) => v,
    }),
    backgroundOpacity: useLocalStorage('backgroundOpacity', {
      defaultValue: 1,
      parse: (v) => (v ? +v : 1),
    }),
    backgroundBlur: useLocalStorage('backgroundBlur', {
      defaultValue: 0,
      parse: (v) => (v ? +v : 0),
    }),
    backgroundFit: useLocalStorage('backgroundFit', {
      defaultValue: 'cover',
      parse: (v) => v || 'cover',
    }),
  };

  const setting = ref({
    collapsibleHeading: settingStorage.collapsibleHeading.get(),
    openLastEdited: settingStorage.openLastEdited.get(),
    openAfterCreation: settingStorage.openAfterCreation.get(),
    enableTabs: settingStorage.enableTabs.get(),
  });

  const ui = {
    backgroundImage: settingStorage.backgroundImage.ref(),
    backgroundBlur: settingStorage.backgroundBlur.ref(),
    backgroundOpacity: settingStorage.backgroundOpacity.ref(),
    backgroundFit: settingStorage.backgroundFit.ref(),
  };

  const loading = ref(false);

  return {
    setting,
    ui,
    setSettingStorage: (key, value) => {
      settingStorage[key]?.set(value);
      setting.value[key] = value;
    },
    toolbarStorage: settingStorage.toolbarConfig,
    loading,
  };
});
