package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Exam;
import lk.ijse.exampro.entity.StudentResult;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentResultRepository extends JpaRepository<StudentResult, Long> {
    Optional<StudentResult> findByStudentAndExam(User student, Exam exam);

    List<StudentResult> findByExamIn(List<Exam> exams);
}