// import Editor from "@monaco-editor/react";
// import { useState, useRef, useCallback, useEffect, useMemo, Fragment } from "react";
// import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
// import { getProblemById, getAllProblems } from "../api/problemApi";
// import { createSubmission, getMySubmissionsForProblem } from "../api/submissionApi";
// import { runCode } from "../api/runApi";
// import { getContestById, getContestAttempt, endContestAttempt } from "../api/contestApi";
// import { getCourseById } from "../api/courseApi";
// import { toggleBookmark } from "../api/bookmarkApi";
// import PremiumLock from "../components/PremiumLock";
// import ContestFloatingTimer from "../components/ContestFloatingTimer";
// import ContestWarningModal from "../components/ContestWarningModal";
// import useContestLockdown from "../hooks/useContestLockdown";
// import "./CodingWorkspace.css";

// const languageStarters = {
//   Java: `import java.util.*;

// public class Solution {
//     public static void main(String[] args) {
//         Scanner sc = new Scanner(System.in);
//         // Read input using sc.nextInt(), sc.next(), sc.nextLine() as needed
//         // Write your solution here

//     }
// }`,
//   Python: `import sys

// def main():
//     data = sys.stdin.read().split()
//     # Parse tokens from 'data' as needed
//     # Write your solution here
//     pass

// if __name__ == "__main__":
//     main()`,
//   JavaScript: `const readline = require('readline');
// const rl = readline.createInterface({ input: process.stdin });
// let lines = [];

// rl.on('line', (line) => lines.push(line));
// rl.on('close', () => {
//     // 'lines' now holds each line of input as a string
//     // Write your solution here

// });`,
//   C: `#include <stdio.h>

// int main() {
//     // Read input using scanf as needed
//     // Write your solution here

//     return 0;
// }`,
//   "C++": `#include <bits/stdc++.h>
// using namespace std;

// int main() {
//     // Read input using cin as needed
//     // Write your solution here

//     return 0;
// }`,
// };

// const monacoLanguageMap = {
//   Java: "java",
//   Python: "python",
//   JavaScript: "javascript",
//   C: "c",
//   "C++": "cpp",
// };

// const draftKey = (problemId, language, contestId) => {
//   const username = localStorage.getItem("username") || "guest";
//   const contestPart = contestId ? `contest-${contestId}-` : "";
//   return `codeforge-draft-${username}-${contestPart}${problemId}-${language}`;
// };

// const loadDraft = (problemId, language, contestId) =>
//   localStorage.getItem(draftKey(problemId, language, contestId)) ?? languageStarters[language];

// export default function CodingWorkspace() {
//   const { problemId } = useParams();
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const courseIdParam = searchParams.get("course");

//   const [problem, setProblem] = useState(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [loadError, setLoadError] = useState("");

//   const [allProblemIds, setAllProblemIds] = useState([]);
//   const [isLoadingNavList, setIsLoadingNavList] = useState(true);
//   const [contestProblemIds, setContestProblemIds] = useState(null);
//   const [contestStatus, setContestStatus] = useState(null);
//   const [courseProblemIds, setCourseProblemIds] = useState(null);
//   const [courseTitle, setCourseTitle] = useState(null);

//   const [activeTab, setActiveTab] = useState("description");
//   const [language, setLanguage] = useState("Java");
//   const [code, setCode] = useState(() => loadDraft(problemId, "Java", null));
//   const [customInput, setCustomInput] = useState("");
//   const [output, setOutput] = useState(null);
//   const [isRunning, setIsRunning] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [submissions, setSubmissions] = useState([]);
//   const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
//   const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

//   const [leftWidth, setLeftWidth] = useState(45);
//   const containerRef = useRef(null);
//   const isDragging = useRef(false);

//   const [isFullscreen, setIsFullscreen] = useState(false);
//   const [editorTheme, setEditorTheme] = useState(
//     () => localStorage.getItem("codeforge-editor-theme") || "vs-dark"
//   );

//   const [contestAttempt, setContestAttempt] = useState(null);
//   const [isEndingContest, setIsEndingContest] = useState(false);

//   const [isBookmarked, setIsBookmarked] = useState(false);
//   const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

//   useEffect(() => {
//     async function fetchProblem() {
//       setIsLoading(true);
//       setLoadError("");
//       try {
//         const response = await getProblemById(problemId);
//         setProblem(response.data);
//         setIsBookmarked(Boolean(response.data.bookmarked));
//         setCode(loadDraft(problemId, language, response.data.contestId));

//         if (response.data.contestId) {
//           try {
//             const contestResponse = await getContestById(response.data.contestId);
//             setContestStatus(contestResponse.data.status);
//             setContestProblemIds(contestResponse.data.problems.map((p) => p.id));

//             if (contestResponse.data.registered) {
//               const attemptResponse = await getContestAttempt(response.data.contestId);
//               setContestAttempt(attemptResponse.data);
//             } else {
//               setContestAttempt(null);
//             }
//           } catch (err) {
//             setContestStatus(null);
//             setContestProblemIds(null);
//             setContestAttempt(null);
//           }
//         } else {
//           setContestStatus(null);
//           setContestProblemIds(null);
//           setContestAttempt(null);
//         }

//         // A problem not linked to a contest can still be opened in the
//         // context of a course's syllabus (via ?course=<id> in the URL),
//         // so Previous/Next can step through that course's problems in order.
//         if (!response.data.contestId && courseIdParam) {
//           try {
//             const courseResponse = await getCourseById(courseIdParam);
//             setCourseTitle(courseResponse.data.title);
//             setCourseProblemIds(
//               courseResponse.data.syllabus
//                 .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
//                 .map((item) => item.problemId)
//             );
//           } catch (err) {
//             setCourseTitle(null);
//             setCourseProblemIds(null);
//           }
//         } else {
//           setCourseTitle(null);
//           setCourseProblemIds(null);
//         }
//       } catch (err) {
//         setLoadError("Problem not found.");
//       } finally {
//         setIsLoading(false);
//       }
//     }
//     fetchProblem();

