export const getApiUrl = (path: string): string => {
  // Try reading custom backend URL from environment, fallback to local development port
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${formattedPath}`;
};
