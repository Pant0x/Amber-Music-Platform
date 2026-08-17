/**
 * Shared thumbnail upgrade helper: converts low-res/watermarked artwork URLs
 * into high-quality 544px (or YouTube hqdefault) images.
 */
export const upgradeThumbnailUrl = (url: string | undefined, youtubeId?: string): string => {
  if (!url) {
    if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    return '';
  }
  if (youtubeId && (url.includes('googleusercontent.com') || url.includes('ggpht.com'))) {
    return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
  }
  if (url.includes('googleusercontent.com')) {
    return url.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj').replace(/=s\d+.*$/, '=w544-h544-l90-rj');
  }
  if (url.includes('i.ytimg.com/vi/') || url.includes('img.youtube.com/vi/')) {
    const cleanUrl = url.split('?')[0];
    return cleanUrl.replace(/\/(default|mqdefault|sddefault|hqdefault|maxresdefault)\.jpg/, '/hqdefault.jpg');
  }
  return url;
};