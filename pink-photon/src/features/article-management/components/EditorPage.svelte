<script lang="ts">
  import { onMount } from "svelte";
  import { Editor } from "@tiptap/core";
  import { Dropcursor } from '@tiptap/extensions'
  import StarterKit from "@tiptap/starter-kit";
  import FileHandler from '@tiptap/extension-file-handler'
  import Image from '@tiptap/extension-image'
  import type { User } from "@/features/auth/domain/User";
  import type { Article } from "../domain/Article";
  import InputTag, { type Tags } from "./InputTag.svelte";
  import AutoTextarea from "./AutoTextarea.svelte";
  import ImageUpload from "./ImageUpload.svelte";
  import ComboBox from "./ComboBox.svelte";
  import type { Category } from "@/features/news-categories/domain/Category";
  import { Datepicker } from 'flowbite';
  import dayjs from "dayjs";
  import EditorInsertTool from "./InsertToolEditor.svelte";
    import { uploadEditorImages } from "../services/ArticleUpLoadImage";

  let editor: Editor ;

  interface Props {
    user: User;
    article: Article;
    categories: Category[];
    id: string
  }
  let { user, article, categories,id }: Props = $props();
    
  let articleTags: {
  id?: number;
  name: string;
}[] = $state(article.tags || []);



  let selectedCategory = $state<string | null>(article.categoryId ? article.categoryId.toString() : null);
  let file: File | null = $state(null);
  let title = $state(article.title || "");
  let shortDescription = $state(article.shortDescription || "");

  let status = $state(article.status || "draft");
  let publishedAt = $state(dayjs(article.publishedAt).format("MM/DD/YYYY")|| dayjs().format('MM/DD/YYYY'));
  

   let active: Record<string, boolean | number | null> = {
    bold: false,
    italic: false,
    underline: false,
    heading: null,
  };

  onMount(() => {
    editor = new Editor({
      element: document.querySelector("#editor") as HTMLElement,
      extensions: [StarterKit, 
        Dropcursor.configure({
         width: 2,
         color: '#ff0000',
}),
          FileHandler.configure({
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
        onDrop: (currentEditor, files, pos) => {
          files.forEach(file => {
            const fileReader = new FileReader()
            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
              currentEditor
                .chain()
                .insertContentAt(pos, {
                  type: 'image',
                  attrs: {
                    src: fileReader.result,
                  },
                })
                .focus()
                .run()
            }
          })
        },
        onPaste: (currentEditor, files, htmlContent) => {
          files.forEach(file => {
            if (htmlContent) {
              // if there is htmlContent, stop manual insertion & let other extensions handle insertion via inputRule
              // you could extract the pasted file from this url string and upload it to a server for example
              console.log(htmlContent) // eslint-disable-line no-console
              return false
            }

            const fileReader = new FileReader()

            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
              currentEditor
                .chain()
                .insertContentAt(currentEditor.state.selection.anchor, {
                  type: 'image',
                  attrs: {
                    src: fileReader.result,
                  },
                })
                .focus()
                .run()
            }
          })
        },
      }),
        Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      _file: {
        default: null,
        parseHTML: () => null,
        renderHTML: () => ({}),
      },
    };
  },
})
        
          
      ],
      content: article.content || "",
      onUpdate: updateActive,
      onSelectionUpdate: updateActive,
    
    });
    updateActive();
    return () => editor.destroy();
  });

  function updateActive() {
    active.bold = editor.isActive("bold");
    active.italic = editor.isActive("italic");
    active.underline = editor.isActive("underline");

    let heading = null;
    for (let i = 1; i <= 6; i++) {
      if (editor.isActive("heading", { level: i })) {
        heading = i;
        break;
      }
    }
    active.heading = heading;
  }

  function runCommand(cmd: () => void) {
    cmd();
    updateActive();
  }



    let inputEl: HTMLInputElement;

  onMount(() => {
    const today = dayjs().format("MM/DD/YYYY HH:mm:ss");
    inputEl.value = today;
    publishedAt = today;

    const picker = new Datepicker(inputEl, {
      autohide: true,
      minDate:today,
    });

    inputEl.addEventListener("changeDate", (e: any) => {
        const withTime = dayjs(e.detail.date).set("hour", dayjs().hour()).set("minute", dayjs().minute()).set("second", dayjs().second());
  publishedAt = withTime.format("YYYY-MM-DD HH:mm:ss");

   
    });
  });


  async function saveContent() { 
    const json = await uploadEditorImages(editor.getJSON(),id);

    const articleData = {
      title,
      short_description:shortDescription,
      content: json,
      category_id: selectedCategory ? parseInt(selectedCategory) : null,
      tags: articleTags,
      status,
      published_at: status === 'published' && article.status ==="draft" ? publishedAt : null,
      thumbnail_url: article.thumbnailUrl || null,
    };

    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file as Blob);
        const response = await fetch(`/api/v1/articles/${id}/upload-image`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          throw new Error('Failed to upload image');
        }
        const data = await response.json();
        articleData.thumbnail_url = data.data 
      } catch (error) {
        console.error('Error uploading image:', error);
        alert('Đã xảy ra lỗi khi tải lên ảnh đại diện.');
        return;
      }
    
    } 
    console.log(articleData);
    fetch('/api/v1/articles' + (article.id ? `/${article.id}` : ''), {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articleData),
    }).then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    }).then(data => {
      console.log('Success:', data);
      alert('Bài viết đã được lưu thành công!');
    }).catch((error) => {
      console.error('Error:', error);
      alert('Đã xảy ra lỗi khi lưu bài viết.');
    });
  }



</script>

<div class="flex">
 