//     setCustomInput("");
//     setSubmissions([]);
//     setSubmissionsLoaded(false);
//     setExpandedSubmissionId(null);
//     setOutput(null);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [problemId, courseIdParam]);

//   useEffect(() => {
//     async function fetchAllIds() {
//       setIsLoadingNavList(true);
//       try {
//         const response = await getAllProblems();
//         const ids = response.data.map((p) => p.id).sort((a, b) => a - b);
//         setAllProblemIds(ids);
//       } catch (err) {
//         setAllProblemIds([]);
//       } finally {
//         setIsLoadingNavList(false);
//       }
//     }
//     fetchAllIds();
//   }, []);

//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === "Escape" && isFullscreen) {
//         setIsFullscreen(false);
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [isFullscreen]);

//   // Priority: contest problems (if this problem belongs to a live contest
//   // attempt) > course syllabus (if opened via ?course=) > the full global
//   // catalog as the default fallback.
//   const navigationIds = contestProblemIds || courseProblemIds || allProblemIds;
//   const currentIndex = useMemo(
//     () => navigationIds.indexOf(Number(problemId)),
//     [navigationIds, problemId]
//   );
//   const previousProblemId = currentIndex > 0 ? navigationIds[currentIndex - 1] : null;
//   const nextProblemId =
//     currentIndex >= 0 && currentIndex < navigationIds.length - 1
//       ? navigationIds[currentIndex + 1]
//       : null;

//   const isNavListReady =
//     contestProblemIds !== null || courseProblemIds !== null || !isLoadingNavList;

//   const loadSubmissions = async () => {
//     try {
//       const response = await getMySubmissionsForProblem(problemId);
//       setSubmissions(response.data);
//     } catch (err) {
//       setSubmissions([]);
//     } finally {
//       setSubmissionsLoaded(true);
//     }
//   };

//   const handleTabClick = (tab) => {
//     setActiveTab(tab);
//     if (tab === "submissions" && !submissionsLoaded) {
//       loadSubmissions();
//     }
//   };

//   const handleMouseDown = () => {
//     isDragging.current = true;
//   };

//   const handleMouseUp = useCallback(() => {
//     isDragging.current = false;
//   }, []);

//   const handleMouseMove = useCallback((e) => {
//     if (!isDragging.current || !containerRef.current) return;
//     const containerRect = containerRef.current.getBoundingClientRect();
//     const newLeftWidth =
//       ((e.clientX - containerRect.left) / containerRect.width) * 100;
//     if (newLeftWidth > 25 && newLeftWidth < 75) {
//       setLeftWidth(newLeftWidth);
//     }
//   }, []);

//   const handleLanguageChange = (e) => {
//     const newLang = e.target.value;
//     setLanguage(newLang);
//     setCode(loadDraft(problemId, newLang, problem?.contestId));
//   };

//   const handleCodeChange = (value) => {
//     const newCode = value ?? "";
//     setCode(newCode);
//     localStorage.setItem(draftKey(problemId, language, problem?.contestId), newCode);
//   };

//   const handleResetCode = () => {
//     if (
//       !window.confirm(
//         "Reset to the starter code? Your current code for this language will be lost."
//       )
//     ) {
//       return;
//     }
//     localStorage.removeItem(draftKey(problemId, language, problem?.contestId));
//     setCode(languageStarters[language]);
//   };

//   const handleThemeToggle = () => {
//     const newTheme = editorTheme === "vs-dark" ? "light" : "vs-dark";
//     setEditorTheme(newTheme);
//     localStorage.setItem("codeforge-editor-theme", newTheme);
//   };

//   const handleToggleBookmark = async () => {
//     setIsTogglingBookmark(true);
//     try {
//       const response = await toggleBookmark(problemId);
//       setIsBookmarked(response.data.bookmarked);
//     } catch (err) {
//       // low-stakes — ignore
//     } finally {
//       setIsTogglingBookmark(false);
//     }
//   };

//   const handleRun = async () => {
//     setIsRunning(true);
//     setOutput(null);
//     try {
//       const response = await runCode({
//         code,
//         language,
//         stdin: customInput,
//         problemId: Number(problemId),
//       });
//       const result = response.data;
//       setOutput({
//         isSubmission: false,
//         status: result.success ? "Success" : "Error",
//         result: result.success ? result.output || "(no output)" : result.error,
//         runtime: "—",
//       });
//     } catch (err) {
//       setOutput({
//         isSubmission: false,
//         status: "Error",
//         result: err.response?.data?.error || "Failed to run code.",
//         runtime: "—",
//       });
//     } finally {
//       setIsRunning(false);
//     }
//   };

//   const handleSubmit = async () => {
//     setIsSubmitting(true);
//     setOutput(null);
//     try {
//       const response = await createSubmission({
//         problemId: Number(problemId),
//         code,
//         language,
//       });
//       const result = response.data;

//       const statusLabels = {
//         ACCEPTED: "Accepted",
//         WRONG_ANSWER: "Wrong Answer",
//         COMPILE_ERROR: "Compile Error",
//         RUNTIME_ERROR: "Runtime Error",
//         TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
//       };

//       setOutput({
//         isSubmission: true,
//         status: statusLabels[result.status] || result.status,
//         passedTestCases: result.passedTestCases,
//         totalTestCases: result.totalTestCases,
//         executionTimeMs: result.executionTimeMs,
//         beatsPercentage: result.beatsPercentage,
//       });

