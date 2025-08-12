// beaconLogout.ts
export function beaconLogout() {
  const token = localStorage.getItem('token');
  if (token) {
    // 将token作为url参数传递，避免header丢失
    const url = `http://localhost:8081/api/auth/logout?token=${encodeURIComponent(token)}`;
    navigator.sendBeacon(url);
  }
} 