<script lang="ts">
  import { onMount } from "svelte";
  import type { ArticleRow } from "../mapper";
    import Modal from "./Modal.svelte";

    let articles: ArticleRow[] = $state([]);
  let loading = $state(false);
  let hasMore = $state(true);
  let page = $state(1);
  const perPage = 20;

  async function loadArticles() {
    if (loading || !hasMore) return;
    loading = true;
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate network delay
      const res = await fetch(`/api/v1/articles/mine?page=${page}&perPage=${perPage}`);
      const data = await res.json();
      const newArticles = data.data as ArticleRow[];
      articles = [...articles, ...newArticles];
      if (newArticles.length < perPage) {
        hasMore = false;
      } else {
        page += 1;
      }
    } catch (err) {
      console.error(err);
    } finally {
      loading = false;
    }
  }

  onMount(loadArticles);

  let sentinel: HTMLDivElement;
  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadArticles();
      }
    }, { threshold: 1.0 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  });



  let showModal = $state(false);
   let selectedId: string | null = $state(null);

  const handleDelete = () => {
    if (!selectedId) return;
    console.log("Delete article with ID:", selectedId);
    // fetch(`/api/v1/articles/${selectedId}`, { method: "DELETE" })
    //   .then(...)
    showModal = false;
    selectedId = null;
  };

 ;
</script>

