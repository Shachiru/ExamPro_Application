package lk.ijse.exampro.service;

import lk.ijse.exampro.dto.AnswerDTO;
import lk.ijse.exampro.dto.ExamDTO;
import lk.ijse.exampro.dto.QuestionDTO;
import lk.ijse.exampro.dto.StudentExamDTO;

import java.util.List;

public interface ExamService {
    ExamDTO createExam(ExamDTO examDTO);
    QuestionDTO addQuestionToExam(Long examId, QuestionDTO questionDTO);
    QuestionDTO updateQuestion(Long questionId, QuestionDTO questionDTO);
    void deleteQuestion(Long questionId);
    List<QuestionDTO> getQuestionsByExam(Long examId);
    StudentExamDTO startExam(Long examId, String studentEmail);
    void submitAnswers(Long studentExamId, List<AnswerDTO> answers);
    void gradeShortAnswer(Long answerId, int score);
    void autoSubmitExam(Long studentExamId);
    long getRemainingTime(Long examId);
    ExamDTO getExam(Long examId);
}