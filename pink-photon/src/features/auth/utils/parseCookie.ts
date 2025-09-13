const parseCookie = (cookieHeader: string | null) => {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split("; ").map((c) => {
      const [key, value] = c.split("=");
      return [key, value];
    }),
  );
};
export { parseCookie };
