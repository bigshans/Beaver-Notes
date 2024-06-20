<template>
  <NodeViewWrapper>
    <div class="flex items-center">
      <v-remixicon
        class="cursor-pointer h-10"
        :name="isOpen ? 'riArrowDropDownFill' : 'riArrowRightSFill'"
        @click="toggleCollapse"
      />
      <NodeViewContent :as="`h${attrs.level}`" />
    </div>
  </NodeViewWrapper>
</template>
<script setup>
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3';
import { computed } from 'vue';

const props = defineProps(nodeViewProps);
const attrs = computed(() => props.node.attrs);
const isOpen = computed(() => attrs.value.open);
function toggleCollapse() {
  props.editor.commands.toggleCollapse();
}
</script>
