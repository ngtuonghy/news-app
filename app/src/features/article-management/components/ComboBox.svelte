<script lang="ts">
import { onDestroy, onMount } from "svelte";

  export interface ComboBoxProps {
    options: {
      label: string;
      value: string;
    }[];
    selected?: string | null;
    placeholder?: string;
    className?: string;
    onSelect: (value: string) => void;
  }

  let { 
    options = [], 
    selected: initialSelected = null, 
    placeholder = "Select an option", 
    className = "" ,
    onSelect = (value:string) => {}
  }: ComboBoxProps = $props();

  let isOpen = $state(false);
  let highlightedIndex = $state(-1);
  let selected: string | null = $state(initialSelected);
  let value: string | null = $state(null);
    let comboRef: HTMLDivElement | null = $state(null);

  let searchInput: HTMLInputElement | null = $state(null);
    let filteredOptions = $state(options);

  function toggle() {
    isOpen = !isOpen;
    if (isOpen) {
      setTimeout(() => searchInput?.focus(), 0);
      highlightedIndex = selected 
  ? options.findIndex(o => o.value === selected) 
  : -1;
    }
  }

  function selectOption(option: string) {
    selected = option;
    isOpen = false;
    onSelect(option);
  }

  $effect(() => {
          value = options.find(o => o.value === selected)?.label || null;
  });

  function highlight(index: number) {
    highlightedIndex = index;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlightedIndex = (highlightedIndex + 1) % options.length;
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlightedIndex = (highlightedIndex - 1 + options.length) % options.length;
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectOption(options[highlightedIndex].value);
    } else if (e.key === "Escape") {
      isOpen = false;
    }
  }

  const handleClickOutside = (e: MouseEvent) => {
    if (!comboRef || comboRef.contains(e.target as Node)) return;
    isOpen = false;
  };

    onMount(() => {
  document.addEventListener("click", handleClickOutside);

  return () => document.removeEventListener("click", handleClickOutside);
});

 

</script>

<div 
  bind:this={comboRef}
  class={`relative ${className}`} 
  tabindex="0" 
  onkeydown={onKeyDown} 
  role="combobox" 
  aria-expanded={isOpen} 
  aria-haspopup="listbox" 
  aria-owns="combobox-list" 
  aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
>
  <button
    type="button"
    class="w-full border rounded px-3 py-2 text-left bg-white dark:bg-gray-700"
    onclick={toggle}
    aria-label="Select an option"
  >
    {value ?? placeholder}
    <span class="float-right">▾</span>
  </button>

  {#if isOpen}
    <div class="absolute mt-2 w-full">
    <div class="relative w-full">
        <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
          <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"/>
</svg>
 
        </div>
        <input bind:this={searchInput} type="text" id="simple-search" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm focus:ring-0 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white rounded-t-md dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Search branch name..." oninput={
          (e) => {
            const query = (e.target as HTMLInputElement).value.toLowerCase();
            filteredOptions = options.filter(o => o.label.toLowerCase().includes(query));
            highlightedIndex = -1;
          }} />
    </div>



    <ul 
      id="combobox-list"
      role="listbox"
      class="w-full bg-white dark:bg-gray-700 border border-gray-300 border-t-0 shadow max-h-60 overflow-auto rounded-b-md"
    >
      {#each filteredOptions as option, index}
        <button
          id={`option-${index}`}
          role="option"
          aria-selected={selected === option.value}
          class={`px-3 py-2 cursor-pointer block w-full m-0 text-start ${ 
            index === highlightedIndex ? "bg-blue-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-600"
          }`}
          onmouseenter={() => highlight(index)}
          onclick={() => selectOption(option.value)}
        >
          {option.label}
        </button>
      {/each}
    </ul>
    </div>
  {/if}
</div>


