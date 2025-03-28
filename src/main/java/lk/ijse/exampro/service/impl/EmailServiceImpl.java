package lk.ijse.exampro.service.impl;

import lk.ijse.exampro.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EmailServiceImpl implements EmailService {
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
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Results for: " + examTitle);
        message.setText("You scored " + score + " in the exam '" + examTitle + "'.");
        mailSender.send(message);
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