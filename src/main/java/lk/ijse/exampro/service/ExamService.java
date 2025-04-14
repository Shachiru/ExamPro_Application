package lk.ijse.exampro.service;

import lk.ijse.exampro.dto.AnswerDTO;
import lk.ijse.exampro.dto.ExamDTO;
import lk.ijse.exampro.dto.QuestionDTO;
import lk.ijse.exampro.dto.StudentResultDTO;

import java.util.List;

public interface ExamService {
    ExamDTO createExam(ExamDTO examDTO);

    QuestionDTO addQuestionToExam(Long examId, QuestionDTO questionDTO);

    QuestionDTO updateQuestion(Long questionId, QuestionDTO questionDTO);

    void deleteQuestion(Long questionId);

    List<QuestionDTO> getQuestionsByExam(Long examId);

    StudentResultDTO startExam(Long examId, String studentEmail);

    void submitAnswers(Long studentExamId, List<AnswerDTO> answers);

    void gradeShortAnswer(Long answerId, int score);

    void autoSubmitExam(Long studentExamId);

    long getRemainingTimeForStudent(Long studentExamId);

    ExamDTO getExam(Long examId);

    List<StudentResultDTO> getStudentsBySubject(String subject);

    List<ExamDTO> getAllExams();

    void deleteExam(Long examId);

    ExamDTO updateExam(Long examId, ExamDTO examDTO);
}