<div>

  <div class="relative overflow-x-auto shadow-md sm:rounded-lg overflow-x-hidden">
    <div
      class="flex flex-column sm:flex-row flex-wrap space-y-4 sm:space-y-0 items-center justify-end pb-4"
    >
      <!-- <div> -->
      <!--   <button -->
      <!--     id="dropdownRadioButton" -->
      <!--     data-dropdown-toggle="dropdownRadio" -->
      <!--     class="inline-flex items-center text-gray-500 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-1.5 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-600 dark:focus:ring-gray-700" -->
      <!--     type="button" -->
      <!--   > -->
      <!--     <svg -->
      <!--       class="w-3 h-3 text-gray-500 dark:text-gray-400 me-3" -->
      <!--       aria-hidden="true" -->
      <!--       xmlns="http://www.w3.org/2000/svg" -->
      <!--       fill="currentColor" -->
      <!--       viewBox="0 0 20 20" -->
      <!--     > -->
      <!--       <path -->
      <!--         d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm3.982 13.982a1 1 0 0 1-1.414 0l-3.274-3.274A1.012 1.012 0 0 1 9 10V6a1 1 0 0 1 2 0v3.586l2.982 2.982a1 1 0 0 1 0 1.414Z" -->
      <!--       /> -->
      <!--     </svg> -->
      <!--     Last 30 days -->
      <!--     <svg -->
      <!--       class="w-2.5 h-2.5 ms-2.5" -->
      <!--       aria-hidden="true" -->
      <!--       xmlns="http://www.w3.org/2000/svg" -->
      <!--       fill="none" -->
      <!--       viewBox="0 0 10 6" -->
      <!--     > -->
      <!--       <path -->
      <!--         stroke="currentColor" -->
      <!--         stroke-linecap="round" -->
      <!--         stroke-linejoin="round" -->
      <!--         stroke-width="2" -->
      <!--         d="m1 1 4 4 4-4" -->
      <!--       /> -->
      <!--     </svg> -->
      <!--   </button> -->
      <!--   <!-- Dropdown menu --> 
      <!--   <div -->
      <!--     id="dropdownRadio" -->
      <!--     class="z-10 hidden w-48 bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600" -->
      <!--     data-popper-reference-hidden="" -->
      <!--     data-popper-escaped="" -->
      <!--     data-popper-placement="top" -->
      <!--     style="position: absolute; inset: auto auto 0px 0px; margin: 0px; transform: translate3d(522.5px, 3847.5px, 0px);" -->
      <!--   > -->
      <!--     <ul -->
      <!--       class="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200" -->
      <!--       aria-labelledby="dropdownRadioButton" -->
      <!--     > -->
      <!--       <li> -->
      <!--         <div -->
      <!--           class="flex items-center p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600" -->
      <!--         > -->
      <!--           <input -->
      <!--             id="filter-radio-example-1" -->
      <!--             type="radio" -->
      <!--             value="" -->
      <!--             name="filter-radio" -->
      <!--             class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" -->
      <!--           /> -->
      <!--           <label -->
      <!--             for="filter-radio-example-1" -->
      <!--             class="w-full ms-2 text-sm font-medium text-gray-900 rounded-sm dark:text-gray-300" -->
      <!--             >Last day</label -->
      <!--           > -->
      <!--         </div> -->
      <!--       </li> -->
      <!--       <li> -->
      <!--         <div -->
      <!--           class="flex items-center p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600" -->
      <!--         > -->
      <!--           <input -->
      <!--             checked="" -->
      <!--             id="filter-radio-example-2" -->
      <!--             type="radio" -->
      <!--             value="" -->
      <!--             name="filter-radio" -->
      <!--             class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" -->
      <!--           /> -->
      <!--           <label -->
      <!--             for="filter-radio-example-2" -->
      <!--             class="w-full ms-2 text-sm font-medium text-gray-900 rounded-sm dark:text-gray-300" -->
      <!--             >Last 7 days</label -->
      <!--           > -->
      <!--         </div> -->
      <!--       </li> -->
      <!--       <li> -->
      <!--         <div -->
      <!--           class="flex items-center p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600" -->
      <!--         > -->
      <!--           <input -->
      <!--             id="filter-radio-example-3" -->
      <!--             type="radio" -->
      <!--             value="" -->
      <!--             name="filter-radio" -->
      <!--             class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" -->
      <!--           /> -->
      <!--           <label -->
      <!--             for="filter-radio-example-3" -->
      <!--             class="w-full ms-2 text-sm font-medium text-gray-900 rounded-sm dark:text-gray-300" -->
      <!--             >Last 30 days</label -->
      <!--           > -->
      <!--         </div> -->
      <!--       </li> -->
      <!--       <li> -->
      <!--         <div -->
      <!--           class="flex items-center p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600" -->
      <!--         > -->
      <!--           <input -->
      <!--             id="filter-radio-example-4" -->
      <!--             type="radio" -->
      <!--             value="" -->
      <!--             name="filter-radio" -->
      <!--             class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" -->
      <!--           /> -->
      <!--           <label -->
      <!--             for="filter-radio-example-4" -->
      <!--             class="w-full ms-2 text-sm font-medium text-gray-900 rounded-sm dark:text-gray-300" -->
      <!--             >Last month</label -->
      <!--           > -->
      <!--         </div> -->
      <!--       </li> -->
      <!--       <li> -->
      <!--         <div -->
      <!--           class="flex items-center p-2 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600" -->
      <!--         > -->
      <!--           <input -->
      <!--             id="filter-radio-example-5" -->
      <!--             type="radio" -->
      <!--             value="" -->
      <!--             name="filter-radio" -->
      <!--             class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" -->
      <!--           /> -->
      <!--           <label -->
      <!--             for="filter-radio-example-5" -->
      <!--             class="w-full ms-2 text-sm font-medium text-gray-900 rounded-sm dark:text-gray-300" -->
      <!--             >Last year</label -->
      <!--           > -->
      <!--         </div> -->
      <!--       </li> -->
      <!--     </ul> -->
      <!--   </div> -->
      <!-- </div> -->

      <!-- <div class="relative max-w-sm"> -->
      <!--   <div -->
      <!--     class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none" -->
      <!--   > -->
      <!--     <svg -->
      <!--       class="w-4 h-4 text-gray-500 dark:text-gray-400" -->
      <!--       aria-hidden="true" -->
      <!--       xmlns="http://www.w3.org/2000/svg" -->
      <!--       fill="currentColor" -->
      <!--       viewBox="0 0 20 20" -->
      <!--     > -->
      <!--       <path -->
      <!--         d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z" -->
      <!--       /> -->
      <!--     </svg> -->
      <!--   </div> -->
      <!--   <input -->
      <!--     id="datepicker-autohide" -->
      <!--     datepicker -->
      <!--     datepicker-autohide -->
      <!--     type="text" -->
      <!--     class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" -->
      <!--     placeholder="Select date" -->
      <!--   /> -->
      <!-- </div> -->
      <!---->
      <label for="table-search" class="sr-only">Search</label>
      <div class="relative">
        <div
          class="absolute inset-y-0 left-0 rtl:inset-r-0 rtl:right-0 flex items-center ps-3 pointer-events-none"
        >
          <svg
            class="w-5 h-5 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            ><path
              fill-rule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clip-rule="evenodd"
            ></path></svg
          >
        </div>
        <input
          type="text"
          id="table-search"
          class="block p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg w-80 bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Search for items"
        />
      </div>
    </div>
    <table
      class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400"
    >
      <thead
        class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="p-4">
            <div class="flex items-center">
              <input
                id="checkbox-all-search"
                type="checkbox"
                class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label for="checkbox-all-search" class="sr-only">checkbox</label>
            </div>
          </th>
          <th scope="col" class="px-6 py-3"> Tên bài viết </th>
          <th scope="col" class="px-6 py-3"> Chủ đề </th>
          <th scope="col" class="px-6 py-3"> Thẻ bài viết </th>
          <th scope="col" class="px-6 py-3"> Ngày tạo</th>
          <th scope="col" class="px-6 py-3"> Ngày xuất bản </th>
          <th scope="col" class="px-6 py-3"> Action </th>
        </tr>
      </thead>
      <tbody>
        {#each articles as article}
          <tr
            class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            <td class="w-4 p-4">
              <div class="flex items-center">
                <input
                  id="checkbox-table-search-1"
                  type="checkbox"
                  class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label for="checkbox-table-search-1" class="sr-only"
                  >checkbox</label
                >
              </div>
            </td>
            <th
              scope="row"
              class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white"
            >
              <img
                src={article.thumbnail_url}
                alt=""
                class="w-15 h-15 me-3 object-cover inline"
              />
              {article.title}
            </th>
            <td class="px-6 py-4">
              {article.category.name}
            </td>
            <td class="px-6 py-4"> {
              article.tags.map(tag => tag.name).join(', ')
              } </td>
              <td class="px-6 py-4">
              {new Date(article.created_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4">
              {new Date(article.published_at).toLocaleDateString()}
            </td>
            <td class="px-6 py-4 flex  items-start space-x-1">
              <a
                aria-label="Edit article"
                href={`/m/${article.id.toString()}/edit`}
                class="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                >
                
                <button aria-label="Edit article" class="p-2 hover:bg-gray-200 rounded">
                <svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"/>
</svg>

                </button>
              </a
              >
                 <button   onclick={() => {
          selectedId = article.id.toString();
          showModal = true;
        }}  aria-label="Edit article" class="p-2 hover:bg-gray-200 rounded">
                <svg class="w-6 h-6 text-red-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
</svg>
                </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

<div bind:this={sentinel} class="h-12 flex items-center justify-center">
  {#if loading}
    <span class="text-gray-500">Đang tải...</span>
  {:else if !hasMore}
    <span class="text-gray-400">Hết dữ liệu</span>
  {/if}
</div>
</div>

<Modal bind:showModal>
   <div class="relative w-full max-h-full">
        <div class="relative bg-white rounded-lg dark:bg-gray-700">
            <button  onclick={() => (showModal = false)}   type="button" class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="popup-modal">
                <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span class="sr-only">Close modal</span>
            </button>
            <div class="p-4 md:p-5 text-center">
                <svg class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
                <h3 class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">Bạn chắc chắn muốn xoá?</h3>
                <button onclick={handleDelete} data-modal-hide="popup-modal" type="button" class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center">
                    Vâng, Tôi chắc chắn
                </button>
                <button onclick={() => (showModal = false)}  data-modal-hide="popup-modal" type="button" class="py-2.5 px-5 ms-3 text-sm font-medium text-gray-900 focus:outline-none bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:text-white dark:hover:bg-gray-700">Không, huỷ</button>
            </div>
        </div>
    </div>
</Modal>


