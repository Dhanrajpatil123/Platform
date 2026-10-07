import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getPostById,
  getComments,
  addComment,
  toggleUpvote,
  updateComment,
  deleteComment,
  adminDeletePost,
  adminDeleteComment,
} from "../api/discussionApi";
import "./DiscussionThread.css";

export default function DiscussionThread() {
  const { postId } = useParams();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [newComment, setNewComment] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingBody, setEditingBody] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [postDeleted, setPostDeleted] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));
  const currentUsername = localStorage.getItem("username");
  const isAdmin = localStorage.getItem("role") === "ADMIN";

  const loadPost = async () => {
    try {
      const response = await getPostById(postId);
      setPost(response.data);
    } catch (err) {
      setLoadError("Post not found.");
    }
  };

  const loadComments = async () => {
    try {
      const response = await getComments(postId);
      setComments(response.data);
    } catch (err) {
      setComments([]);
    }
  };

  useEffect(() => {
    async function loadAll() {
      setIsLoading(true);
      setLoadError("");
      await Promise.all([loadPost(), loadComments()]);
      setIsLoading(false);
    }
    loadAll();
  }, [postId]);

  const handleUpvote = async () => {
    if (!isLoggedIn) return;
    try {
      const response = await toggleUpvote(postId);
      setPost(response.data);
    } catch (err) {
      // silently ignore
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPostingComment(true);
    try {
      await addComment(postId, { body: newComment.trim() });
      setNewComment("");
      loadComments();
    } catch (err) {
      // low-stakes failure, kept minimal
    } finally {
      setIsPostingComment(false);
    }
  };

  const startEditing = (comment) => {
    setEditingCommentId(comment.id);
    setEditingBody(comment.body);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingBody("");
  };

  const handleSaveEdit = async (commentId) => {
    if (!editingBody.trim()) return;
    setIsSavingEdit(true);
    try {
      await updateComment(postId, commentId, { body: editingBody.trim() });
      setEditingCommentId(null);
      setEditingBody("");
      loadComments();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update comment.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(postId, commentId);
      loadComments();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete comment.");
    }
  };

  const handleAdminDeleteComment = async (commentId) => {
    if (!window.confirm("Remove this comment as an admin? This cannot be undone.")) return;
    try {
      await adminDeleteComment(commentId);
      loadComments();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove comment.");
    }
  };

  const handleAdminDeletePost = async () => {
    if (
      !window.confirm(
        "Remove this ENTIRE post (and all its comments) as an admin? This cannot be undone."
      )
    )
      return;
    try {
      await adminDeletePost(postId);
      setPostDeleted(true);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove post.");
    }
  };

  if (isLoading) {
    return (
      <div className="discussion-status-page">
        <p>Loading discussion...</p>
      </div>
    );
  }

  if (postDeleted) {
    return (
      <div className="discussion-status-page">
        <p>This post has been removed.</p>
        <Link to={`/discussions/problem/${post?.problemId}`} className="btn btn-secondary">
          Back to Discussions
        </Link>
      </div>
    );
  }

  if (loadError || !post) {
    return (
      <div className="discussion-status-page">
        <p>{loadError || "Post not found."}</p>
      </div>
    );
  }

  return (
    <div className="discussion-page">
      <div className="discussion-header">
        <Link to={`/discussions/problem/${post.problemId}`} className="btn btn-secondary">
          Back to Discussions
        </Link>
        <Link to={`/problems/${post.problemId}`} className="btn btn-secondary">
          Back to Coding Workspace
        </Link>
      </div>

      <div className="discussion-post">
        <div className="discussion-post-top">
          <h1>{post.title}</h1>
          {isAdmin && (
            <button
              type="button"
              className="btn btn-danger discussion-admin-delete-btn"
              onClick={handleAdminDeletePost}
            >
              Remove Post (Admin)
            </button>
          )}
        </div>

        <div className="discussion-post-meta">
          <span className="discussion-author">{post.authorUsername}</span>
          <span className="discussion-timestamp">
            {new Date(post.createdAt).toLocaleString()}
          </span>
        </div>

        <p className={post.locked ? "discussion-body-text discussion-locked" : "discussion-body-text"}>
          {post.body}
        </p>

        {post.locked && (
          <Link to="/premium" className="btn btn-primary discussion-unlock-btn">
            Upgrade to Premium
          </Link>
        )}

        {!post.locked && post.code && (
          <pre className="discussion-code-block">
            <code>{post.code}</code>
          </pre>
        )}

        <button
          type="button"
          className={post.upvotedByMe ? "upvote-btn upvoted" : "upvote-btn"}
          onClick={handleUpvote}
          disabled={!isLoggedIn}
          title={isLoggedIn ? "" : "Sign in to upvote"}
        >
          ▲ {post.upvoteCount}
        </button>
      </div>

      <div className="discussion-comments">
        <h2>Comments ({comments.length})</h2>

        {comments.map((comment) => (
          <div key={comment.id} className="comment-card">
            <div className="comment-meta">
              <span className="discussion-author">{comment.authorUsername}</span>
              <span className="discussion-timestamp">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>

            {editingCommentId === comment.id ? (
              <div className="comment-edit-form">
                <textarea
                  value={editingBody}
                  onChange={(e) => setEditingBody(e.target.value)}
                  rows={3}
                />
                <div className="comment-edit-actions">
                  <button type="button" className="btn btn-secondary" onClick={cancelEditing}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSaveEdit(comment.id)}
                    disabled={isSavingEdit}
                  >
                    {isSavingEdit ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="comment-body">{comment.body}</p>
                <div className="comment-owner-actions">
                  {comment.authorUsername === currentUsername && (
                    <>
                      <button
                        type="button"
                        className="comment-action-link"
                        onClick={() => startEditing(comment)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="comment-action-link comment-action-delete"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                  {isAdmin && comment.authorUsername !== currentUsername && (
                    <button
                      type="button"
                      className="comment-action-link comment-action-delete"
                      onClick={() => handleAdminDeleteComment(comment.id)}
                    >
                      Remove (Admin)
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}

        {comments.length === 0 && <p className="placeholder-text">No comments yet.</p>}

        {isLoggedIn ? (
          <form className="comment-form" onSubmit={handleCommentSubmit}>
            <textarea
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
            />
            <button type="submit" className="btn btn-primary" disabled={isPostingComment}>
              {isPostingComment ? "Posting..." : "Post Comment"}
            </button>
          </form>
        ) : (
          <p className="placeholder-text">
            <Link to="/auth">Sign in</Link> to add a comment.
          </p>
        )}
      </div>
    </div>
  );
}