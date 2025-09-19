<script>
  import { cn } from "@/utils/cn";

  export let src = null;
  export let alt = "";
  export let className = "";

  const fallback = "https://placehold.co/600x400/png?text=Error+Image";

  let currentSrc = src || fallback;

  const handleError = (e) => {
    if (e.target.src !== fallback) {
      e.target.src = fallback;
    }
  };
</script>

<img
  src={currentSrc}
  alt={alt}
  on:error={handleError}
  loading="lazy"
  class={cn("object-cover w-full h-full rounded-lg", className)}
/>

