/**
 * Scraper Extractor Framework
 *
 * Tambahkan extractor kamu sendiri di sini.
 * Setiap extractor menerima TMDB ID dan mengembalikan sumber video + subtitle.
 *
 * PENTING: Gunakan hanya untuk konten yang kamu miliki haknya.
 */

export interface VideoSource {
  url: string;
  quality: string; // e.g. "1080p", "720p", "480p", "360p", "auto"
  type: "hls" | "mp4" | "dash";
  label?: string;
}

export interface SubtitleTrack {
  url: string;
  language: string; // e.g. "id", "en"
  label: string; // e.g. "Indonesia", "English"
  default?: boolean;
}

export interface ScraperResult {
  sources: VideoSource[];
  subtitles: SubtitleTrack[];
  headers?: Record<string, string>; // custom headers jika diperlukan
}

export type ExtractorFn = (
  tmdbId: number,
  season?: number,
  episode?: number,
) => Promise<ScraperResult | null>;

/**
 * Daftar ekstractor yang digunakan secara berurutan.
 * Jika ekstractor pertama gagal, akan coba berikutnya.
 *
 * CARA MENAMBAH EXTRACTOR:
 * 1. Buat fungsi async yang mengambil tmdbId, season?, episode?
 * 2. Return ScraperResult atau null jika gagal
 * 3. Tambahkan ke array EXTRACTORS di bawah
 */
const EXTRACTORS: ExtractorFn[] = [
  // ─── CONTOH EXTRACTOR ─────────────────────────────────────────────────────
  // Ganti dengan logika scraping kamu sendiri
  //
  // async (tmdbId, season, episode) => {
  //   const isMovie = !season;
  //   const url = isMovie
  //     ? `https://api-server-kamu.com/movie/${tmdbId}`
  //     : `https://api-server-kamu.com/tv/${tmdbId}/${season}/${episode}`;
  //
  //   const res = await fetch(url);
  //   const data = await res.json();
  //
  //   return {
  //     sources: [
  //       { url: data.streamUrl, quality: "auto", type: "hls" },
  //       { url: data.mp4720, quality: "720p", type: "mp4" },
  //       { url: data.mp4480, quality: "480p", type: "mp4" },
  //     ],
  //     subtitles: [
  //       { url: data.subId, language: "id", label: "Indonesia", default: true },
  //       { url: data.subEn, language: "en", label: "English" },
  //     ],
  //   };
  // },
  // ──────────────────────────────────────────────────────────────────────────

  // Demo: kembalikan placeholder agar player tetap jalan
  async (_tmdbId, _season, _episode) => {
    return {
      sources: [
        // Isi dengan stream URL kamu sendiri
        // Contoh:
        // { url: "https://cdn-kamu.com/stream.m3u8", quality: "auto", type: "hls" },
        // { url: "https://cdn-kamu.com/1080p.mp4",   quality: "1080p", type: "mp4" },
      ],
      subtitles: [
        // Isi dengan subtitle URL kamu sendiri
        // Contoh:
        // { url: "https://cdn-kamu.com/sub-id.vtt", language: "id", label: "Indonesia", default: true },
        // { url: "https://cdn-kamu.com/sub-en.vtt", language: "en", label: "English" },
      ],
    };
  },
];

/**
 * Jalankan semua extractor secara berurutan, kembalikan hasil pertama yang berhasil.
 */
export async function extractVideoSources(
  tmdbId: number,
  season?: number,
  episode?: number,
): Promise<ScraperResult> {
  for (const extractor of EXTRACTORS) {
    try {
      const result = await extractor(tmdbId, season, episode);
      if (result && result.sources.length > 0) {
        return result;
      }
    } catch {
      // coba extractor berikutnya
    }
  }
  return { sources: [], subtitles: [] };
}
