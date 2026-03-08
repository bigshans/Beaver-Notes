<template>
  <div
    v-if="shouldShowTabs"
    class="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex-shrink-0 relative"
  >
    <div class="flex items-center px-2 py-1">
      <!-- Tabs container - add horizontal scrolling support -->
      <div
        ref="tabsContainer"
        class="flex items-center overflow-x-auto flex-1 no-scrollbar"
        @wheel.prevent="handleWheelScroll"
      >
        <div
          v-for="tab in tabsStore.tabs"
          :key="tab.id"
          :class="[
            'flex items-center px-3 py-1 text-sm cursor-pointer border-r border-neutral-200 dark:border-neutral-700 transition-colors min-w-0 group flex-shrink-0 relative',
            {
              'bg-primary bg-opacity-20 text-primary':
                tab.id === tabsStore.activeTabId,
              'hover:bg-primary hover:bg-opacity-10 text-neutral-600 dark:text-neutral-300':
                tab.id !== tabsStore.activeTabId,
            },
          ]"
          @click="switchTab(tab)"
          @contextmenu.prevent="showContextMenu($event, tab)"
        >
          <v-remixicon
            :name="getTabIcon(tab)"
            class="w-4 h-4 mr-2 flex-shrink-0"
          />
          <span class="truncate max-w-xs">{{
            tab.title || translations.editor.untitledNote
          }}</span>
          <!-- Always show close button -->
          <button
            class="ml-2 p-0.5 rounded-full hover:bg-primary hover:bg-opacity-20 transition-all duration-200 flex-shrink-0 group"
            @click.stop="closeTab(tab.id)"
          >
            <v-remixicon
              name="riCloseLine"
              class="w-3 h-3 text-neutral-500 group-hover:text-primary transition-colors"
            />
          </button>
        </div>
      </div>

      <!-- Right-click menu -->
      <div
        v-if="contextMenu.visible"
        class="fixed bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-lg py-1 z-50 min-w-[200px]"
        :style="{
          left: contextMenu.x + 'px',
          top: contextMenu.y + 'px',
        }"
      >
        <div
          class="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer flex items-center"
          @click="closeCurrentTab"
        >
          <v-remixicon name="riCloseLine" class="w-4 h-4 mr-2" />
          {{ translations.tabs.closeCurrentTab || 'Close Current Tab' }}
        </div>
        <div
          class="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer flex items-center"
          @click="closeOtherTabs"
        >
          <v-remixicon name="riSubtractLine" class="w-4 h-4 mr-2" />
          {{ translations.tabs.closeOtherTabs || 'Close Other Tabs' }}
        </div>
        <div
          class="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer flex items-center"
          @click="closeTabsToLeft"
        >
          <v-remixicon name="riArrowLeftLine" class="w-4 h-4 mr-2" />
          {{ translations.tabs.closeTabsToLeft || 'Close Tabs to the Left' }}
        </div>
        <div
          class="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer flex items-center"
          @click="closeTabsToRight"
        >
          <v-remixicon name="riArrowRightLine" class="w-4 h-4 mr-2" />
          {{ translations.tabs.closeTabsToRight || 'Close Tabs to the Right' }}
        </div>
        <hr class="my-1 border-neutral-200 dark:border-neutral-700" />
        <div
          class="px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer flex items-center"
          @click="closeAllTabs"
        >
          <v-remixicon name="riCloseLine" class="w-4 h-4 mr-2" />
          {{ translations.tabs?.closeAllTabs || 'Close All Tabs' }}
        </div>
      </div>

      <!-- Click blank area to hide menu -->
      <div
        v-if="contextMenu.visible"
        class="fixed inset-0 z-40"
        @click="hideContextMenu"
      ></div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNoteStore } from '@/store/note';
