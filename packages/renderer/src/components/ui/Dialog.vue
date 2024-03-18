<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <ui-modal :model-value="state.show" content-class="max-w-sm" persist>
    <template #header>
      <h3 class="font-semibold text-lg">{{ state.options.title }}</h3>
    </template>
    <p class="text-gray-600 dark:text-gray-200 leading-tight">
      {{ state.options.body }}
    </p>
    <ui-input
      v-if="state.type === 'prompt'"
      v-model="state.input"
      autofocus
      :placeholder="state.options.placeholder"
      :label="state.options.label"
      class="w-full mt-4"
    ></ui-input>
    <label
      v-if="state.options.showSkipWarn"
      class="flex items-center space-x-2"
    >
      <input v-model="disableDialog" type="checkbox" class="form-checkbox" />
      <span class="inline-block align-middle">
        {{ translations.index.hide || '-' }}</span
      >
    </label>
    <div class="mt-8 flex space-x-2">
      <ui-button class="w-6/12" @click="fireCallback('onCancel')">
        {{ state.options.cancelText }}
      </ui-button>
      <ui-button
        class="w-6/12"
        :variant="state.options.okVariant"
        @click="fireCallback('onConfirm')"
      >
        {{ state.options.okText }}
      </ui-button>
    </div>
  </ui-modal>
</template>
<script>
import { onMounted, ref, reactive, shallowReactive, watch } from 'vue';
import emitter from 'tiny-emitter/instance';
import { useTranslate } from '../../composable/translation';

const defaultOptions = {
  html: false,
  body: '',
  title: '',
  placeholder: '',
  label: '',
  okText: 'Confirm',
  okVariant: 'primary',
  cancelText: 'Cancel',
  onConfirm: null,
  onCancel: null,
  showSkipWarn: false,
  onSkip: null,
};

export default {
  setup() {
    const state = reactive({
      show: false,
      type: '',
      input: '',
      options: defaultOptions,
    });
    const translations = shallowReactive({
      index: {
        hide: 'index.hide',
      },
    });
    const disableDialog = ref(false);

    onMounted(async () => {
      await useTranslate({ translations });
    });

    emitter.on('show-dialog', (type, options) => {
      state.type = type;
      state.options = {
        ...defaultOptions,
        ...options,
      };
      console.log(state);

      state.show = true;
    });

    function fireCallback(type) {
      const callback = state.options[type];
      const param = state.type === 'prompt' ? state.input : true;
      let hide = true;

      if (callback) {
        const cbReturn = callback(param);

        if (typeof cbReturn === 'boolean') hide = cbReturn;
      }

      if (disableDialog.value) {
        console.log(state.options.onSkip);
        state.options.onSkip && state.options.onSkip();
      }

      if (hide) {
        state.options = defaultOptions;
        state.show = false;
        state.input = '';
      }
    }
    function keyupHandler({ code }) {
      if (code === 'Enter') {
        fireCallback('onConfirm');
      } else if (code === 'Escape') {
        fireCallback('onCancel');
      }
    }

    watch(
      () => state.show,
      (value) => {
        if (value) {
          window.addEventListener('keyup', keyupHandler);
        } else {
          window.removeEventListener('keyup', keyupHandler);
        }
      }
    );

    return {
      state,
      fireCallback,
      translations,
      disableDialog,
    };
  },
};
</script>