<div class="flex-1">  
 
  <!-- Toolbar -->
  <div class="z-1 flex gap-2 justify-center bg-gray-200 dark:bg-gray-800 py-1 rounded sticky top-0 h-12">

    <button
      aria-label="Undo"
      onclick={() => runCommand(() => editor.chain().focus().undo().run())}
      class="px-1 py-1"
    >
      <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9h13a5 5 0 0 1 0 10H7M3 9l4-4M3 9l4 4"/>
</svg>
    </button>
      <button
        aria-label="Redo"
        onclick={() => runCommand(() => editor.chain().focus().redo().run())}
        class="px-1 py-1">
      <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 9H8a5 5 0 0 0 0 10h9m4-10-4-4m4 4-4 4"/>
</svg>
</button>


    <button
      aria-label="Bold"
      onclick={() => runCommand(() => editor.chain().focus().toggleBold().run())}
      class="text-black dark:text-white px-1 py-1 " 
      class:bg-blue-200={active.bold}
    >
    <svg class="w-6 h-6 text-black dark:text-white"  aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5h4.5a3.5 3.5 0 1 1 0 7H8m0-7v7m0-7H6m2 7h6.5a3.5 3.5 0 1 1 0 7H8m0-7v7m0 0H6"/>
</svg>

    </button>

    <button
      aria-label="Italic"
      onclick={() => runCommand(() => editor.chain().focus().toggleItalic().run())}
      class="px-1 py-1"
      class:bg-blue-200={active.italic}
      class:text-white={active.italic}
    >
      <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m8.874 19 6.143-14M6 19h6.33m-.66-14H18"/>
</svg>

    </button>

      <button
      aria-label="underline"
      onclick={() => runCommand(() => editor.chain().focus().toggleUnderline().run())}
      class="px-1 py-1"
      class:bg-blue-200={active.underline}
    >
      <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="M6 19h12M8 5v9a4 4 0 0 0 8 0V5M6 5h4m4 0h4"/>
</svg>
    </button>

    <button
      aria-label="Heading 1"
      onclick={() => runCommand(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
      class="px-1 py-1"
      class:bg-blue-200={active.heading === 1}
    >
      H1
    </button>
      <button
      aria-label="Heading 2"
      onclick={() => runCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
      class="px-1 py-1 "
      class:bg-blue-200={active.heading === 2}
    >
      H2
    </button>

         <button
      aria-label="Heading 3"
      onclick={() => runCommand(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      class="px-1 py-1 "
      class:bg-blue-200={active.heading === 3}
    >
      H3
    </button>
  

      <EditorInsertTool {editor} articleId={id} />
  </div>

  <div id="editor" class="h-[calc(100vh-48px)] format mx-auto"></div>

</div>
   <div class="flex flex-col w-lg pl-4">

    <button data-modal-target="static-modal" data-modal-toggle="static-modal" class="block text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">
  Xem xuất bản
</button>



     <div class="col-span-3 flex flex-col">

    <div class="">
      
        <AutoTextarea value={article.title} className="text-3xl font-bold" placeholder="Tiêu đề bài viết..." onChange={(e)=>{title = e} } />

               <AutoTextarea onChange={(e)=>{shortDescription= e} } value={article.shortDescription} className="text-gray-600" placeholder="Mô tả bài ngắn"/>
   


             <div class="mt-4">
  <label for="category" class="block text-sm font-medium mb-1">Danh mục</label>

           <ComboBox
            onSelect={(value) => {
              selectedCategory = value;
            }}
  options={categories.map(m => ({ label: m.name, value: m.id.toString() }))}
            selected={selectedCategory}
  placeholder="Chọn danh mục"
  className="mt-4"
/>
</div>
       
        <div> 

  <label aria-label="anh dai dien" for="" class="block text-sm font-medium mb-1 mt-4">Ảnh đại diện</label>
            <ImageUpload previewUrl={article.thumbnailUrl} onFileChange={(f)=>{file = f}}   /> 
 </div>   </div>
  </div>
  <InputTag tags={articleTags}  onChange={(v)=> {articleTags = v}}  />
  </div>
</div>


<!-- Main modal -->
<div id="static-modal" data-modal-backdrop="static" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
    <div class="relative p-4 w-full max-w-2xl max-h-full">
        <!-- Modal content -->
        <div class="relative bg-white rounded-lg shadow-sm dark:bg-gray-700">
            <!-- Modal header -->
            <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
  Xem trước và xuất bản bài viết
                </h3>
                <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="static-modal">
                    <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                    </svg>
                    <span class="sr-only">Close modal</span>
                </button>
            </div>
            <!-- Modal body -->
            <div class="p-4 md:p-5 space-y-4">

        
<form class="max-w-sm">
  <label for="countries" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Tuỳ chọn lưu và xuất bản</label>
  <select id="countries" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            onchange={(e) => {
              const value = (e.target as HTMLSelectElement).value as "draft" | "published";
              status = value;
            }}
            bind:value={status}
          >
    <option value="draft">Nháp </option>
    <option value="published">Xuất bản</option>
  </select>
</form>

        
<div class={`relative max-w-sm ${status === 'published' && article.status ==="draft" ? '' : 'hidden'}`}>
  <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
     <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
        <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
      </svg>
  </div>
  <input id="datepicker-autohide" datepicker datepicker-autohide datepicker-min-date={dayjs()} type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Select date"  bind:this={inputEl}    />
</div>         
            </div>
            <!-- Modal footer -->
            <div class="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">

                <button data-modal-hide="static-modal" type="button" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" onclick={saveContent}>Xuất bản</button>
                <button data-modal-hide="static-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Huỷ</button>
            </div>
        </div>
    </div>
</div>
<style>


</style>