//       setSubmissionsLoaded(false);
//       if (activeTab === "submissions") {
//         loadSubmissions();
//       }
//     } catch (err) {
//       setOutput({
//         isSubmission: false,
//         status: "Error",
//         result: err.response?.data?.error || "Submission failed. Please try again.",
//         runtime: "—",
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const goToProblem = (id) => {
//     if (!id) return;
//     // Preserve course context across Next/Previous so the navigation list
//     // stays scoped to that course's syllabus the whole way through.
//     const suffix = courseProblemIds ? `?course=${courseIdParam}` : "";
//     navigate(`/problems/${id}${suffix}`);
//   };

//   const handleContestExpire = useCallback(async () => {
//     if (!problem?.contestId) return;
//     try {
//       await endContestAttempt(problem.contestId);
//     } catch (err) {
//       // server finalizes independently regardless
//     }
//     navigate(`/contests/${problem.contestId}`);
//   }, [problem, navigate]);

//   const handleEndContestFromWorkspace = useCallback(async () => {
//     if (!problem?.contestId) return;
//     setIsEndingContest(true);
//     try {
//       await endContestAttempt(problem.contestId);
//     } catch (err) {
//       // the contest page will show the correct state regardless
//     } finally {
//       setIsEndingContest(false);
//       navigate(`/contests/${problem.contestId}`);
//     }
//   }, [problem, navigate]);

//   const isAttemptActive = Boolean(contestAttempt && contestAttempt.status === "IN_PROGRESS");
//   const { warningState, showResumeModal, resumeFullscreen } = useContestLockdown({
//     contestId: problem?.contestId,
//     isActive: isAttemptActive,
//     onEnded: handleContestExpire,
//   });

//   const hideSubmissionsTab = Boolean(problem?.contestId) && contestStatus !== "ENDED";

//   if (isLoading) {
//     return (
//       <div className="workspace-status-page">
//         <p>Loading problem...</p>
//       </div>
//     );
//   }

//   if (loadError || !problem) {
//     return (
//       <div className="workspace-status-page">
//         <p>{loadError || "Problem not found."}</p>
//         <Link to="/problems" className="btn btn-secondary">
//           Back to Problem Catalog
//         </Link>
//       </div>
//     );
//   }

//   if (problem.locked) {
//     return <PremiumLock problem={problem} />;
//   }

//   const floatingTimer = isAttemptActive ? (
//     <ContestFloatingTimer
//       deadline={contestAttempt.deadline}
//       onExpire={handleContestExpire}
//       onEndContest={handleEndContestFromWorkspace}
//       isEnding={isEndingContest}
//     />
//   ) : null;

//   const editorPane = (
//     <div
//       className={
//         isFullscreen ? "workspace-right workspace-right-fullscreen" : "workspace-right"
//       }
//       style={isFullscreen ? {} : { width: `${100 - leftWidth}%` }}
//     >
//       <div className="editor-toolbar">
//         <div className="editor-toolbar-left">
//           <select value={language} onChange={handleLanguageChange}>
//             {Object.keys(languageStarters).map((lang) => (
//               <option key={lang} value={lang}>
//                 {lang}
//               </option>
//             ))}
//           </select>

//           <button
//             type="button"
//             className="editor-icon-btn"
//             onClick={handleThemeToggle}
//             title="Toggle editor theme"
//           >
//             {editorTheme === "vs-dark" ? "☀ Light" : "🌙 Dark"}
//           </button>

//           <button
//             type="button"
//             className="editor-icon-btn"
//             onClick={handleResetCode}
//             title="Reset to starter code"
//           >
//             ↺ Reset
//           </button>

//           <button
//             type="button"
//             className="editor-icon-btn"
//             onClick={() => setIsFullscreen(!isFullscreen)}
//             title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen editor"}
//           >
//             {isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen"}
//           </button>
//         </div>

//         <div className="editor-toolbar-actions">
//           <button
//             type="button"
//             className="btn btn-secondary"
//             onClick={handleRun}
//             disabled={isRunning || isSubmitting}
//           >
//             {isRunning ? "Running..." : "Run"}
//           </button>
//           <button
//             type="button"
//             className="btn btn-primary"
//             onClick={handleSubmit}
//             disabled={isRunning || isSubmitting}
//           >
//             {isSubmitting ? "Submitting..." : "Submit"}
//           </button>
//         </div>
//       </div>

//       <div className="code-editor-wrapper">
//         <Editor
//           height="100%"
//           language={monacoLanguageMap[language]}
//           value={code}
//           onChange={handleCodeChange}
//           theme={editorTheme}
//           options={{
//             fontSize: 14,
//             fontFamily: "Fira Code, monospace",
//             minimap: { enabled: false },
//             scrollBeyondLastLine: false,
//             automaticLayout: true,
//             tabSize: 4,
//           }}
//         />
//       </div>

//       <div className="editor-custom-input">
//         <div className="editor-output-heading">Custom Input (for Run only)</div>
//         <textarea
//           className="custom-input-box"
//           value={customInput}
//           onChange={(e) => setCustomInput(e.target.value)}
//           placeholder="Type input here to test with Run..."
//           rows={3}
//         />
//       </div>

//       <div className="editor-output">
//         <div className="editor-output-heading">Output</div>

//         {output === null && !isRunning && !isSubmitting && (
//           <p className="ws-placeholder-text">Run your code to see output here.</p>
//         )}
//         {(isRunning || isSubmitting) && (
//           <p className="ws-placeholder-text">Executing...</p>
//         )}

//         {output && output.isSubmission && (
//           <div
//             className={
//               output.status === "Accepted"
//                 ? "output-result output-success"
//                 : "output-result output-failure"
//             }
//           >
//             <div className="submit-result-status">
//               <strong>{output.status}</strong>
//               {output.status === "Accepted" && output.beatsPercentage !== null && (
//                 <span className="beats-text">
//                   Faster than {output.beatsPercentage}% of {language} submissions
//                 </span>
//               )}
//             </div>

//             <div className="testcase-bar-wrapper">
//               <div className="testcase-bar">
//                 <div
//                   className="testcase-bar-fill"
//                   style={{
//                     width: `${
//                       output.totalTestCases > 0
//                         ? (output.passedTestCases / output.totalTestCases) * 100
//                         : 0
//                     }%`,
//                   }}
//                 />
//               </div>
//               <span className="testcase-bar-label">
//                 {output.passedTestCases} / {output.totalTestCases} test cases passed
//               </span>
//             </div>

//             <div className="output-runtime">Runtime: {output.executionTimeMs} ms</div>
//           </div>
//         )}

//         {output && !output.isSubmission && (
//           <div
//             className={
//               output.status === "Success"
//                 ? "output-result output-success"
//                 : "output-result output-failure"
//             }
//           >
//             <div>
//               <strong>{output.status}</strong>
//             </div>
//             <div className="output-result-text">{output.result}</div>
//             <div className="output-runtime">Runtime: {output.runtime}</div>
//           </div>
//         )}
//       </div>
//     </div>
//   );

//   if (isFullscreen) {
//     return (
//       <div className="workspace-fullscreen-overlay">
//         {editorPane}
//         {floatingTimer}
//         {showResumeModal && (
//           <ContestWarningModal warningState={warningState} onResume={resumeFullscreen} />
//         )}
//       </div>
//     );
//   }

//   return (
//     <div
//       className="workspace"
//       ref={containerRef}
//       onMouseMove={handleMouseMove}
//       onMouseUp={handleMouseUp}
//       onMouseLeave={handleMouseUp}
//     >
//       {floatingTimer}
//       {showResumeModal && (
//         <ContestWarningModal warningState={warningState} onResume={resumeFullscreen} />
//       )}

//       {courseTitle && (
//         <div className="workspace-course-banner">
//           📘 Part of course: <strong>{courseTitle}</strong>
//           <Link to={`/courses/${courseIdParam}`} className="workspace-course-link">
//             View Course
//           </Link>
//         </div>
//       )}

//       <div className="workspace-topbar">
//         {!isAttemptActive && (
//           <Link to="/problems" className="btn btn-secondary">
//             Back to Problem Catalog
//           </Link>
//         )}
//         {isAttemptActive && <span />}

//         <div className="workspace-nav-controls">
//           {isNavListReady ? (
//             <button
//               type="button"
//               className="btn btn-secondary"
//               onClick={() => goToProblem(previousProblemId)}
//               disabled={!previousProblemId}
//             >
//               ← Previous
//             </button>
//           ) : (
//             <button type="button" className="btn btn-secondary" disabled>
//               …
//             </button>
//           )}

//           <span className="workspace-problem-id">Problem #{problem.id}</span>

//           {isNavListReady ? (
//             <button
//               type="button"
//               className="btn btn-secondary"
//               onClick={() => goToProblem(nextProblemId)}
//               disabled={!nextProblemId}
//             >
//               Next →
//             </button>
//           ) : (
//             <button type="button" className="btn btn-secondary" disabled>
//               …
//             </button>
//           )}
//         </div>

//         {!isAttemptActive && (
//           <Link to="/dashboard" className="btn btn-secondary">
//             Go to Dashboard
//           </Link>
//         )}
//         {isAttemptActive && <span />}
//       </div>

//       <div className="workspace-panes">
//         <div className="workspace-left" style={{ width: `${leftWidth}%` }}>
//           <div className="workspace-tabs">
//             <button
//               type="button"
//               className={activeTab === "description" ? "ws-tab active" : "ws-tab"}
//               onClick={() => handleTabClick("description")}
//             >
//               Description
//             </button>
//             {!hideSubmissionsTab && (
//               <button
//                 type="button"
//                 className={activeTab === "submissions" ? "ws-tab active" : "ws-tab"}
//                 onClick={() => handleTabClick("submissions")}
//               >
//                 Submissions
//               </button>
//             )}
//             <button
//               type="button"
//               className={activeTab === "discussion" ? "ws-tab active" : "ws-tab"}
//               onClick={() => handleTabClick("discussion")}
//             >
//               Discussion
//             </button>
//           </div>

//           <div className="workspace-tab-content">
//             {activeTab === "description" && (
//               <div>
//                 <div className="ws-problem-heading">
//                   <h2>{problem.title}</h2>
//                   <span
//                     className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}
//                   >
//                     {problem.difficulty}
//                   </span>
//                   {problem.premium && <span className="premium-chip">★ Premium</span>}
//                   <button
//                     type="button"
//                     className={
//                       isBookmarked ? "bookmark-toggle-btn bookmarked" : "bookmark-toggle-btn"
//                     }
//                     onClick={handleToggleBookmark}
//                     disabled={isTogglingBookmark}
//                     title={isBookmarked ? "Remove bookmark" : "Bookmark this problem"}
//                   >
//                     {isBookmarked ? "★ Saved" : "☆ Save"}
//                   </button>
//                 </div>

//                 {problem.tags && problem.tags.length > 0 && (
//                   <div className="ws-tags">
//                     {problem.tags.map((tag) => (
//                       <span key={tag} className="tag-chip">
//                         {tag}
//                       </span>
//                     ))}
//                   </div>
//                 )}

//                 <p className="ws-description-text">{problem.description}</p>

//                 {problem.examples.map((ex, idx) => (
//                   <div key={idx} className="ws-example">
//                     <strong>Example {idx + 1}:</strong>
//                     <div className="ws-example-line">Input: {ex.input}</div>
//                     <div className="ws-example-line">Output: {ex.output}</div>
//                   </div>
//                 ))}

//                 {problem.constraints && problem.constraints.length > 0 && (
//                   <div className="ws-constraints">
//                     <strong>Constraints:</strong>
//                     <ul>
//                       {problem.constraints.map((c, idx) => (
//                         <li key={idx}>{c}</li>
//                       ))}
//                     </ul>
//                   </div>
//                 )}
//               </div>
//             )}

//             {!hideSubmissionsTab && activeTab === "submissions" && (
//               <div>
//                 {!submissionsLoaded && (
//                   <p className="ws-placeholder-text">Loading submissions...</p>
//                 )}
//                 {submissionsLoaded && submissions.length === 0 && (
//                   <p className="ws-placeholder-text">
//                     No submissions yet for this problem. Submit your code to see it here.
//                   </p>
//                 )}
//                 {submissionsLoaded && submissions.length > 0 && (
//                   <table className="ws-submissions-table">
//                     <thead>
//                       <tr>
//                         <th>Status</th>
//                         <th>Tests</th>
//                         <th>Language</th>
//                         <th>Submitted</th>
//                         <th></th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {submissions.map((sub) => (
//                         <Fragment key={sub.id}>
//                           <tr>
//                             <td>
//                               <span
//                                 className={
//                                   sub.status === "ACCEPTED"
//                                     ? "status-badge status-accepted"
//                                     : "status-badge status-failed"
//                                 }
//                               >
//                                 {sub.status.replace(/_/g, " ")}
//                               </span>
//                             </td>
//                             <td>
//                               {sub.passedTestCases}/{sub.totalTestCases}
//                             </td>
//                             <td>{sub.language}</td>
//                             <td>{new Date(sub.submittedAt).toLocaleString()}</td>
//                             <td>
//                               <button
//                                 type="button"
//                                 className="view-code-btn"
//                                 onClick={() =>
//                                   setExpandedSubmissionId(
//                                     expandedSubmissionId === sub.id ? null : sub.id
//                                   )
//                                 }
//                               >
//                                 {expandedSubmissionId === sub.id ? "Hide Code" : "View Code"}
//                               </button>
//                             </td>
//                           </tr>
//                           {expandedSubmissionId === sub.id && (
//                             <tr>
//                               <td colSpan={5}>
//                                 <pre className="submission-code-block">
//                                   <code>{sub.code}</code>
//                                 </pre>
//                               </td>
//                             </tr>
//                           )}
//                         </Fragment>
//                       ))}
//                     </tbody>
//                   </table>
//                 )}
//               </div>
//             )}

//             {activeTab === "discussion" && (
//               <div>
//                 {hideSubmissionsTab ? (
//                   <p className="ws-placeholder-text">
//                     Discussion for this problem opens once the contest ends.
//                   </p>
//                 ) : (
//                   <>
//                     <p className="ws-placeholder-text">
//                       Community discussion for this problem will appear here.
//                     </p>
//                     <Link
//                       to={`/discussions/problem/${problem.id}`}
//                       className="btn btn-secondary"
//                     >
//                       Open Discussion Thread
//                     </Link>
//                   </>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>

//         <div className="workspace-divider" onMouseDown={handleMouseDown} />

//         {editorPane}
//       </div>
//     </div>
//   );
// }




import Editor from "@monaco-editor/react";
import { useState, useRef, useCallback, useEffect, Fragment } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProblemById, getProblemNeighbors } from "../api/problemApi";
import { createSubmission, getMySubmissionsForProblem } from "../api/submissionApi";
import { runCode } from "../api/runApi";
import { getContestById, getContestAttempt, endContestAttempt } from "../api/contestApi";
import { toggleBookmark } from "../api/bookmarkApi";
import PremiumLock from "../components/PremiumLock";
import ContestFloatingTimer from "../components/ContestFloatingTimer";
import ContestWarningModal from "../components/ContestWarningModal";
import useContestLockdown from "../hooks/useContestLockdown";
import "./CodingWorkspace.css";

