import { computed, watch } from 'vue';
import { defineStore } from 'pinia';
import { useLocalStorage } from '../composable/storage';
import { useNoteStore } from './note';

export const useTabsStore = defineStore('tabsStore', () => {
  const tabsStorage = useLocalStorage('openedTabs', {
    defaultValue: [],
    parse: (v) => {
      try {
        // Handle different input types
        if (typeof v === 'string') {
          if (v === '') return [];
          const parsed = JSON.parse(v);
          return Array.isArray(parsed) ? parsed : [];
        }
        return Array.isArray(v) ? v : [];
      } catch (error) {
        console.warn('Failed to parse openedTabs, using default value:', error);
        return [];
      }
    },
    stringify: (v) => JSON.stringify(v),
  });

  const activeTabIdStorage = useLocalStorage('activeTabId', {
    defaultValue: '',
    parse: (v) => {
      if (typeof v === 'string') {
        return v;
      }
      return v != null ? String(v) : '';
    },
    stringify: (v) => String(v),
  });

  const tabs = tabsStorage.ref();
  const currentActiveTabId = activeTabIdStorage.ref();

  const noteStore = useNoteStore();

  // Computed property: get all valid tabs (filter out deleted notes)
  const validTabs = computed(() => {
    return tabs.value.filter((tab) => {
      if (tab.type === 'note') {
        return noteStore.notes.some((note) => note.id === tab.id);
      }
      return true; // Other tab types are not validated for now
    });
  });

  // Computed property: current active tab
  const activeTab = computed(() => {
    if (!currentActiveTabId.value) return null;
    return (
      validTabs.value.find((tab) => tab.id === currentActiveTabId.value) || null
    );
  });

  // Add tab
  const addTab = (tabData) => {
    const existingTab = tabs.value.find(
      (tab) => tab.id === tabData.id && tab.type === tabData.type
    );

    if (existingTab) {
      // If tab already exists, activate it directly
      setActiveTab(tabData.id);
      return existingTab;
    }

    const newTab = {
      id: tabData.id,
      type: tabData.type || 'note',
      title: tabData.title || 'Untitled',
      createdAt: Date.now(),
      ...tabData,
    };

    tabs.value.push(newTab);
    setActiveTab(newTab.id);

    return newTab;
  };

  // Remove tab
  const removeTab = (tabId, router) => {
    const tabIndex = tabs.value.findIndex((tab) => tab.id === tabId);
    if (tabIndex === -1) return;

    const removedTab = tabs.value.splice(tabIndex, 1)[0];
    let newActiveTabId = null;

    // If closing the current active tab, need to switch to another tab
    if (currentActiveTabId.value === tabId) {
      if (tabs.value.length > 0) {
        // 根据需求：如果是第一个标签页，取右边的；否则取左边的
        let newActiveIndex;
        if (tabIndex === 0) {
          // 第一个标签页被关闭，取右边的第一个
          newActiveIndex = 0;
        } else {
          // 不是第一个，取左边的
          newActiveIndex = tabIndex - 1;
        }

        newActiveTabId = tabs.value[newActiveIndex]?.id || '';
        currentActiveTabId.value = newActiveTabId;
      } else {
        currentActiveTabId.value = '';
      }
    }

    // 如果提供了router并且有新的活动标签页，自动跳转
    if (router && newActiveTabId) {
      const newActiveTab = tabs.value.find((tab) => tab.id === newActiveTabId);
      if (newActiveTab && newActiveTab.type === 'note') {
        router.push(`/note/${newActiveTabId}`);
      }
    }

    return removedTab;
  };

  // Close all tabs
  const closeAllTabs = () => {
    tabs.value = [];
    currentActiveTabId.value = '';
  };

  // Set active tab
  const setActiveTab = (tabId) => {
    if (tabId && tabs.value.some((tab) => tab.id === tabId)) {
      currentActiveTabId.value = tabId;
    }
  };

  // Update tab title
  const updateTabTitle = (tabId, newTitle) => {
    const tab = tabs.value.find((tab) => tab.id === tabId);
    if (tab) {
      tab.title = newTitle;
    }
  };

  // Watch tabs changes, automatically save to localStorage
  watch(
    () => tabs.value,
    (newTabs) => {
      tabsStorage.set(newTabs);
    },
    { deep: true }
  );

  // Watch activeTabId changes, automatically save to localStorage
  watch(
    () => currentActiveTabId.value,
    (newActiveTabId) => {
      activeTabIdStorage.set(newActiveTabId);
    }
  );

  // Initialize: restore tabs from localStorage
  const initTabs = () => {
    // Restore data from localStorage
    const rawSavedTabs = tabsStorage.get();
    const rawSavedActiveTabId = activeTabIdStorage.get();

    // Parsed data
    const savedTabs = Array.isArray(rawSavedTabs) ? rawSavedTabs : [];
    const savedActiveTabId =
      typeof rawSavedActiveTabId === 'string' ? rawSavedActiveTabId : '';

    // Set restored data
    tabs.value = savedTabs;
    currentActiveTabId.value = savedActiveTabId;

    // Verify if the active tab is still valid
    if (
      currentActiveTabId.value &&
      !validTabs.value.some((tab) => tab.id === currentActiveTabId.value)
    ) {
      currentActiveTabId.value = '';
    }
  };

  // Watch note changes, update related tab titles
  const watchNoteChanges = () => {
    // Can listen to noteStore changes to update tab titles
    // Left empty for now, can be implemented in components
  };

  return {
    tabs: validTabs,
    activeTab,
    activeTabId: currentActiveTabId,
    addTab,
    removeTab,
    closeAllTabs,
    setActiveTab,
    updateTabTitle,
    initTabs,
    watchNoteChanges,
  };
});
