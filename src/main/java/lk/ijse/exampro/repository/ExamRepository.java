package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Exam;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    // Find exams created by a specific teacher
    List<Exam> findByCreatedBy(User teacher);

    // Find exams starting after a specific time (useful for scheduling)
    List<Exam> findByStartTimeAfter(LocalDateTime dateTime);

    // Optional: Find exams by title (for search functionality)
    List<Exam> findByTitleContainingIgnoreCase(String title);

    List<Exam> findByCreatedByAndSubject(User createdBy, String subject);
    List<Exam> findBySubject(String subject);
}