import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import AdminRoute from "./components/AdminRoute";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import PasswordResetPage from "./pages/PasswordResetPage";
import ResetPasswordConfirmPage from "./pages/ResetPasswordConfirmPage";
import LearnerDashboard from "./pages/LearnerDashboard";
import ProfilePage from "./pages/ProfilePage";
import ProblemCatalog from "./pages/ProblemCatalog";
import CodingWorkspace from "./pages/CodingWorkspace";
import CourseCatalog from "./pages/CourseCatalog";
import CourseDetails from "./pages/CourseDetails";
import DiscussionList from "./pages/DiscussionList";
import DiscussionThread from "./pages/DiscussionThread";
import Leaderboard from "./pages/Leaderboard";
import PremiumPage from "./pages/PremiumPage";
import ContestList from "./pages/ContestList";
import ContestDetails from "./pages/ContestDetails";

import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageProblems from "./pages/admin/ManageProblems";
import ManageCourses from "./pages/admin/ManageCourses";
import ManageContests from "./pages/admin/ManageContests";
import ContestLeaderboard from "./pages/ContestLeaderboard";
import Playground from "./pages/Playground";
import ManageUsers from "./pages/admin/ManageUsers";
import ContestReport from "./pages/admin/ContestReport";
import ManageAnnouncement from "./pages/admin/ManageAnnouncement";
import Bookmarks from "./pages/Bookmarks";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/reset-password/confirm" element={<ResetPasswordConfirmPage />} />

        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<LearnerDashboard />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/playground" element={<Playground />} />

          <Route path="/admin/users" element={<ManageUsers />} />
          <Route path="/admin/contests/:contestId/report" element={<ContestReport />} />

          <Route path="/problems" element={<ProblemCatalog />} />
          <Route path="/problems/:problemId" element={<CodingWorkspace />} />

          <Route path="/courses" element={<CourseCatalog />} />
          <Route path="/courses/:courseId" element={<CourseDetails />} />

          <Route path="/contests/:contestId/leaderboard" element={<ContestLeaderboard />} />

          <Route path="/discussions/problem/:problemId" element={<DiscussionList />} />
          <Route path="/discussions/post/:postId" element={<DiscussionThread />} />

          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/premium" element={<PremiumPage />} />

          <Route path="/bookmarks" element={<Bookmarks />} />

          <Route path="/contests" element={<ContestList />} />
          <Route path="/contests/:contestId" element={<ContestDetails />} />

          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/problems" element={<ManageProblems />} />
            <Route path="/admin/courses" element={<ManageCourses />} />
            <Route path="/admin/contests" element={<ManageContests />} />
            <Route path="/admin/announcement" element={<ManageAnnouncement />} />
          </Route>
        </Route>

        <Route path="*" element={<h1>404 - Page Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;