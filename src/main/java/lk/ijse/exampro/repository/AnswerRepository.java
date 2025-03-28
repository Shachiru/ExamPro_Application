package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Answer;
import lk.ijse.exampro.entity.StudentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnswerRepository extends JpaRepository<Answer, Long> {

    // Find all answers for a specific student's exam attempt
    List<Answer> findByStudentResult(StudentResult studentResult);

    // Find all answers for a specific student's exam attempt where score is null (ungraded)
    List<Answer> findByStudentResultAndScoreIsNull(StudentResult studentResult);

    // Find all answers for a specific student's exam attempt by question type
    List<Answer> findByStudentResultAndQuestionType(StudentResult studentResult, String questionType);

    // Check if an answer exists for a specific student result and question
    boolean existsByStudentResultAndQuestionId(StudentResult studentResult, Long questionId);
}