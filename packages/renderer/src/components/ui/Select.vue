<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div :class="{ 'inline-block': !block }" class="ui-select">
    <label
      v-if="label"
      :for="selectId"
      class="text-neutral-200 text-sm ml-2 rtl:ml-0 rtl:mr-2"
    >
      {{ label }}
    </label>

    <div
      class="ui-select__content flex items-center w-full block transition focus-within:ring-1 ring-secondary bg-input rounded-lg appearance-none focus:outline-none relative"
    >
      <!-- Prepend icon -->
      <v-remixicon
        v-if="prependIcon"
        size="20"
        :name="prependIcon"
        class="absolute text-neutral-600 dark:text-neutral-200 left-0 ml-2 rtl:left-auto rtl:right-0 rtl:mr-2 rtl:ml-0"
      />

      <!-- Custom Select Button -->
      <button
        :id="selectId"
        ref="selectButton"
        :class="[
          prependIcon ? 'pl-8 rtl:pl-0 rtl:pr-8' : '',
          'px-4 pr-8 py-2 z-10 w-full h-full text-left rtl:text-right bg-transparent focus:outline-none',
        ]"
        type="button"
        :aria-labelledby="label ? `${selectId}-label` : undefined"
        :aria-haspopup="true"
        :aria-expanded="isOpen"
        @click="toggle"
        @keydown="onKeydown"
        @blur="handleBlur"
      >
        <!-- Multiple selection display -->
        <div
          v-if="multiple && Array.isArray(modelValue) && modelValue.length > 0"
          class="flex flex-wrap gap-1"
        >
          <span
            v-for="value in modelValue.slice(0, maxDisplayTags)"
            :key="value"
            class="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary bg-opacity-20 text-secondary"
          >
            {{ getSelectedText(value) }}
            <button
              v-if="!disableTagRemoval"
              type="button"
              class="ml-1 text-secondary hover:text-red-500 focus:outline-none"
              @click.stop="removeTag(value)"
              @keydown.enter.stop="removeTag(value)"
              @keydown.space.stop="removeTag(value)"
            >
              <v-remixicon name="riCloseLine" size="14" />
            </button>
          </span>
          <span
            v-if="modelValue.length > maxDisplayTags"
            class="text-neutral-500 text-sm"
          >
            +{{ modelValue.length - maxDisplayTags }} more
          </span>
        </div>

        <!-- Single selection or placeholder -->
        <span v-else-if="selectedText" class="block truncate">
          {{ selectedText }}
        </span>
        <span v-else-if="placeholder" class="block truncate text-neutral-500">
          {{ placeholder }}
        </span>
      </button>

      <!-- Dropdown Arrow (rotate only when open, not for RTL) -->
      <v-remixicon
        size="28"
        name="riArrowDropDownLine"
        :class="{ 'rotate-180': isOpen }"
        class="absolute text-neutral-600 dark:text-neutral-200 mr-2 right-0 rtl:right-auto rtl:left-0 rtl:ml-2 rtl:mr-0 transition-transform duration-200 pointer-events-none"
      />

      <!-- Dropdown Menu -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="dropdown"
          class="absolute top-full left-0 right-0 mt-1 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <!-- Search Input -->
          <div
            v-if="search"
            class="p-2 border-b border-neutral-300 dark:border-neutral-600"
          >
            <ui-input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              :placeholder="translations.index.search"
              class="w-full p-1"
              @keydown="onSearchKeydown"
            />
          </div>

          <!-- Options -->
          <div class="max-h-48 overflow-y-auto">
            <div
              v-if="placeholder && !hideePlaceholderInDropdown"
              class="px-4 py-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-500 flex items-center justify-between"
              :class="{
                'bg-neutral-200 dark:bg-neutral-600': isSelected(''),
              }"
              @click="select({ value: '', text: placeholder })"
            >
              <span>{{ placeholder }}</span>
              <v-remixicon
                v-if="isSelected('')"
                name="riCheckLine"
                class="text-primary flex-shrink-0 ml-2"
              />
            </div>

            <div
              v-for="(option, index) in filteredOptions"
              :key="`${option.value}-${index}`"
              :ref="(el) => setOptionRef(el, index)"
              class="px-4 py-2 hover:bg-secondary hover:bg-opacity-20 transition-colors flex items-center justify-between"
              :class="{
                'bg-neutral-100 dark:bg-neutral-700': isSelected(option.value),
                'opacity-50 cursor-not-allowed': option.disabled,
                'bg-secondary bg-opacity-20':
                  index === focusedIndex && !option.disabled,
              }"
              @click="select(option)"
            >
              <span>{{ option.text }}</span>
              <v-remixicon
                v-if="isSelected(option.value)"
                name="riCheckLine"
                class="text-primary flex-shrink-0 ml-2"
              />
            </div>

            <div
              v-if="search && searchQuery && filteredOptions.length === 0"
              class="px-4 py-2 text-neutral-500 text-center"
            >
              {{ translations.index?.notFound || 'No options found' }}
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useTranslations } from '@/composable/useTranslations';

