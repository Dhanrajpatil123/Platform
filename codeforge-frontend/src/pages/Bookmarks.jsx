import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyBookmarks } from "../api/bookmarkApi";
import "./Bookmarks.css";

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const response = await getMyBookmarks();
        setBookmarks(response.data);
      } catch (err) {
        setBookmarks([]);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="bookmarks-page">
      <div className="catalog-header">
        <h1>My Bookmarks</h1>
        <Link to="/problems" className="btn btn-secondary">
          Back to Problem Catalog
        </Link>
      </div>

      {isLoading && <p className="placeholder-text">Loading...</p>}
      {!isLoading && bookmarks.length === 0 && (
        <p className="placeholder-text">
          No bookmarks yet — open a problem and click "☆ Save" to add one.
        </p>
      )}

      {!isLoading && bookmarks.length > 0 && (
        <table className="catalog-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Difficulty</th>
            </tr>
          </thead>
          <tbody>
            {bookmarks.map((b) => (
              <tr key={b.id}>
                <td>
                  <Link to={`/problems/${b.id}`} className="problem-link">
                    {b.title}
                  </Link>
                </td>
                <td className="catalog-category">{b.category}</td>
                <td>
                  <span className={`difficulty-badge difficulty-${b.difficulty.toLowerCase()}`}>
                    {b.difficulty}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}