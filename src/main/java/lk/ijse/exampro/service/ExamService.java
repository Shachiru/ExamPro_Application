package lk.ijse.exampro.service;

import lk.ijse.exampro.dto.*;

import java.util.List;

public interface ExamService {
    List<ExamDTO> getAllExams();

    List<ExamDTO> getExamsForTeacher(String teacherEmail);

    ExamDTO createExam(ExamDTO examDTO);

    void deleteExam(Long examId);

    ExamDTO updateExam(Long examId, ExamDTO examDTO);

    void addQuestionToExam(QuestionDTO questionDTO, String teacherEmail);

    List<QuestionDTO> getQuestionsForExam(Long examId, String teacherEmail);

    List<StudentAnswerDTO> getStudentAnswersForExam(Long examId, String teacherEmail);

    void submitAnswers(Long studentExamId, List<AnswerDTO> answers);

    StudentResultDTO startExam(Long examId, String studentEmail);

    long getRemainingTimeForStudent(Long studentExamId);

    void gradeShortAnswer(Long answerId, int score);

    List<StudentResultDTO> getStudentsBySubject(String subject);

    QuestionDTO updateQuestion(Long questionId, QuestionDTO questionDTO);

    void deleteQuestion(Long questionId);

    List<QuestionDTO> getQuestionsByExam(Long examId);

    ExamDTO getExam(Long examId);

    void autoSubmitExam(Long studentExamId);

    List<StudentAnswerDTO> getAnswersToGrade(String teacherEmail);
}
