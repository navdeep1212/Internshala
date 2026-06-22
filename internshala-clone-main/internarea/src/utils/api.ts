export const getBackendBaseUrl = (): string => {
  let baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (typeof window !== "undefined") {
    // Allows setting API URL directly in localStorage for quick debugging or runtime configurations
    const localUrl = localStorage.getItem("NEXT_PUBLIC_API_URL");
    if (localUrl) {
      baseUrl = localUrl;
    }
  }

  if (baseUrl) {
    let base = baseUrl.trim();
    if (base.endsWith("/api")) {
      base = base.substring(0, base.length - 4);
    } else if (base.endsWith("/api/")) {
      base = base.substring(0, base.length - 5);
    }
    if (base.endsWith("/")) {
      base = base.substring(0, base.length - 1);
    }
    return base;
  }

  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    // If hosted and no API URL is configured, fallback to the known hosted Render backend URL
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return "https://internshala-1-uz4r.onrender.com";
    }
  }

  return "http://localhost:5000";
};

export const getApiUrl = (path: string): string => {
  const base = getBackendBaseUrl();
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}/api${formattedPath}`;
};

