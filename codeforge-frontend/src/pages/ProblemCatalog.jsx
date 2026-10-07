import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllProblems } from "../api/problemApi";
import { getSolvedProblemIds } from "../api/submissionApi";
import Pagination from "../components/Pagination";
import "./ProblemCatalog.css";

const difficultyOptions = ["All", "Easy", "Medium", "Hard"];
const PAGE_SIZE = 10;

export default function ProblemCatalog() {
  const [problems, setProblems] = useState([]);
  const [solvedIds, setSolvedIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [tagFilter, setTagFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);

  const isLoggedIn = Boolean(localStorage.getItem("token"));

  useEffect(() => {
    async function fetchData() {
      try {
        const problemsResponse = await getAllProblems();
        setProblems(problemsResponse.data);

        if (isLoggedIn) {
          const solvedResponse = await getSolvedProblemIds();
          setSolvedIds(new Set(solvedResponse.data));
        }
      } catch (err) {
        setError("Failed to load problems. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [isLoggedIn]);

  const categoryOptions = useMemo(() => {
    const unique = new Set(problems.map((p) => p.category));
    return ["All", ...unique];
  }, [problems]);

  const tagOptions = useMemo(() => {
    const unique = new Set(problems.flatMap((p) => p.tags || []));
    return ["All", ...unique];
  }, [problems]);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesSearch = problem.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesDifficulty =
        difficultyFilter === "All" ||
        problem.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
      const matchesCategory =
        categoryFilter === "All" || problem.category === categoryFilter;
      const matchesTag =
        tagFilter === "All" || (problem.tags && problem.tags.includes(tagFilter));
      return matchesSearch && matchesDifficulty && matchesCategory && matchesTag;
    });
  }, [problems, searchTerm, difficultyFilter, categoryFilter, tagFilter]);

  // Reset to page 1 whenever filters change, so you're never stuck on an
  // out-of-range page after narrowing the results
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, difficultyFilter, categoryFilter, tagFilter]);

  const totalPages = Math.max(Math.ceil(filteredProblems.length / PAGE_SIZE), 1);
  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <h1>Problem Catalog</h1>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="catalog-filters">
        <input
          type="text"
          placeholder="Search problems..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="catalog-search"
        />

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
        >
          {difficultyOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "All" ? "All Difficulties" : opt}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categoryOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "All" ? "All Categories" : opt}
            </option>
          ))}
        </select>

        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          {tagOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt === "All" ? "All Tags" : opt}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p className="catalog-status-text">Loading problems...</p>}
      {error && <p className="catalog-status-text catalog-error">{error}</p>}

      {!isLoading && !error && (
        <>
          <table className="catalog-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Category</th>
                <th>Tags</th>
                <th>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProblems.map((problem) => (
                <tr key={problem.id}>
                  <td>
                    <span
                      className={
                        solvedIds.has(problem.id)
                          ? "solved-dot solved"
                          : "solved-dot"
                      }
                      title={solvedIds.has(problem.id) ? "Solved" : "Not solved yet"}
                    />
                  </td>


                  <td>
                    <Link to={`/problems/${problem.id}`} className="problem-link">
                      {problem.title}
                    </Link>
                    {problem.premium && (
                      <span
                        className={
                          problem.locked
                            ? "premium-chip premium-chip-locked"
                            : "premium-chip"
                        }
                        title={
                          problem.locked
                            ? "Premium problem: upgrade to unlock"
                            : "Premium problem"
                        }
                      >
                        {problem.locked ? "🔒" : "★"} Premium
                      </span>
                    )}
                  </td>

                   

                  <td className="catalog-category">{problem.category}</td>
                  <td className="catalog-tags">
                    {problem.tags &&
                      problem.tags.map((tag) => (
                        <span key={tag} className="tag-chip">
                          {tag}
                        </span>
                      ))}
                  </td>
                  <td>
                    <span
                      className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}
                    >
                      {problem.difficulty}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredProblems.length === 0 && (
                <tr>
                  <td colSpan={5} className="catalog-empty">
                    No problems match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}