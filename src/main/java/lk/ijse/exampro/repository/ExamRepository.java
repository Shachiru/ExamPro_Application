package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Exam;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByCreatedBy(User teacher);

    List<Exam> findByCreatedByEmail(String email);

    List<Exam> findByStartTimeAfter(LocalDateTime dateTime);

    List<Exam> findByTitleContainingIgnoreCase(String title);

    List<Exam> findByCreatedByAndSubject(User createdBy, String subject);

    List<Exam> findBySubject(String subject);

    List<Exam> findBySchoolName(String schoolName);

    @Query("SELECT COUNT(e) FROM Exam e WHERE YEAR(e.startTime) = YEAR(CURRENT_DATE) AND MONTH(e.startTime) = MONTH(CURRENT_DATE)")
    long countExamsThisMonth();
}