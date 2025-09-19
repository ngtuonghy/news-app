import { uploadFileFromForm } from "@/utils/s3";
import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request, params, locals }) => {
	const articleId = params.id;
	const formData = await request.formData();
	const file = formData.get("file") as File;
    const user = locals.user;

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

	if (!articleId) {
		return new Response(JSON.stringify({ error: "Missing article ID" }), {
			status: 400,
		});
	}

	if (!file || file.size === 0) {
		return new Response(JSON.stringify({ error: "Missing file" }), {
			status: 400,
		});
	}
	const ext = file.name.split(".").pop();
	const objectName = `${articleId}/${Date.now()}.${ext}`;

	const result = await uploadFileFromForm(file, objectName, "articles");

	if (!result) {
		return new Response(JSON.stringify({ error: "Upload failed" }), {
			status: 500,
		});
	}

	return new Response(JSON.stringify({
    data: result,
    message: "Upload successful",
    status: "success",
  }), { status: 200 });
};
