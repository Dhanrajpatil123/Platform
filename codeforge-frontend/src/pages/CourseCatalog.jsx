// import { useState, useMemo, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { getAllCourses } from "../api/courseApi";
// import { getMyEnrollments } from "../api/enrollmentApi";
// import Pagination from "../components/Pagination";
// import "./CourseCatalog.css";

// const PAGE_SIZE = 9;

// export default function CourseCatalog() {
//   const [courses, setCourses] = useState([]);
//   const [enrollments, setEnrollments] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [categoryFilter, setCategoryFilter] = useState("All");
//   const [currentPage, setCurrentPage] = useState(1);

//   const isLoggedIn = Boolean(localStorage.getItem("token"));

//   useEffect(() => {
//     async function fetchData() {
//       try {
//         const coursesResponse = await getAllCourses();
//         setCourses(coursesResponse.data);

//         if (isLoggedIn) {
//           const enrollmentsResponse = await getMyEnrollments();
//           setEnrollments(enrollmentsResponse.data);
//         }
//       } catch (err) {
//         setError("Failed to load courses. Please try again.");
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     fetchData();
//   }, [isLoggedIn]);

//   const enrollmentMap = useMemo(() => {
//     const map = new Map();
//     enrollments.forEach((e) => map.set(e.courseId, e));
//     return map;
//   }, [enrollments]);

//   const categoryOptions = useMemo(() => {
//     const unique = new Set(courses.map((c) => c.category));
//     return ["All", ...unique];
//   }, [courses]);

//   const filteredCourses = useMemo(() => {
//     return courses.filter((course) => {
//       const matchesSearch = course.title
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase());
//       const matchesCategory =
//         categoryFilter === "All" || course.category === categoryFilter;
//       return matchesSearch && matchesCategory;
//     });
//   }, [courses, searchTerm, categoryFilter]);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, categoryFilter]);

//   const totalPages = Math.max(Math.ceil(filteredCourses.length / PAGE_SIZE), 1);
//   const paginatedCourses = filteredCourses.slice(
//     (currentPage - 1) * PAGE_SIZE,
//     currentPage * PAGE_SIZE
//   );

//   return (
//     <div className="course-catalog-page">
//       <div className="course-catalog-header">
//         <h1>Courses & Learning Tracks</h1>
//         <div className="course-catalog-header-links">
//           <Link to="/problems" className="btn btn-secondary">
//             Browse Problems
//           </Link>
//           <Link to="/dashboard" className="btn btn-secondary">
//             Dashboard
//           </Link>
//         </div>
//       </div>

//       <div className="course-catalog-filters">
//         <input
//           type="text"
//           placeholder="Search courses..."
//           value={searchTerm}
//           onChange={(e) => setSearchTerm(e.target.value)}
//           className="course-search"
//         />
//         <select
//           value={categoryFilter}
//           onChange={(e) => setCategoryFilter(e.target.value)}
//         >
//           {categoryOptions.map((opt) => (
//             <option key={opt} value={opt}>
//               {opt === "All" ? "All Categories" : opt}
//             </option>
//           ))}
//         </select>
//       </div>

//       {isLoading && <p className="course-status-text">Loading courses...</p>}
//       {error && <p className="course-status-text course-error">{error}</p>}

//       {!isLoading && !error && (
//         <>
//           <div className="course-grid">
//             {paginatedCourses.map((course) => {
//               const enrollment = enrollmentMap.get(course.id);

//               return (
//                 <Link
//                   key={course.id}
//                   to={`/courses/${course.id}`}
//                   className="course-card"
//                 >
//                   <div className="course-card-top">
//                     <span
//                       className={`difficulty-badge difficulty-${course.difficulty.toLowerCase()}`}
//                     >
//                       {course.difficulty}
//                     </span>
//                     {course.premium && <span className="premium-chip">★ Premium</span>}
//                     {enrollment && (
//                       <span className="enrolled-badge">Enrolled</span>
//                     )}
//                   </div>

//                   <h3>{course.title}</h3>
//                   <p className="course-meta">
//                     {course.category} · {course.problemCount} problems ·{" "}
//                     {course.estimatedHours} hrs · {course.enrolledCount} enrolled
//                   </p>

//                   {enrollment && (
//                     <div className="progress-bar">
//                       <div
//                         className="progress-bar-fill"
//                         style={{ width: `${enrollment.progressPercent}%` }}
//                       />
//                     </div>
//                   )}
//                 </Link>
//               );
//             })}

//             {filteredCourses.length === 0 && (
//               <p className="course-catalog-empty">
//                 No courses match your filters.
//               </p>
//             )}
//           </div>

//           <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             onPageChange={setCurrentPage}
//           />
//         </>
//       )}
//     </div>
//   );
// }


import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import "./CourseCatalog.css";

const PAGE_SIZE = 9;

export default function CourseCatalog() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [accessFilter, setAccessFilter] = useState("All");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        const response = await axiosClient.get("/courses");
        setCourses(response.data);
      } catch (err) {
        setLoadError("Failed to load courses.");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.category || "").toLowerCase().includes(search.toLowerCase());
      const matchesDifficulty = difficultyFilter === "All" || c.difficulty === difficultyFilter;
      const matchesAccess =
        accessFilter === "All" ||
        (accessFilter === "Free" && !c.premium) ||
        (accessFilter === "Premium" && c.premium);
      return matchesSearch && matchesDifficulty && matchesAccess;
    });
  }, [courses, search, difficultyFilter, accessFilter]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const safePage = Math.min(page, totalPages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="cc-page">
      <div className="cc-header">
        <div>
          <h1>Courses</h1>
          <p className="cc-subtitle">Structured learning tracks — enroll, solve in order, track your progress.</p>
        </div>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="cc-filters">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={difficultyFilter}
          onChange={(e) => {
            setDifficultyFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">All Levels</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
        <select
          value={accessFilter}
          onChange={(e) => {
            setAccessFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="All">Free &amp; Premium</option>
          <option value="Free">Free only</option>
          <option value="Premium">Premium only</option>
        </select>
      </div>

      {isLoading && <p className="placeholder-text">Loading courses...</p>}
      {loadError && <p className="cc-error">{loadError}</p>}
      {!isLoading && !loadError && filtered.length === 0 && (
        <p className="placeholder-text">No courses match your filters.</p>
      )}

      <div className="cc-grid">
        {visible.map((c) => (
          <Link key={c.id} to={`/courses/${c.id}`} className="cc-card">
            <div className="cc-card-top">
              <span className={`difficulty-badge difficulty-${c.difficulty.toLowerCase()}`}>
                {c.difficulty}
              </span>
              {c.premium ? (
                <span className="premium-chip">★ Premium</span>
              ) : (
                <span className="free-chip">Free</span>
              )}
            </div>

            <h3>{c.title}</h3>
            <p className="cc-category">{c.category}</p>

            <div className="cc-meta-row">
              <span>📋 {c.problemCount} problems</span>
              <span>⏱ ~{c.estimatedHours} hrs</span>
            </div>
            <div className="cc-meta-row">
              <span>👥 {c.enrolledCount} enrolled</span>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="cc-pagination">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={safePage === 1}
            onClick={() => setPage(safePage - 1)}
          >
            ← Prev
          </button>
          <span>
            Page {safePage} of {totalPages}
          </span>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={safePage === totalPages}
            onClick={() => setPage(safePage + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}