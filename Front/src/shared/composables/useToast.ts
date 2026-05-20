import { ref } from 'vue';

const messages = ref<string[]>([]);

export const useToast = () => {
  const push = (message: string) => {
    messages.value.push(message);
    setTimeout(() => {
      messages.value.shift();
    }, 3000);
  };

  return { messages, push };
};