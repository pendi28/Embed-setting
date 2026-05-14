export function getPosterUrl(path?: string | null, size: "w500" | "original" = "w500") {
  if (!path) return "https://via.placeholder.com/500x750?text=No+Poster";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function getBackdropUrl(path?: string | null, size: "w1280" | "original" = "original") {
  if (!path) return "https://via.placeholder.com/1280x720?text=No+Backdrop";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}