import { useAppStore } from '@/store/app';
import { useTabsStore } from '@/store/tabs';
import { useTranslations } from '@/composable/useTranslations';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const noteStore = useNoteStore();
    const appStore = useAppStore();
    const tabsStore = useTabsStore();
    const tabsContainer = ref(null);

    // Translations
    const translations = useTranslations().translations;

    // Right-click menu state
    const contextMenu = ref({
      visible: false,
      x: 0,
      y: 0,
      targetTab: null,
    });

    // Whether tabs should be displayed
    const shouldShowTabs = computed(() => {
      // Check if on settings page
      const isSettingsPage =
        route.name === 'Settings' ||
        route.name?.startsWith('Settings-') ||
        route.path.startsWith('/settings');

      return (
        !isSettingsPage &&
        appStore.setting.enableTabs &&
        tabsStore.tabs.length > 0
      );
    });

    // Handle mouse wheel horizontal scrolling
    const handleWheelScroll = (event) => {
      if (!tabsContainer.value) return;

      // Prevent default vertical scrolling behavior
      event.preventDefault();

      // Scroll horizontally based on wheel deltaY value
      const scrollAmount = event.deltaY || event.deltaX;
      tabsContainer.value.scrollLeft += scrollAmount;
    };

    // Scroll to active tab
    const scrollToActiveTab = () => {
      if (!tabsContainer.value) return;

      const activeTabElement = tabsContainer.value.querySelector(
        '.bg-primary.bg-opacity-20'
      );
      if (activeTabElement) {
        activeTabElement.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    };

    // Show right-click menu
    const showContextMenu = (event, tab) => {
      contextMenu.value = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        targetTab: tab,
      };
    };

    // Hide right-click menu
    const hideContextMenu = () => {
      contextMenu.value.visible = false;
      contextMenu.value.targetTab = null;
    };

    // Close current tab
    const closeCurrentTab = () => {
      if (contextMenu.value.targetTab) {
        closeTab(contextMenu.value.targetTab.id);
      }
      hideContextMenu();
    };

    // Close all tabs except current tab
    const closeOtherTabs = () => {
      if (contextMenu.value.targetTab) {
        const targetTabId = contextMenu.value.targetTab.id;
        tabsStore.tabs.forEach((tab) => {
          if (tab.id !== targetTabId) {
            tabsStore.removeTab(tab.id, router);
          }
        });
        tabsStore.setActiveTab(targetTabId);
      }
      hideContextMenu();
    };

    // Close all tabs to the left of current tab
    const closeTabsToLeft = () => {
      if (contextMenu.value.targetTab) {
        const targetTabIndex = tabsStore.tabs.findIndex(
          (tab) => tab.id === contextMenu.value.targetTab.id
        );
        if (targetTabIndex > 0) {
          const tabsToRemove = tabsStore.tabs.slice(0, targetTabIndex);
          tabsToRemove.forEach((tab) => {
            tabsStore.removeTab(tab.id, router);
          });
        }
      }
      hideContextMenu();
    };

    // Close all tabs to the right of current tab
    const closeTabsToRight = () => {
      if (contextMenu.value.targetTab) {
        const targetTabIndex = tabsStore.tabs.findIndex(
          (tab) => tab.id === contextMenu.value.targetTab.id
        );
        if (targetTabIndex < tabsStore.tabs.length - 1) {
          const tabsToRemove = tabsStore.tabs.slice(targetTabIndex + 1);
          tabsToRemove.forEach((tab) => {
            tabsStore.removeTab(tab.id, router);
          });
        }
      }
      hideContextMenu();
    };

    // Switch tab
    const switchTab = (tab) => {
      if (tab.id === tabsStore.activeTabId.value) {
        return;
      }

      tabsStore.setActiveTab(tab.id);
      if (tab.type === 'note') {
        router.push(`/note/${tab.id}`);
      }
    };

    // Close tab
    const closeTab = (tabId) => {
      tabsStore.removeTab(tabId, router);

      // If no tabs left, go back to home page
      if (tabsStore.tabs.length === 0) {
        router.push('/');
      }
    };

    // Close all tabs
    const closeAllTabs = () => {
      tabsStore.closeAllTabs();
      router.push('/');
      hideContextMenu();
    };

    // Get tab icon
    const getTabIcon = (tab) => {
      switch (tab.type) {
        case 'note':
          return 'riFile2Line';
        default:
          return 'riFile2Line';
      }
    };

    // Watch route changes to automatically add tabs
    watch(
      () => [route.name, route.params.id],
      async ([newName, newId]) => {
        if (!appStore.setting.enableTabs) return;

        // Only add tab when visiting note page
        if (newName === 'Note' && newId) {
          // Wait for noteStore to be ready
          let retryCount = 0;
          const maxRetries = 30;

          while (retryCount < maxRetries) {
            const note = noteStore.getById(newId);
            if (note) {
              tabsStore.addTab({
                id: note.id,
                type: 'note',
                title: note.title,
              });
              nextTick(() => scrollToActiveTab());
              break;
            }

            retryCount++;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }
      },
      { immediate: true }
    );

    // Watch note title changes to update tab titles
    watch(
      () => noteStore.notes.map((note) => ({ id: note.id, title: note.title })),
      (newNotes) => {
        if (!appStore.setting.enableTabs) return;

        newNotes.forEach(({ id, title }) => {
          tabsStore.updateTabTitle(
            id,
            title || translations.value.editor.untitledNote || 'Untitled Note'
          );
        });
      },
      { deep: true }
    );

    onMounted(async () => {
      // Only process when tabs feature is enabled
      if (!appStore.setting.enableTabs) {
        return;
      }

      // If currently on note page and no corresponding tab exists, activate or add it
      if (route.name === 'Note' && route.params.id) {
        // Wait for noteStore to be ready
        let retryCount = 0;
        const maxRetries = 20;

        while (retryCount < maxRetries) {
          const note = noteStore.getById(route.params.id);
          if (note) {
            const existingTab = tabsStore.tabs.find(
              (tab) => tab.id === note.id
            );
            if (existingTab) {
              // If tab exists, ensure it's active
              if (tabsStore.activeTabId !== note.id) {
                tabsStore.setActiveTab(note.id);
              }
            } else {
              // If tab doesn't exist, add it
              tabsStore.addTab({
                id: note.id,
                type: 'note',
                title: note.title,
              });
            }
            break;
          }

          retryCount++;
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // Ensure scroll to active tab position
      if (tabsStore.activeTabId) {
        nextTick(() => scrollToActiveTab());
      }
    });

    return {
      appStore,
      tabsStore,
      tabsContainer,
      contextMenu,
      translations,
      shouldShowTabs,
      handleWheelScroll,
      showContextMenu,
      hideContextMenu,
      closeCurrentTab,
      closeOtherTabs,
      closeTabsToLeft,
      closeTabsToRight,
      switchTab,
      closeTab,
      closeAllTabs,
      getTabIcon,
      scrollToActiveTab,
    };
  },
};
</script>
