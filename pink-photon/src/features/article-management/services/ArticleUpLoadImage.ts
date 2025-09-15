import type { JSONContent } from "@tiptap/core";

async function uploadEditorImages(editorJSON: JSONContent, articleId: string) {
  const traverse = async (nodes: any[] = []) => {
    return Promise.all(
      nodes.map(async node => {
        if (node.type === "image" && node.attrs?._file instanceof File) {
          const formData = new FormData();
          formData.append("file", node.attrs._file);

          const res = await fetch(`/api/v1/articles/${articleId}/upload-image`, { method: "POST", body: formData });
          const data = await res.json();

          node.attrs.src = data.data;
          delete node.attrs._file;    
        }

        if (node.content) node.content = await traverse(node.content);

        return node;
      })
    );
  };

  const newContent = await traverse(editorJSON.content || []);
  return { ...editorJSON, content: newContent };
}


export { uploadEditorImages };
