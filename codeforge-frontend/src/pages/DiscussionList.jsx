import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getPostsForProblem, createPost } from "../api/discussionApi";
import Pagination from "../components/Pagination";
import "./DiscussionList.css";

const PAGE_SIZE = 10;

export default function DiscussionList() {
  const { problemId } = useParams();

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [code, setCode] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const response = await getPostsForProblem(problemId);
      setPosts(response.data);
    } catch (err) {
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    setCurrentPage(1);
  }, [problemId]);

  const totalPages = Math.max(Math.ceil(posts.length / PAGE_SIZE), 1);
  const paginatedPosts = useMemo(
    () => posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [posts, currentPage]
  );

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setFormError("");
    setIsSaving(true);
    try {
      await createPost({
        problemId: Number(problemId),
        title,
        body,
        code: code.trim() === "" ? null : code,
      });
      setTitle("");
      setBody("");
      setCode("");
      setIsFormOpen(false);
      setCurrentPage(1);
      loadPosts();
    } catch (err) {
      setFormError(err.response?.data?.error || "Failed to create post.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="discussion-list-page">
      <div className="discussion-list-header">
        <Link to={`/problems/${problemId}`} className="btn btn-secondary">
          Back to Coding Workspace
        </Link>
        {isLoggedIn && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsFormOpen(!isFormOpen)}
          >
            {isFormOpen ? "Cancel" : "+ New Post"}
          </button>
        )}
      </div>

      <h1>Discussions</h1>

      {isFormOpen && (
        <form className="discussion-new-form" onSubmit={handleCreatePost}>
          {formError && <p className="discussion-form-error">{formError}</p>}

          <label>Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label>Body</label>
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />

          <label>Code (optional)</label>
          <textarea
            rows={4}
            className="discussion-code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste a code snippet if relevant..."
          />

          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? "Posting..." : "Post"}
          </button>
        </form>
      )}

      {isLoading && <p className="placeholder-text">Loading discussions...</p>}

      {!isLoading && posts.length === 0 && (
        <p className="placeholder-text">
          No discussions yet for this problem. Be the first to post!
        </p>
      )}

      {!isLoading &&
        paginatedPosts.map((post) => (
          <Link
            key={post.id}
            to={`/discussions/post/${post.id}`}
            className="discussion-list-item"
          >
            <div className="discussion-list-item-top">
              <h3>{post.title}</h3>
              <span className="discussion-list-upvotes">▲ {post.upvoteCount}</span>
            </div>
            <p className="discussion-list-meta">
              by {post.authorUsername} ·{" "}
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </Link>
        ))}

      {!isLoading && posts.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}