<template>
  <NodeViewWrapper>
    <div>
      <VueMermaidRender
        v-if="currentTheme === 'dark'"
        :class="{ 'dark:text-purple-400 text-purple-500': selected }"
        :content="mermaidContent"
        :config="config"
        @click="openTextarea"
      />
      <VueMermaidRender
        v-else
        :class="{ 'dark:text-purple-400 text-purple-500': selected }"
        :content="mermaidContent"
        :config="config"
        @click="openTextarea"
      />
      <div v-if="showTextarea" class="bg-input transition rounded-lg p-2">
        <textarea
          ref="inputRef"
          :value="mermaidContent"
          type="textarea"
          placeholder="Enter Mermaid code here..."
          class="bg-transparent w-full"
          @input="updateContent($event)"
          @keydown.ctrl.enter="closeTextarea"
        ></textarea>
      </div>
    </div>
  </NodeViewWrapper>
</template>

<script>
import { ref, watch, onMounted, computed, nextTick } from 'vue';
import { VueMermaidRender } from 'vue-mermaid-render';
import { NodeViewWrapper, nodeViewProps } from '@tiptap/vue-3';
import { useTheme } from '@/composable/theme';

export default {
  components: {
    VueMermaidRender,
    NodeViewWrapper,
  },
  props: nodeViewProps,
  setup(props) {
    const mermaidContent = ref('');
    const inputRef = ref(null);
    const showTextarea = ref(false);
    const { currentTheme } = useTheme();
    const config = computed(() => ({
      theme: currentTheme.value === 'dark' ? 'dark' : 'default',
    }));

    function renderContent() {
      mermaidContent.value = props.node.attrs.content || '';
    }

    let lastTextLength = mermaidContent.value.length;
    let lastScrollHeight = 0;
    const calc = (target) => {
      const value = target.value;
      const inputTextLength = value.length;
      if (inputTextLength < lastTextLength) {
        target.style.height = '';
      }
      const inputScrollHeight = target.scrollHeight;
      if (lastScrollHeight < inputScrollHeight || !target.style.height) {
        lastScrollHeight = inputScrollHeight;
        target.style.height = `${inputScrollHeight + 2}px`;
      }
      lastTextLength = target.value.length;
    };
    function updateContent(event) {
      const target = event.target;
      const { value } = target;
      props.updateAttributes({ content: value });
      mermaidContent.value = value;
      calc(target);
    }

    function openTextarea() {
      showTextarea.value = true;
      if (inputRef.value) {
        inputRef.value.focus();
      }
    }

    watch(showTextarea, (n) => {
      if (n) {
        nextTick(() => {
          inputRef.value && calc(inputRef.value);
        });
      }
    });

    function closeTextarea() {
      showTextarea.value = false;
    }

    onMounted(() => {
      renderContent();
    });

    // Watch for changes in node.attrs.content to keep mermaidContent updated
    watch(
      () => props.node.attrs.content,
      (newContent) => {
        mermaidContent.value = newContent;
      }
    );

    return {
      updateContent,
      mermaidContent,
      inputRef,
      showTextarea,
      openTextarea,
      closeTextarea,
      config,
      currentTheme,
    };
  },
};
</script>
