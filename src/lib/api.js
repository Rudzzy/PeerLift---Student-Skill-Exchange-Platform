/**
 * PeerLift API client — Axios-based with JWT interceptor.
 *
 * Base URL: /api/v1 (proxied by Vite to Flask at localhost:5000)
 * Token stored in localStorage as `peerlift_token`.
 */
import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:5000/api/v1" });

// ── Request interceptor — attach JWT ────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("peerlift_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor — handle 401 ───────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("peerlift_token");
      localStorage.removeItem("peerlift_user");
      if (!window.location.hash.includes("/login")) {
        window.location.hash = "#/login";
      }
    }
    return Promise.reject(err);
  }
);

// ── Helper — unwrap success envelope ────────────────────────────
const unwrap = (res) => res.data;

// ── Auth ────────────────────────────────────────────────────────
export const authAPI = {
  register: (body) => api.post("/auth/register", body).then(unwrap),
  login: (body) => api.post("/auth/login", body).then(unwrap),
  logout: () => api.post("/auth/logout").then(unwrap),
  me: () => api.get("/auth/me").then(unwrap),
};

// ── Users ───────────────────────────────────────────────────────
export const usersAPI = {
  list: (params) => api.get("/users", { params }).then(unwrap),
  get: (id) => api.get(`/users/${id}`).then(unwrap),
  updateMe: (body) => api.put("/users/me", body).then(unwrap),
  deleteMe: () => api.delete("/users/me").then(unwrap),
  myStats: () => api.get("/users/me/stats").then(unwrap),
  addSkill: (body) => api.post("/users/me/skills", body).then(unwrap),
  removeSkill: (id, type) =>
    api.delete(`/users/me/skills/${id}`, { params: { type } }).then(unwrap),
};

// ── Skills ──────────────────────────────────────────────────────
export const skillsAPI = {
  list: () => api.get("/skills").then(unwrap),
  create: (body) => api.post("/skills", body).then(unwrap),
  trending: () => api.get("/skills/trending").then(unwrap),
};

// ── Matches ─────────────────────────────────────────────────────
export const matchesAPI = {
  list: (params) => api.get("/matches", { params }).then(unwrap),
  open: (params) => api.get("/matches/open", { params }).then(unwrap),
  create: (body) => api.post("/matches", body).then(unwrap),
  get: (id) => api.get(`/matches/${id}`).then(unwrap),
  accept: (id) => api.put(`/matches/${id}/accept`).then(unwrap),
  reject: (id) => api.put(`/matches/${id}/reject`).then(unwrap),
  complete: (id) => api.put(`/matches/${id}/complete`).then(unwrap),
  suggestions: () => api.get("/matches/suggestions").then(unwrap),
};

// ── Posts ────────────────────────────────────────────────────────
export const postsAPI = {
  list: (params) => api.get("/posts", { params }).then(unwrap),
  create: (body) => api.post("/posts", body).then(unwrap),
  get: (id) => api.get(`/posts/${id}`).then(unwrap),
  delete: (id) => api.delete(`/posts/${id}`).then(unwrap),
  like: (id) => api.post(`/posts/${id}/like`).then(unwrap),
  report: (id) => api.post(`/posts/${id}/report`).then(unwrap),
  comments: (id) => api.get(`/posts/${id}/comments`).then(unwrap),
  addComment: (id, body) =>
    api.post(`/posts/${id}/comments`, body).then(unwrap),
  deleteComment: (postId, commentId) =>
    api.delete(`/posts/${postId}/comments/${commentId}`).then(unwrap),
};

// ── Notifications ───────────────────────────────────────────────
export const notificationsAPI = {
  list: (params) => api.get("/notifications", { params }).then(unwrap),
  markRead: (id) => api.put(`/notifications/${id}/read`).then(unwrap),
  markAllRead: () => api.put("/notifications/read-all").then(unwrap),
  delete: (id) => api.delete(`/notifications/${id}`).then(unwrap),
  unreadCount: () => api.get("/notifications/unread-count").then(unwrap),
};

// ── Messages ────────────────────────────────────────────────────
export const messagesAPI = {
  conversations: () => api.get("/messages").then(unwrap),
  thread: (matchId) => api.get(`/messages/${matchId}`).then(unwrap),
  send: (matchId, body) =>
    api.post(`/messages/${matchId}`, body).then(unwrap),
  markRead: (matchId) =>
    api.put(`/messages/${matchId}/read`).then(unwrap),
};

// ── Admin ───────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get("/admin/stats").then(unwrap),
  users: (params) => api.get("/admin/users", { params }).then(unwrap),
  banUser: (id) => api.put(`/admin/users/${id}/ban`).then(unwrap),
  unbanUser: (id) => api.put(`/admin/users/${id}/unban`).then(unwrap),
  deleteUser: (id) => api.delete(`/admin/users/${id}`).then(unwrap),
  reportedPosts: (params) =>
    api.get("/admin/posts/reported", { params }).then(unwrap),
  dismissReport: (id) =>
    api.put(`/admin/posts/${id}/dismiss`).then(unwrap),
  deletePost: (id) => api.delete(`/admin/posts/${id}`).then(unwrap),
  popularSkills: () => api.get("/admin/skills/popular").then(unwrap),
};

export default api;
