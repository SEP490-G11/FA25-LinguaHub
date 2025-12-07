// src/main/java/edu/lms/service/EmailService.java
package edu.lms.service;

import edu.lms.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtp(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("[LinguaHub] Verify your email");
        message.setText("Your verification code is: " + otp + "\nThis code will expire in 5 minutes.");
        mailSender.send(message);
    }

    public void notifyAdminNewTutor(User tutor) {
        log.info("New tutor waiting for approval: {}", tutor.getEmail());
        // Optional: gửi mail thông báo cho admin
    }

    // ====================== COURSE EMAILS ======================

    public void sendCourseApprovedToTutor(String toEmail, String courseTitle, String note) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[LinguaHub] Your course has been approved");

        StringBuilder content = new StringBuilder();
        content.append("Dear Tutor,\n\n");
        content.append("Your course \"").append(courseTitle)
                .append("\" has been approved by the admin and is now live on LinguaHub.\n");

        if (note != null && !note.isBlank()) {
            content.append("\nAdmin note:\n")
                    .append(note)
                    .append("\n");
        }

        content.append("\nBest regards,\n");
        content.append("LinguaHub Team");

        message.setText(content.toString());
        mailSender.send(message);
    }

    public void sendCourseRejectedToTutor(String toEmail, String courseTitle, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[LinguaHub] Your course was rejected");

        StringBuilder content = new StringBuilder();
        content.append("Dear Tutor,\n\n");
        content.append("Your course \"").append(courseTitle)
                .append("\" was rejected by the admin.\n");

        if (reason != null && !reason.isBlank()) {
            content.append("\nReason:\n")
                    .append(reason)
                    .append("\n");
        } else {
            content.append("\nReason: Not provided by admin.\n");
        }

        content.append("\nPlease update the course based on the feedback and resubmit.\n\n");
        content.append("Best regards,\n");
        content.append("LinguaHub Team");

        message.setText(content.toString());
        mailSender.send(message);
    }

    public void sendCourseUpdatedToLearner(String toEmail, String courseTitle, String summary) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[LinguaHub] Course \"" + courseTitle + "\" has been updated");

        StringBuilder content = new StringBuilder();
        content.append("Hello,\n\n");
        content.append("The course \"").append(courseTitle)
                .append("\" that you enrolled in has just been updated.\n\n");
        content.append("Summary of changes:\n");
        content.append(summary).append("\n");
        content.append("\nPlease log in to LinguaHub to see full details.\n\n");
        content.append("Best regards,\n");
        content.append("LinguaHub Team");

        message.setText(content.toString());
        mailSender.send(message);
    }

    // ====================== COURSE DRAFT EMAILS ======================

    // src/main/java/edu/lms/service/EmailService.java

    public void sendCourseDraftApprovedToTutor(String toEmail, String courseTitle, String changeSummary) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[LinguaHub] Your course updates have been approved");

        StringBuilder content = new StringBuilder();
        content.append("Dear Tutor,\n\n");
        content.append("Your updates for the course \"")
                .append(courseTitle)
                .append("\" have been approved and applied to the live course.\n\n");

        content.append("Summary of changes:\n");
        content.append(changeSummary).append("\n");

        content.append("You can log in to LinguaHub to review the updated course content.\n\n");
        content.append("Best regards,\n");
        content.append("LinguaHub Team");

        message.setText(content.toString());
        mailSender.send(message);
    }

    public void sendCourseDraftRejectedToTutor(String toEmail, String courseTitle, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("[LinguaHub] Your course draft was rejected");

        StringBuilder content = new StringBuilder();
        content.append("Dear Tutor,\n\n");
        content.append("Your draft update for the course \"")
                .append(courseTitle)
                .append("\" was rejected by the admin.\n\n");

        if (reason != null && !reason.isBlank()) {
            content.append("Reason from admin:\n")
                    .append(reason)
                    .append("\n\n");
        } else {
            content.append("Reason: Not provided by admin.\n\n");
        }

        content.append("Please update your draft based on the feedback and resubmit.\n\n");
        content.append("Best regards,\n");
        content.append("LinguaHub Team");

        message.setText(content.toString());
        mailSender.send(message);
    }


}
