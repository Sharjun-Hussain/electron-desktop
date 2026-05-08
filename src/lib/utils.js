import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const getImageUrl = (path) => {
  if (!path) return null;
  const pathStr = path.toString();
  if (pathStr.startsWith("http://") || pathStr.startsWith("https://") || pathStr.startsWith("blob:")) return pathStr;
  
  // Clean the base URL: remove /api/v1 or /api and ensure no trailing slash
  let base = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";
  base = base.replace(/\/api\/v1\/?$/, "").replace(/\/api\/?$/, "").replace(/\/$/, "");
  
  // Clean the path: ensure no leading slash and fix backslashes
  const cleanPath = pathStr.replace(/\\/g, "/").replace(/^\//, "");
  
  return `${base}/${cleanPath}`;
};



export const swrFetcher = async ([url, token]) => {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `HTTP error! status: ${response.status}`);
  }

  if (data.success === true && Array.isArray(data.data)) {
    return data.data; 
  }


  if (data.status === "success" && data.data && Array.isArray(data.data.data)) {
    return data.data.data.filter((item) => item.is_active);
  }

  if (data.status === "success") {
    return data.data;
  }

  throw new Error(data.message || "Unknown or unhandled API response structure.");
};