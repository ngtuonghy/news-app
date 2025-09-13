<script lang="ts">
export interface Tags {
  id?: number; 
  name: string;
}

export interface Props {
  tags?: Tags[];
  onChange?: (tags: Tags[]) => void;
}

let {
  tags = [],
  onChange = () => {}
}: Props = $props();

let input = $state("");

function handleKeydown(e: KeyboardEvent) {
  const isAddKey = e.key === "Enter" || e.key === " " || e.key === ","
  if (isAddKey && input.trim() !== "") {
    e.preventDefault();
    const name = input.trim();
    if (!tags.some(t => t.name === name)) {
      const newTag: Tags = {  name };
      tags = [...tags, newTag];
      onChange(tags);
    }
    input = "";
  }

  if (e.key === "Backspace" && input === "" && tags.length > 0) {
    tags = tags.slice(0, -1);
    onChange(tags);
  }
}

function removeTag(tag: Tags) {
  tags = tags.filter(t => t !== tag);
  onChange(tags);
}
</script>

<div class="mt-4">
  <label class="block text-sm font-medium mb-1">Tags</label>
  <div class="flex flex-wrap gap-1 p-1 items-center border rounded bg-gray-50 dark:bg-gray-700">
    {#each tags as tag}
      <div class="flex h-5 items-center gap-1 px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded">
        {tag.name}
        <button type="button" class="text-blue-500 hover:text-blue-700 cursor-pointer" onclick={() => removeTag(tag)}>
          <svg class="w-4 h-4 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
          </svg>
        </button>
      </div>
    {/each}

    <input
      type="text"
      bind:value={input}
      onkeydown={handleKeydown}
      class="border-none focus:ring-0 bg-transparent text-sm flex-1 min-h-5 px-1"
    />
  </div>
</div>


