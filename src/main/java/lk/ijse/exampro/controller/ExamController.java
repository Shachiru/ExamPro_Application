package lk.ijse.exampro.controller;

import lk.ijse.exampro.dto.*;
import lk.ijse.exampro.service.ExamService;
import lk.ijse.exampro.util.VarList;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/exam")
@CrossOrigin(origins = "http://localhost:63342")
public class ExamController {

    private static final Logger logger = LoggerFactory.getLogger(ExamController.class);

    @Autowired
    private ExamService examService;

    @GetMapping("/all")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> getAllExams() {
        try {
            List<ExamDTO> exams = examService.getAllExams();
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Exams retrieved successfully", exams));
        } catch (Exception e) {
            logger.error("Error retrieving exams: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{examId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> deleteExam(@PathVariable Long examId) {
        try {
            examService.deleteExam(examId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Exam deleted successfully", null));
        } catch (Exception e) {
            logger.error("Error deleting exam with ID {}: {}", examId, e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('TEACHER', 'SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> createExam(@RequestBody ExamDTO examDTO) {
        try {
            ExamDTO createdExam = examService.createExam(examDTO);
            return ResponseEntity.status(VarList.CREATED)
                    .body(new ResponseDTO(VarList.CREATED, "Exam created successfully", createdExam));
        } catch (Exception e) {
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping("/{examId}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ResponseDTO> addQuestionToExam(
            @PathVariable Long examId,
            @RequestBody QuestionDTO questionDTO
    ) {
        try {
            QuestionDTO createdQuestion = examService.addQuestionToExam(examId, questionDTO);
            return ResponseEntity.status(VarList.CREATED)
                    .body(new ResponseDTO(VarList.CREATED, "Question added successfully", createdQuestion));
        } catch (Exception e) {
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping("/exams/{studentExamId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ResponseDTO> submitAnswers(
            @PathVariable Long studentExamId,
            @RequestBody List<AnswerDTO> answers) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String studentEmail = auth.getName();
            logger.info("Student {} submitting answers for studentExamId: {}", studentEmail, studentExamId);
            examService.submitAnswers(studentExamId, answers);
            logger.info("Answers submitted successfully for studentExamId: {}", studentExamId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Answers submitted successfully", null));
        } catch (SecurityException e) {
            logger.warn("Unauthorized submission attempt: {}", e.getMessage());
            return ResponseEntity.status(VarList.FORBIDDEN)
                    .body(new ResponseDTO(VarList.FORBIDDEN, e.getMessage(), null));
        } catch (IllegalStateException e) {
            logger.warn("Invalid submission timing: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (MailAuthenticationException e) {
            logger.error("Email authentication failed: {}", e.getMessage());
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, "Failed to send notification: " + e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error submitting answers: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping("/{examId}/start")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ResponseDTO> startExam(@PathVariable Long examId) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String studentEmail = auth.getName(); // Email from JWT
            StudentResultDTO result = examService.startExam(examId, studentEmail);
            return ResponseEntity.status(VarList.CREATED)
                    .body(new ResponseDTO(VarList.CREATED, "Exam started successfully", result));
        } catch (Exception e) {
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @GetMapping("/student-exams/{studentExamId}/time-remaining")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ResponseDTO> getRemainingTime(@PathVariable Long studentExamId) {
        try {
            long secondsRemaining = examService.getRemainingTimeForStudent(studentExamId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Time remaining", secondsRemaining));
        } catch (Exception e) {
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping("/answers/{answerId}/grade")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ResponseDTO> gradeShortAnswer(@PathVariable Long answerId, @RequestParam int score) {
        try {
            examService.gradeShortAnswer(answerId, score);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Answer graded successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @GetMapping("/students-by-subject/{subject}")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<ResponseDTO> getStudentsBySubject(@PathVariable String subject) {
        try {
            List<StudentResultDTO> studentResults = examService.getStudentsBySubject(subject);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Students retrieved successfully", studentResults));
        } catch (SecurityException e) {
            logger.warn("Unauthorized access: {}", e.getMessage());
            return ResponseEntity.status(VarList.FORBIDDEN)
                    .body(new ResponseDTO(VarList.FORBIDDEN, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving students: {}", e.getMessage());
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }
}