<script lang="ts">
    import { cn } from "@/utils/cn";
  import { onMount } from "svelte";

  interface Props {
    value: string;
    placeholder?: string;
    className?: string;
    onChange: (value: string) => void;
  }

  let { value, placeholder,onChange, className }: Props = $props();

  let textarea: HTMLTextAreaElement;

  function autoResize() {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  onMount(() => autoResize());

  function handleInput(e: Event) {
    const target = e.currentTarget as HTMLTextAreaElement;
    value = target.value;
    autoResize();
    onChange(value);
  }
</script>

<textarea
  bind:this={textarea}
  bind:value={value}
  placeholder={placeholder}
  class={cn(
    "border-none focus:ring-0 bg-transparent w-full resize-none overflow-hidden",
    className
  )}
  rows="1"
  oninput={handleInput}
  onkeydown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
></textarea>


