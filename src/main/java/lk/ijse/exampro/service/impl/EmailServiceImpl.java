package lk.ijse.exampro.service.impl;

import lk.ijse.exampro.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public void sendExamNotification(String to, String examTitle, LocalDateTime startTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Upcoming Exam: " + examTitle);
        message.setText("Your exam '" + examTitle + "' is scheduled for " + startTime.toString());
        mailSender.send(message);
    }

    @Override
    public void sendResultNotification(String to, String examTitle, Integer score) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject("Exam Result: " + examTitle);
            message.setText("Your score for " + examTitle + " is: " + score);
            mailSender.send(message);
            logger.info("Result notification sent to: {}", to);
        } catch (MailException e) {
            logger.error("Failed to send result notification to {}: {}", to, e.getMessage(), e);
            // Optionally rethrow or handle gracefully
        }
    }

    @Override
    public void sendSubmissionNotification(String to, String examTitle) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Exam Submission Confirmation: " + examTitle);
        message.setText("Your submission for the exam '" + examTitle + "' has been received. Results will be available once grading is complete.");
        mailSender.send(message);
    }

}