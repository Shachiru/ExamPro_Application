package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Exam;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCreatedBy(User teacher);

    List<Exam> findByStartTimeAfter(LocalDateTime dateTime);

    List<Exam> findByTitleContainingIgnoreCase(String title);

    List<Exam> findByCreatedByAndSubject(User createdBy, String subject);

    List<Exam> findBySubject(String subject);

    List<Exam> findBySchoolName(String schoolName);
}