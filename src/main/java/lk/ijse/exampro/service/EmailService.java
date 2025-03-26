package lk.ijse.exampro.service;

import java.time.LocalDateTime;

public interface EmailService {
    void sendExamNotification(String to, String examTitle, LocalDateTime startTime);
    void sendResultNotification(String to, String examTitle, int score);
}