package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Exam;
import lk.ijse.exampro.entity.StudentExam;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentExamRepository extends JpaRepository<StudentExam, Long> {
    // Find all exams taken by a specific student
    List<StudentExam> findByStudent(User student);

    // Find a specific student-exam record by student and exam
    Optional<StudentExam> findByStudentAndExam(User student, Exam exam);

    // Find all completed exams for a student
    List<StudentExam> findByStudentAndIsCompleted(User student, Boolean isCompleted);
}