export default {
  props: {
    modelValue: [String, Number, Array], // 支持数组类型用于多选
    label: String,
    prependIcon: String,
    placeholder: String,
    block: Boolean,
    search: Boolean,
    multiple: Boolean, // 新增多选模式开关
    maxDisplayTags: {
      type: Number,
      default: 3, // 最多显示的标签数量
    },
    disableTagRemoval: {
      type: Boolean,
      default: false, // 是否禁用标签移除功能
    },
    hideePlaceholderInDropdown: {
      type: Boolean,
      default: false,
    },
    options: {
      type: Array,
      default: () => [],
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, slots }) {
    const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;
    const selectButton = ref(null);
    const dropdown = ref(null);
    const searchInput = ref(null);
    const isOpen = ref(false);
    const focusedIndex = ref(-1);
    const searchQuery = ref('');
    const optionRefs = ref([]);
    const { translations } = useTranslations();

    const setOptionRef = (el, index) => {
      if (el) {
        optionRefs.value[index] = el;
      }
    };

    watch(focusedIndex, async (newIndex) => {
      if (newIndex >= 0 && isOpen.value) {
        await nextTick();
        const focusedElement = optionRefs.value[newIndex];
        if (focusedElement && focusedElement.scrollIntoView) {
          focusedElement.scrollIntoView({
            block: 'center',
            behavior: 'smooth',
          });
        }
      }
    });

    const allOptions = computed(() => {
      if (props.options.length > 0) {
        return props.options.map((opt) =>
          typeof opt === 'string'
            ? { value: opt, text: opt, disabled: false }
            : { disabled: false, ...opt }
        );
      }

      const slotContent = slots.default?.();
      if (!slotContent) return [];

      const options = [];
      const parseVNode = (vnode) => {
        if (vnode?.type === 'option') {
          const value = vnode.props?.value ?? '';
          const text = vnode.children || value;
          options.push({
            value: String(value),
            text: String(text),
            disabled: !!vnode.props?.disabled,
          });
        } else if (Array.isArray(vnode)) {
          vnode.forEach(parseVNode);
        } else if (vnode?.children) {
          parseVNode(vnode.children);
        }
      };

      parseVNode(slotContent);
      return options;
    });

    const filteredOptions = computed(() => {
      if (!props.search || !searchQuery.value) return allOptions.value;

      const query = searchQuery.value.toLowerCase();
      return allOptions.value.filter((opt) =>
        opt.text.toLowerCase().includes(query)
      );
    });

    // 获取选中文本（支持单选和多选）
    const selectedText = computed(() => {
      if (props.multiple && Array.isArray(props.modelValue)) {
        if (props.modelValue.length === 0) return '';
        const texts = props.modelValue
          .map((value) => getSelectedText(value))
          .filter((text) => text);
        return texts.join(', ');
      }

      const option = allOptions.value.find(
        (opt) => opt.value === String(props.modelValue)
      );
      return option?.text || '';
    });

    // 检查某个值是否被选中
    const isSelected = (value) => {
      if (props.multiple && Array.isArray(props.modelValue)) {
        return props.modelValue.includes(String(value));
      }
      return String(props.modelValue) === String(value);
    };

    // 获取指定值对应的显示文本
    const getSelectedText = (value) => {
      const option = allOptions.value.find(
        (opt) => opt.value === String(value)
      );
      return option?.text || String(value);
    };

    // 移除标签（多选模式下）
    const removeTag = (value) => {
      if (!props.multiple || !Array.isArray(props.modelValue)) return;

      const newValue = props.modelValue.filter((item) => item !== value);
      emit('update:modelValue', newValue);
      emit('change', newValue);
    };

    const toggle = () => {
      isOpen.value = !isOpen.value;
      if (isOpen.value) {
        nextTick(() => {
          searchQuery.value = '';
          optionRefs.value = [];

          // 查找当前选中项的索引
          let currentIndex = -1;
          if (
            props.multiple &&
            Array.isArray(props.modelValue) &&
            props.modelValue.length > 0
          ) {
            // 多选模式下，找到第一个选中项
            currentIndex = filteredOptions.value.findIndex((opt) =>
              props.modelValue.includes(String(opt.value))
            );
          } else {
            // 单选模式
            currentIndex = filteredOptions.value.findIndex(
              (opt) => opt.value === String(props.modelValue)
            );
          }

          focusedIndex.value = Math.max(0, currentIndex);

          if (props.search && searchInput.value) {
            searchInput.value.focus();
          }
        });
      } else {
        optionRefs.value = [];
      }
    };

    const select = (option) => {
      if (option.disabled) return;

      if (props.multiple) {
        // 多选模式
        const currentValue = Array.isArray(props.modelValue)
          ? [...props.modelValue]
          : [];
        const optionValue = String(option.value);

        const index = currentValue.indexOf(optionValue);
        if (index > -1) {
          // 已选中则移除
          currentValue.splice(index, 1);
        } else {
          // 未选中则添加
          currentValue.push(optionValue);
        }

        emit('update:modelValue', currentValue);
        emit('change', currentValue);

        // 多选模式下保持下拉菜单开启
        if (!props.closeOnSelect) {
          selectButton.value?.focus();
        }
      } else {
        // 单选模式（原有逻辑）
        emit('update:modelValue', option.value);
        emit('change', option.value);
        isOpen.value = false;
        selectButton.value?.focus();
      }
    };

    const selectFocused = () => {
      const option = filteredOptions.value[focusedIndex.value];
      if (option && !option.disabled) {
        select(option);
      }
    };

    const moveFocus = (direction) => {
      const max = filteredOptions.value.length - 1;
      let newIndex = focusedIndex.value + direction;

      if (newIndex < 0) newIndex = max;
      if (newIndex > max) newIndex = 0;

      let attempts = 0;
      while (
        filteredOptions.value[newIndex]?.disabled &&
        attempts < filteredOptions.value.length
      ) {
        newIndex += direction;
        if (newIndex < 0) newIndex = max;
        if (newIndex > max) newIndex = 0;
        attempts++;
      }

      focusedIndex.value = newIndex;
    };

    const onKeydown = (e) => {
      if (!isOpen.value) {
        if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
          e.preventDefault();
          toggle();
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          isOpen.value = false;
          selectButton.value?.focus();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          selectFocused();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(-1);
          break;
      }
    };

    const onSearchKeydown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(-1);
          break;
        case 'Enter':
          e.preventDefault();
          selectFocused();
          break;
        case 'Escape':
          e.preventDefault();
          isOpen.value = false;
          selectButton.value?.focus();
          break;
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        if (!dropdown.value?.contains(document.activeElement)) {
          isOpen.value = false;
        }
      }, 150);
    };

    const onClickOutside = (e) => {
      if (
        !selectButton.value?.contains(e.target) &&
        !dropdown.value?.contains(e.target)
      ) {
        isOpen.value = false;
      }
    };

    onMounted(() => {
      document.addEventListener('click', onClickOutside);
    });

    onUnmounted(() => {
      document.removeEventListener('click', onClickOutside);
    });

    return {
      selectId,
      selectButton,
      dropdown,
      searchInput,
      isOpen,
      focusedIndex,
      searchQuery,
      selectedText,
      filteredOptions,
      optionRefs,
      translations,
      setOptionRef,
      toggle,
      select,
      isSelected,
      getSelectedText,
      removeTag,
      onKeydown,
      onSearchKeydown,
      handleBlur,
    };
  },
};
</script>

<style>
.ui-select__arrow {
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
}

.ui-select .optgroup-container {
  @apply bg-neutral-100 dark:bg-neutral-700;
}

/* Ensure dropdown is above other elements */
.ui-select .z-50 {
  z-index: 50;
}

/* Custom scrollbar for dropdown */
.ui-select .max-h-60::-webkit-scrollbar {
  width: 6px;
}

.ui-select .max-h-60::-webkit-scrollbar-track {
  @apply bg-neutral-200 dark:bg-neutral-800;
}

.ui-select .max-h-60::-webkit-scrollbar-thumb {
  @apply bg-neutral-400 dark:bg-neutral-600 rounded;
}

.ui-select .max-h-60::-webkit-scrollbar-thumb:hover {
  @apply bg-neutral-500 dark:bg-neutral-500;
}
</style>