const languageStarters = {
  Java: `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input using sc.nextInt(), sc.next(), sc.nextLine() as needed
        // Write your solution here

    }
}`,
  Python: `import sys

def main():
    data = sys.stdin.read().split()
    # Parse tokens from 'data' as needed
    # Write your solution here
    pass

if __name__ == "__main__":
    main()`,
  JavaScript: `const readline = require('readline');
const rl = readline.createInterface({ input: process.stdin });
let lines = [];

rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    // 'lines' now holds each line of input as a string
    // Write your solution here

});`,
  C: `#include <stdio.h>

int main() {
    // Read input using scanf as needed
    // Write your solution here

    return 0;
}`,
  "C++": `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Read input using cin as needed
    // Write your solution here

    return 0;
}`,
};

const monacoLanguageMap = {
  Java: "java",
  Python: "python",
  JavaScript: "javascript",
  C: "c",
  "C++": "cpp",
};

const EMPTY_NEIGHBORS = {
  previousId: null,
  nextId: null,
  position: null,
  total: 0,
  scopeType: "NONE",
  scopeLabel: null,
};

const draftKey = (problemId, language, contestId) => {
  const username = localStorage.getItem("username") || "guest";
  const contestPart = contestId ? `contest-${contestId}-` : "";
  return `codeforge-draft-${username}-${contestPart}${problemId}-${language}`;
};

