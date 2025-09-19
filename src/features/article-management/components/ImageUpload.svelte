<!-- ImageUpload.svelte -->
<script lang="ts">
    import { cn } from "@/utils/cn";


  interface Props {
    previewUrl: string | null;
    className?: string;
    onFileChange?: (file: File) => void;
  }
  let { 
    previewUrl,
    onFileChange,
    className
  }: Props = $props();
  let file: File | null = null;


  function handleFileChange(e: Event) {
    const target = e.currentTarget as HTMLInputElement;
    if (target.files && target.files[0]) {
      file = target.files[0];
      previewUrl = URL.createObjectURL(file);
      onFileChange && onFileChange(file);
    }
  }
</script>

<div class={cn("flex items-center justify-center w-full ", className)}>
  <label for="dropzone-file" class="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
    {#if previewUrl}
      <img src={previewUrl} alt="Preview" class="object-cover w-full h-full rounded-lg" />
    {:else}
      <div class="flex flex-col items-center justify-center pt-5 pb-6">
        <svg class="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
        </svg>
        <p class="mb-2 text-sm text-gray-500 dark:text-gray-400"><span class="font-semibold">Nhấn để tải ảnh lên</span> hoặc kéo thả ảnh vào đây</p> 
        <p class="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x400px)</p>
      </div>
    {/if}
    <input
      id="dropzone-file"
      type="file"
      class="hidden"
      accept="image/*"
      onchange={handleFileChange}
    />
  </label>
</div>

