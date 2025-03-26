package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Answer;
import lk.ijse.exampro.entity.StudentExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
    List<Answer> findByStudentExam(StudentExam studentExam);
}