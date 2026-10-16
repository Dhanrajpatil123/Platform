package com.extratechsolution.service;

import com.extratechsolution.entity.NotificationPreference;
import com.extratechsolution.entity.User;
import com.extratechsolution.repository.NotificationPreferenceRepository;
import com.extratechsolution.repository.UserRepository;
import com.extratechsolution.service.mail.AsyncMailer;
import com.extratechsolution.service.mail.EmailTemplates;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static com.extratechsolution.service.mail.EmailTemplates.*;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("EEE, d MMM yyyy", Locale.ENGLISH);
    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH);

    private final AsyncMailer mailer;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    private final Map<Long, Long> testCooldown = new ConcurrentHashMap<>();

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    // ---------- Preferences ----------

    @Transactional(readOnly = true)
    public boolean isEnabled(User user) {
        return preferenceRepository.findByUser_Id(user.getId())
                .map(NotificationPreference::isEmailEnabled)
                .orElse(true);
    }

    @Transactional(readOnly = true)
    public boolean isEnabledFor(String username) {
        return isEnabled(requireUser(username));
    }

    @Transactional
    public boolean setEnabledFor(String username, boolean enabled) {
        User user = requireUser(username);
        NotificationPreference pref = preferenceRepository.findByUser_Id(user.getId()).orElseGet(() -> {
            NotificationPreference p = new NotificationPreference();
            p.setUser(user);
            return p;
        });
        pref.setEmailEnabled(enabled);
        preferenceRepository.save(pref);
        return enabled;
    }

    public String sendTest(String username) {
        User user = requireUser(username);
        long now = System.currentTimeMillis();
        Long last = testCooldown.get(user.getId());
        if (last != null && now - last < 30_000) {
            throw new IllegalStateException("Please wait 30 seconds before sending another test email.");
        }
        testCooldown.put(user.getId(), now);

        String html = render("Your email is working ✅",
                "<p>Hi " + esc(user.getUsername()) + ",</p><p>This is a test email from ExtraTech Solution. "
                        + "If you can read this, notifications are set up correctly.</p>",
                "Open ExtraTech Solution", url("/dashboard"), footer());
        queue(user, "Test email from ExtraTech Solution", html, false);
        return user.getEmail();
    }

    // ---------- Important emails (always sent) ----------

    public void certificateIssued(User user, String recipientName, String title, String code) {
        String verify = url("/verify/" + code);
        String html = render("🎓 Your certificate is ready!",
                "<p>Congratulations <strong>" + esc(recipientName) + "</strong>!</p>"
                        + "<p>You have successfully completed <strong>" + esc(title) + "</strong>. "
                        + "Your certificate has been issued.</p>"
                        + detailBox("Certificate ID: <strong>" + esc(code) + "</strong>")
                        + "<p>You can download it as a PDF, share the verification link, or add it to your LinkedIn profile.</p>",
                "View my certificate", verify, footer());
        queue(user, "Your certificate: " + title, html, false);
    }

    public void bootcampEnrolled(User user, Long bootcampId, String title, LocalDate start, LocalDate end,
                                 String mode, int fee, String reference) {
        String receipt = fee > 0
                ? "Amount paid: <strong>₹" + String.format("%,d", fee) + "</strong> · Reference: <strong>"
                + esc(reference) + "</strong>"
                : "Fee: <strong>Free</strong>";
        String html = render("You're in! 🎉",
                "<p>Hi " + esc(user.getUsername()) + ", your seat is confirmed for <strong>" + esc(title)
                        + "</strong>.</p>"
                        + detailBox("📅 " + start.format(DATE) + " → " + end.format(DATE),
                        "🧭 Mode: " + esc(mode), receipt)
                        + "<p>Check the schedule on the bootcamp page for session timings and meeting links.</p>",
                "Open the bootcamp", url("/bootcamps/" + bootcampId), footer());
        queue(user, "Enrollment confirmed: " + title, html, false);
    }

    public void trackEnrolled(User user, Long trackId, String title, int courses, int problems) {
        String html = render("Your learning path starts now 🚀",
                "<p>Hi " + esc(user.getUsername()) + ", you enrolled in the <strong>" + esc(title)
                        + "</strong> track.</p>"
                        + detailBox("📚 " + courses + " courses", "🧩 " + problems + " problems to solve")
                        + "<p>Solve every problem in the track to earn your combined certificate. "
                        + "Only problems you solve <em>after</em> enrolling count towards your progress.</p>",
                "Start learning", url("/tracks/" + trackId), footer());
        queue(user, "Welcome to the " + title + " track", html, false);
    }

    public void passwordReset(String email, String username, String resetLink) {
        String html = render("Reset your password",
                "<p>Hi " + esc(username) + ",</p><p>We received a request to reset your password. "
                        + "Click the button below to choose a new one. If you didn't ask for this, you can ignore this email.</p>",
                "Reset password", resetLink, "This link expires soon. — ExtraTech Solution");
        mailer.deliver(email, "Reset your ExtraTech Solution password", html);
    }

    // ---------- Reminders (respect the user's preference) ----------

    public void sessionReminder(User user, Long bootcampId, String bootcampTitle, String sessionTitle,
                                LocalDate date, LocalTime start, LocalTime end, String location, String link) {
        StringBuilder details = new StringBuilder();
        String when = "🕒 " + date.format(DATE) + ", " + start.format(TIME) + " – " + end.format(TIME);
        String where = (location == null || location.isBlank()) ? null : "📍 " + esc(location);
        String html = render("Reminder: session starts soon ⏰",
                "<p>Hi " + esc(user.getUsername()) + ", your next session in <strong>" + esc(bootcampTitle)
                        + "</strong> is coming up:</p>"
                        + detailBox("<strong>" + esc(sessionTitle) + "</strong>", when, where == null ? "" : where)
                        + details,
                link != null && !link.isBlank() ? "Join the session" : "Open the bootcamp",
                link != null && !link.isBlank() ? link : url("/bootcamps/" + bootcampId), footer());
        queue(user, "Reminder: " + sessionTitle + " (" + bootcampTitle + ")", html, true);
    }

    public void courseNudge(User user, Long courseId, String courseTitle, int solved, int total) {
        String html = render("Pick up where you left off 💪",
                "<p>Hi " + esc(user.getUsername()) + ", you're <strong>" + solved + " of " + total
                        + "</strong> problems into <strong>" + esc(courseTitle) + "</strong>.</p>"
                        + "<p>Just a few more and you can claim your certificate. A little practice every day adds up!</p>",
                "Continue the course", url("/courses/" + courseId), footer());
        queue(user, "Keep going: " + courseTitle, html, true);
    }

    // ---------- Internals ----------

    private String footer() {
        return "You're receiving this from ExtraTech Solution. Manage reminders in "
                + "<a href=\"" + esc(url("/settings/notifications")) + "\" style=\"color:#0a84ff;\">Email settings</a>.";
    }

    private String url(String path) {
        return frontendUrl.replaceAll("/+$", "") + path;
    }

    private User requireUser(String username) {
        if (username == null) throw new IllegalArgumentException("Please sign in first.");
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Please sign in first."));
    }

    /** Sends after the surrounding transaction commits, so a rollback never produces a stray email. */
    private void queue(User user, String subject, String html, boolean respectPreference) {
        String to = user.getEmail();
        if (to == null || to.isBlank()) return;
        if (respectPreference && !isEnabled(user)) return;

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    mailer.deliver(to, subject, html);
                }
            });
        } else {
            mailer.deliver(to, subject, html);
        }
    }
}