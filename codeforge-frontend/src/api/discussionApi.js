import axiosClient from "./axiosClient";

export function getPostsForProblem(problemId) {
  return axiosClient.get(`/discussions/problem/${problemId}`);
}

export function getPostById(postId) {
  return axiosClient.get(`/discussions/posts/${postId}`);
}

export function createPost(data) {
  return axiosClient.post("/discussions/posts", data);
}

export function toggleUpvote(postId) {
  return axiosClient.post(`/discussions/posts/${postId}/upvote`);
}

export function getComments(postId) {
  return axiosClient.get(`/discussions/posts/${postId}/comments`);
}

export function addComment(postId, data) {
  return axiosClient.post(`/discussions/posts/${postId}/comments`, data);
}

export function updateComment(postId, commentId, data) {
  return axiosClient.put(`/discussions/posts/${postId}/comments/${commentId}`, data);
}

export function deleteComment(postId, commentId) {
  return axiosClient.delete(`/discussions/posts/${postId}/comments/${commentId}`);
}

export function adminDeletePost(postId) {
  return axiosClient.delete(`/discussions/admin/posts/${postId}`);
}

export function adminDeleteComment(commentId) {
  return axiosClient.delete(`/discussions/admin/comments/${commentId}`);
}