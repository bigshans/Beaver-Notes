import { defineStore } from 'pinia';
import { useNoteStore } from './note';
import { useLabelStore } from './label';
import { usePasswordStore } from './passwd';

export const useStore = defineStore('main', {
  state: () => ({
    inFocusMode: false,
    activeNoteId: '',
    showPrompt: false,
    noWarnFor: null,
  }),
  getters: {
    getNoWarnFor() {
      if (this.noWarnFor) {
        return this.noWarnFor;
      }
      const item = localStorage.getItem('noWarnFor');
      if (item) {
        this.noWarnFor = JSON.parse(item);
      } else {
        this.noWarnFor = {
          useInnerDelete: true,
        };
      }
      return this.noWarnFor;
    },
  },
  actions: {
    setNoWarnFor(obj) {
      const item = this.getNoWarnFor;
      Object.assign(item, obj);
      localStorage.setItem('noWarnFor', JSON.stringify(item));
      console.log(item);
      this.noWarnFor = item;
      return Promise.resolve(item);
    },
    retrieve() {
      return new Promise((resolve) => {
        const noteStore = useNoteStore();
        const labelStore = useLabelStore();
        const passwordStore = usePasswordStore(); // Instantiate the usePasswordStore

        const promises = Promise.allSettled([
          noteStore.retrieve(),
          labelStore.retrieve(),
          passwordStore.retrieve(), // Retrieve password hashes
        ]);

        promises.then((values) => {
          const result = [];

          values.forEach(({ value, status }) => {
            if (status === 'fulfilled') result.push(value);
          });

          resolve(result);
        });
      });
    },
  },
});