const loadDraft = (problemId, language, contestId) =>
  localStorage.getItem(draftKey(problemId, language, contestId)) ?? languageStarters[language];

export default function CodingWorkspace() {
  const { problemId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const courseIdParam = searchParams.get("course");

  const [problem, setProblem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [neighbors, setNeighbors] = useState(EMPTY_NEIGHBORS);
  const [isLoadingNeighbors, setIsLoadingNeighbors] = useState(true);
  const [contestStatus, setContestStatus] = useState(null);

  const [activeTab, setActiveTab] = useState("description");
  const [language, setLanguage] = useState("Java");
  const [code, setCode] = useState(() => loadDraft(problemId, "Java", null));
  const [customInput, setCustomInput] = useState("");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoaded, setSubmissionsLoaded] = useState(false);
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

  const [leftWidth, setLeftWidth] = useState(45);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editorTheme, setEditorTheme] = useState(
    () => localStorage.getItem("codeforge-editor-theme") || "vs-dark"
  );

  const [contestAttempt, setContestAttempt] = useState(null);
  const [isEndingContest, setIsEndingContest] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  useEffect(() => {
    async function fetchProblem() {
      setIsLoading(true);
      setLoadError("");
      try {
        const response = await getProblemById(problemId);
        setProblem(response.data);
        setIsBookmarked(Boolean(response.data.bookmarked));
        setCode(loadDraft(problemId, language, response.data.contestId));

        if (response.data.contestId) {
          try {
            const contestResponse = await getContestById(response.data.contestId);
            setContestStatus(contestResponse.data.status);

            if (contestResponse.data.registered) {
              const attemptResponse = await getContestAttempt(response.data.contestId);
              setContestAttempt(attemptResponse.data);
            } else {
              setContestAttempt(null);
            }
          } catch (err) {
            setContestStatus(null);
            setContestAttempt(null);
          }
        } else {
          setContestStatus(null);
          setContestAttempt(null);
        }
      } catch (err) {
        setLoadError("Problem not found.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProblem();

    setCustomInput("");
    setSubmissions([]);
    setSubmissionsLoaded(false);
    setExpandedSubmissionId(null);
    setOutput(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemId]);

  // Previous/Next comes from the server, which knows whether this problem is
  // being viewed as part of a course, a live contest, or the general catalog.
  useEffect(() => {
    let cancelled = false;

    async function loadNeighbors() {
      setIsLoadingNeighbors(true);
      try {
        const response = await getProblemNeighbors(problemId, courseIdParam);
        if (!cancelled) setNeighbors(response.data);
      } catch (err) {
        console.error("Failed to load Previous/Next navigation:", err);
        if (!cancelled) setNeighbors(EMPTY_NEIGHBORS);
      } finally {
        if (!cancelled) setIsLoadingNeighbors(false);
      }
    }
    loadNeighbors();

    return () => {
      cancelled = true;
    };
  }, [problemId, courseIdParam]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const loadSubmissions = async () => {
    try {
      const response = await getMySubmissionsForProblem(problemId);
      setSubmissions(response.data);
    } catch (err) {
      setSubmissions([]);
    } finally {
      setSubmissionsLoaded(true);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === "submissions" && !submissionsLoaded) {
      loadSubmissions();
    }
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newLeftWidth > 25 && newLeftWidth < 75) {
      setLeftWidth(newLeftWidth);
    }
  }, []);

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    setCode(loadDraft(problemId, newLang, problem?.contestId));
  };

  const handleCodeChange = (value) => {
    const newCode = value ?? "";
    setCode(newCode);
    localStorage.setItem(draftKey(problemId, language, problem?.contestId), newCode);
  };

  const handleResetCode = () => {
    if (
      !window.confirm(
        "Reset to the starter code? Your current code for this language will be lost."
      )
    ) {
      return;
    }
    localStorage.removeItem(draftKey(problemId, language, problem?.contestId));
    setCode(languageStarters[language]);
  };

  const handleThemeToggle = () => {
    const newTheme = editorTheme === "vs-dark" ? "light" : "vs-dark";
    setEditorTheme(newTheme);
    localStorage.setItem("codeforge-editor-theme", newTheme);
  };

  const handleToggleBookmark = async () => {
    setIsTogglingBookmark(true);
    try {
      const response = await toggleBookmark(problemId);
      setIsBookmarked(response.data.bookmarked);
    } catch (err) {
      // low-stakes — ignore
    } finally {
      setIsTogglingBookmark(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const response = await runCode({
        code,
        language,
        stdin: customInput,
        problemId: Number(problemId),
      });
      const result = response.data;
      setOutput({
        isSubmission: false,
        status: result.success ? "Success" : "Error",
        result: result.success ? result.output || "(no output)" : result.error,
        runtime: "—",
      });
    } catch (err) {
      setOutput({
        isSubmission: false,
        status: "Error",
        result: err.response?.data?.error || "Failed to run code.",
        runtime: "—",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setOutput(null);
    try {
      const response = await createSubmission({
        problemId: Number(problemId),
        code,
        language,
      });
      const result = response.data;

      const statusLabels = {
        ACCEPTED: "Accepted",
        WRONG_ANSWER: "Wrong Answer",
        COMPILE_ERROR: "Compile Error",
        RUNTIME_ERROR: "Runtime Error",
        TIME_LIMIT_EXCEEDED: "Time Limit Exceeded",
      };

      setOutput({
        isSubmission: true,
        status: statusLabels[result.status] || result.status,
        passedTestCases: result.passedTestCases,
        totalTestCases: result.totalTestCases,
        executionTimeMs: result.executionTimeMs,
        beatsPercentage: result.beatsPercentage,
      });

      setSubmissionsLoaded(false);
      if (activeTab === "submissions") {
        loadSubmissions();
      }
    } catch (err) {
      setOutput({
        isSubmission: false,
        status: "Error",
        result: err.response?.data?.error || "Submission failed. Please try again.",
        runtime: "—",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToProblem = (id) => {
    if (!id) return;
    // Keep the course context so Next/Previous stay inside that syllabus.
    const suffix = neighbors.scopeType === "COURSE" && courseIdParam ? `?course=${courseIdParam}` : "";
    navigate(`/problems/${id}${suffix}`);
  };

  const handleContestExpire = useCallback(async () => {
    if (!problem?.contestId) return;
    try {
      await endContestAttempt(problem.contestId);
    } catch (err) {
      // server finalizes independently regardless
    }
    navigate(`/contests/${problem.contestId}`);
  }, [problem, navigate]);

  const handleEndContestFromWorkspace = useCallback(async () => {
    if (!problem?.contestId) return;
    setIsEndingContest(true);
    try {
      await endContestAttempt(problem.contestId);
    } catch (err) {
      // the contest page will show the correct state regardless
    } finally {
      setIsEndingContest(false);
      navigate(`/contests/${problem.contestId}`);
    }
  }, [problem, navigate]);

  const isAttemptActive = Boolean(contestAttempt && contestAttempt.status === "IN_PROGRESS");
  const { warningState, showResumeModal, resumeFullscreen } = useContestLockdown({
    contestId: problem?.contestId,
    isActive: isAttemptActive,
    onEnded: handleContestExpire,
  });

  const hideSubmissionsTab = Boolean(problem?.contestId) && contestStatus !== "ENDED";

  if (isLoading) {
    return (
      <div className="workspace-status-page">
        <p>Loading problem...</p>
      </div>
    );
  }

  if (loadError || !problem) {
    return (
      <div className="workspace-status-page">
        <p>{loadError || "Problem not found."}</p>
        <Link to="/problems" className="btn btn-secondary">
          Back to Problem Catalog
        </Link>
      </div>
    );
  }

  if (problem.locked) {
    return <PremiumLock problem={problem} />;
  }

  const floatingTimer = isAttemptActive ? (
    <ContestFloatingTimer
      deadline={contestAttempt.deadline}
      onExpire={handleContestExpire}
      onEndContest={handleEndContestFromWorkspace}
      isEnding={isEndingContest}
    />
  ) : null;

  const editorPane = (
    <div
      className={isFullscreen ? "workspace-right workspace-right-fullscreen" : "workspace-right"}
      style={isFullscreen ? {} : { width: `${100 - leftWidth}%` }}
    >
      <div className="editor-toolbar">
        <div className="editor-toolbar-left">
          <select value={language} onChange={handleLanguageChange}>
            {Object.keys(languageStarters).map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="editor-icon-btn"
            onClick={handleThemeToggle}
            title="Toggle editor theme"
          >
            {editorTheme === "vs-dark" ? "☀ Light" : "🌙 Dark"}
          </button>

          <button
            type="button"
            className="editor-icon-btn"
            onClick={handleResetCode}
            title="Reset to starter code"
          >
            ↺ Reset
          </button>

          <button
            type="button"
            className="editor-icon-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen editor"}
          >
            {isFullscreen ? "✕ Exit Fullscreen" : "⛶ Fullscreen"}
          </button>
        </div>

        <div className="editor-toolbar-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      <div className="code-editor-wrapper">
        <Editor
          height="100%"
          language={monacoLanguageMap[language]}
          value={code}
          onChange={handleCodeChange}
          theme={editorTheme}
          options={{
            fontSize: 14,
            fontFamily: "Fira Code, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
          }}
        />
      </div>

      <div className="editor-custom-input">
        <div className="editor-output-heading">Custom Input (for Run only)</div>
        <textarea
          className="custom-input-box"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder="Type input here to test with Run..."
          rows={3}
        />
      </div>

      <div className="editor-output">
        <div className="editor-output-heading">Output</div>

        {output === null && !isRunning && !isSubmitting && (
          <p className="ws-placeholder-text">Run your code to see output here.</p>
        )}
        {(isRunning || isSubmitting) && <p className="ws-placeholder-text">Executing...</p>}

        {output && output.isSubmission && (
          <div
            className={
              output.status === "Accepted"
                ? "output-result output-success"
                : "output-result output-failure"
            }
          >
            <div className="submit-result-status">
              <strong>{output.status}</strong>
              {output.status === "Accepted" && output.beatsPercentage !== null && (
                <span className="beats-text">
                  Faster than {output.beatsPercentage}% of {language} submissions
                </span>
              )}
            </div>

            <div className="testcase-bar-wrapper">
              <div className="testcase-bar">
                <div
                  className="testcase-bar-fill"
                  style={{
                    width: `${
                      output.totalTestCases > 0
                        ? (output.passedTestCases / output.totalTestCases) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="testcase-bar-label">
                {output.passedTestCases} / {output.totalTestCases} test cases passed
              </span>
            </div>

            <div className="output-runtime">Runtime: {output.executionTimeMs} ms</div>
          </div>
        )}

        {output && !output.isSubmission && (
          <div
            className={
              output.status === "Success"
                ? "output-result output-success"
                : "output-result output-failure"
            }
          >
            <div>
              <strong>{output.status}</strong>
            </div>
            <div className="output-result-text">{output.result}</div>
            <div className="output-runtime">Runtime: {output.runtime}</div>
          </div>
        )}
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="workspace-fullscreen-overlay">
        {editorPane}
        {floatingTimer}
        {showResumeModal && (
          <ContestWarningModal warningState={warningState} onResume={resumeFullscreen} />
        )}
      </div>
    );
  }

  return (
    <div
      className="workspace"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {floatingTimer}
      {showResumeModal && (
        <ContestWarningModal warningState={warningState} onResume={resumeFullscreen} />
      )}

      {neighbors.scopeType === "COURSE" && neighbors.scopeLabel && (
        <div className="workspace-course-banner">
          📘 Part of course: <strong>{neighbors.scopeLabel}</strong>
          <Link to={`/courses/${courseIdParam}`} className="workspace-course-link">
            View Course
          </Link>
        </div>
      )}

      <div className="workspace-topbar">
        {!isAttemptActive && (
          <Link to="/problems" className="btn btn-secondary">
            Back to Problem Catalog
          </Link>
        )}
        {isAttemptActive && <span />}

        <div className="workspace-nav-controls">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => goToProblem(neighbors.previousId)}
            disabled={isLoadingNeighbors || !neighbors.previousId}
          >
            ← Previous
          </button>

          <span className="workspace-problem-id">
            {neighbors.position && neighbors.total
              ? `${neighbors.position} / ${neighbors.total}`
              : `Problem #${problem.id}`}
          </span>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => goToProblem(neighbors.nextId)}
            disabled={isLoadingNeighbors || !neighbors.nextId}
          >
            Next →
          </button>
        </div>

        {!isAttemptActive && (
          <Link to="/dashboard" className="btn btn-secondary">
            Go to Dashboard
          </Link>
        )}
        {isAttemptActive && <span />}
      </div>

      <div className="workspace-panes">
        <div className="workspace-left" style={{ width: `${leftWidth}%` }}>
          <div className="workspace-tabs">
            <button
              type="button"
              className={activeTab === "description" ? "ws-tab active" : "ws-tab"}
              onClick={() => handleTabClick("description")}
            >
              Description
            </button>
            {!hideSubmissionsTab && (
              <button
                type="button"
                className={activeTab === "submissions" ? "ws-tab active" : "ws-tab"}
                onClick={() => handleTabClick("submissions")}
              >
                Submissions
              </button>
            )}
            <button
              type="button"
              className={activeTab === "discussion" ? "ws-tab active" : "ws-tab"}
              onClick={() => handleTabClick("discussion")}
            >
              Discussion
            </button>
          </div>

          <div className="workspace-tab-content">
            {activeTab === "description" && (
              <div>
                <div className="ws-problem-heading">
                  <h2>{problem.title}</h2>
                  <span
                    className={`difficulty-badge difficulty-${problem.difficulty.toLowerCase()}`}
                  >
                    {problem.difficulty}
                  </span>
                  {problem.premium && <span className="premium-chip">★ Premium</span>}
                  <button
                    type="button"
                    className={
                      isBookmarked ? "bookmark-toggle-btn bookmarked" : "bookmark-toggle-btn"
                    }
                    onClick={handleToggleBookmark}
                    disabled={isTogglingBookmark}
                    title={isBookmarked ? "Remove bookmark" : "Bookmark this problem"}
                  >
                    {isBookmarked ? "★ Saved" : "☆ Save"}
                  </button>
                </div>

                {problem.tags && problem.tags.length > 0 && (
                  <div className="ws-tags">
                    {problem.tags.map((tag) => (
                      <span key={tag} className="tag-chip">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <p className="ws-description-text">{problem.description}</p>

                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="ws-example">
                    <strong>Example {idx + 1}:</strong>
                    <div className="ws-example-line">Input: {ex.input}</div>
                    <div className="ws-example-line">Output: {ex.output}</div>
                  </div>
                ))}

                {problem.constraints && problem.constraints.length > 0 && (
                  <div className="ws-constraints">
                    <strong>Constraints:</strong>
                    <ul>
                      {problem.constraints.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!hideSubmissionsTab && activeTab === "submissions" && (
              <div>
                {!submissionsLoaded && (
                  <p className="ws-placeholder-text">Loading submissions...</p>
                )}
                {submissionsLoaded && submissions.length === 0 && (
                  <p className="ws-placeholder-text">
                    No submissions yet for this problem. Submit your code to see it here.
                  </p>
                )}
                {submissionsLoaded && submissions.length > 0 && (
                  <table className="ws-submissions-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Tests</th>
                        <th>Language</th>
                        <th>Submitted</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <Fragment key={sub.id}>
                          <tr>
                            <td>
                              <span
                                className={
                                  sub.status === "ACCEPTED"
                                    ? "status-badge status-accepted"
                                    : "status-badge status-failed"
                                }
                              >
                                {sub.status.replace(/_/g, " ")}
                              </span>
                            </td>
                            <td>
                              {sub.passedTestCases}/{sub.totalTestCases}
                            </td>
                            <td>{sub.language}</td>
                            <td>{new Date(sub.submittedAt).toLocaleString()}</td>
                            <td>
                              <button
                                type="button"
                                className="view-code-btn"
                                onClick={() =>
                                  setExpandedSubmissionId(
                                    expandedSubmissionId === sub.id ? null : sub.id
                                  )
                                }
                              >
                                {expandedSubmissionId === sub.id ? "Hide Code" : "View Code"}
                              </button>
                            </td>
                          </tr>
                          {expandedSubmissionId === sub.id && (
                            <tr>
                              <td colSpan={5}>
                                <pre className="submission-code-block">
                                  <code>{sub.code}</code>
                                </pre>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "discussion" && (
              <div>
                {hideSubmissionsTab ? (
                  <p className="ws-placeholder-text">
                    Discussion for this problem opens once the contest ends.
                  </p>
                ) : (
                  <>
                    <p className="ws-placeholder-text">
                      Community discussion for this problem will appear here.
                    </p>
                    <Link
                      to={`/discussions/problem/${problem.id}`}
                      className="btn btn-secondary"
                    >
                      Open Discussion Thread
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="workspace-divider" onMouseDown={handleMouseDown} />

        {editorPane}
      </div>
    </div>
  );
}