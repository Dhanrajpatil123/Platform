import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { searchPlatform } from "../api/searchApi";
import "./SearchBar.css";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef(null);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  const runSearch = useCallback(async (q) => {
    if (!q.trim()) {
      setResults(null);
      return;
    }
    setIsSearching(true);
    try {
      const response = await searchPlatform(q);
      setResults(response.data);
    } catch (err) {
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(value), 300);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const goTo = (path) => {
    setIsOpen(false);
    setQuery("");
    setResults(null);
    navigate(path);
  };

  const hasAnyResults =
    results &&
    (results.problems.length > 0 || results.courses.length > 0 || results.contests.length > 0);

  return (
    <div className="searchbar-wrapper" ref={wrapperRef}>
      <input
        type="text"
        className="searchbar-input"
        placeholder="Search problems, courses, contests..."
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && query.trim() && (
        <div className="searchbar-dropdown">
          {isSearching && <p className="searchbar-status">Searching...</p>}

          {!isSearching && !hasAnyResults && (
            <p className="searchbar-status">No results for "{query}"</p>
          )}

          {!isSearching && results && results.problems.length > 0 && (
            <div className="searchbar-section">
              <span className="searchbar-section-label">Problems</span>
              {results.problems.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="searchbar-result-row"
                  onClick={() => goTo(`/problems/${p.id}`)}
                >
                  <span>{p.title}</span>
                  <span className={`difficulty-badge difficulty-${p.difficulty.toLowerCase()}`}>
                    {p.difficulty}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!isSearching && results && results.courses.length > 0 && (
            <div className="searchbar-section">
              <span className="searchbar-section-label">Courses</span>
              {results.courses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="searchbar-result-row"
                  onClick={() => goTo(`/courses/${c.id}`)}
                >
                  <span>{c.title}</span>
                </button>
              ))}
            </div>
          )}

          {!isSearching && results && results.contests.length > 0 && (
            <div className="searchbar-section">
              <span className="searchbar-section-label">Contests</span>
              {results.contests.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="searchbar-result-row"
                  onClick={() => goTo(`/contests/${c.id}`)}
                >
                  <span>{c.title}</span>
                  <span className="searchbar-contest-status">{c.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}