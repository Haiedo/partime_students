// Tải thư viện ngoài (Google Identity Services, Facebook SDK) một lần duy nhất
const cache = {};

export function loadScript(src) {
  if (!cache[src]) {
    cache[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.defer = true;
      s.onload = resolve;
      s.onerror = () => { delete cache[src]; reject(new Error(`Không tải được ${src}`)); };
      document.head.appendChild(s);
    });
  }
  return cache[src];
}
