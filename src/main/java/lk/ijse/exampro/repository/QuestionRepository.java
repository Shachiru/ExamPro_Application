package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Exam;
import lk.ijse.exampro.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByExam(Exam exam);
    int countByExam(Exam exam);
    int countByExamAndType(Exam exam, String type);
}