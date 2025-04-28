package lk.ijse.exampro.controller;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.exampro.dto.*;
import lk.ijse.exampro.exception.ExamNotStartedException;
import lk.ijse.exampro.exception.ExamSubmissionException;
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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/exam")
@CrossOrigin(origins = {"http://localhost:63342", "http://localhost:3000"})
public class ExamController {

    private static final Logger logger = LoggerFactory.getLogger(ExamController.class);

    @Autowired
    private ExamService examService;

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> getAllExams() {
        try {
            List<ExamDTO> exams = examService.getAllExams();
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Exams retrieved successfully", exams));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (SecurityException e) {
            logger.warn("Unauthorized access: {}", e.getMessage());
            return ResponseEntity.status(VarList.FORBIDDEN)
                    .body(new ResponseDTO(VarList.FORBIDDEN, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving exams: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }


    @GetMapping("/teacher-exams")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ResponseDTO> getTeacherExams(Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            List<ExamDTO> exams = examService.getExamsForTeacher(teacherEmail);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Teacher exams retrieved successfully", exams));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving teacher exams: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null));
        }
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> createExam(@RequestBody ExamDTO examDTO) {
        try {
            ExamDTO createdExam = examService.createExam(examDTO);
            return ResponseEntity.status(VarList.CREATED)
                    .body(new ResponseDTO(VarList.CREATED, "Exam created successfully", createdExam));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid exam data: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error creating exam: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @DeleteMapping("/{examId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> deleteExam(@PathVariable Long examId) {
        try {
            examService.deleteExam(examId);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Exam deleted successfully", null));
        } catch (SecurityException e) {
            logger.warn("Unauthorized deletion attempt: {}", e.getMessage());
            return ResponseEntity.status(VarList.FORBIDDEN)
                    .body(new ResponseDTO(VarList.FORBIDDEN, e.getMessage(), null));
        } catch (RuntimeException e) {
            logger.warn("Exam not found: {}", e.getMessage());
            return ResponseEntity.status(VarList.NOT_FOUND)
                    .body(new ResponseDTO(VarList.NOT_FOUND, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error deleting exam with ID {}: {}", examId, e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PutMapping("/{examId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<ResponseDTO> updateExam(@PathVariable Long examId, @RequestBody ExamDTO examDTO) {
        try {
            ExamDTO updatedExam = examService.updateExam(examId, examDTO);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Exam updated successfully", updatedExam));
        } catch (SecurityException e) {
            logger.warn("Unauthorized update attempt: {}", e.getMessage());
            return ResponseEntity.status(VarList.FORBIDDEN)
                    .body(new ResponseDTO(VarList.FORBIDDEN, e.getMessage(), null));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid exam data: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (RuntimeException e) {
            logger.warn("Exam not found: {}", e.getMessage());
            return ResponseEntity.status(VarList.NOT_FOUND)
                    .body(new ResponseDTO(VarList.NOT_FOUND, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error updating exam with ID {}: {}", examId, e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @PostMapping("/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ResponseDTO> addQuestionToExam(@RequestBody QuestionDTO questionDTO, Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            examService.addQuestionToExam(questionDTO, teacherEmail);
            return ResponseEntity.status(VarList.CREATED)
                    .body(new ResponseDTO(VarList.CREATED, "Question added successfully", null));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error adding question: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null));
        }
    }

    @GetMapping("/{examId}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ResponseDTO> getQuestionsForExam(@PathVariable Long examId, Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            List<QuestionDTO> questions = examService.getQuestionsForExam(examId, teacherEmail);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Questions retrieved successfully", questions));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving questions: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null));
        }
    }

    @GetMapping("/{examId}/student-answers")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ResponseDTO> getStudentAnswersForExam(@PathVariable Long examId, Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            List<StudentAnswerDTO> answers = examService.getStudentAnswersForExam(examId, teacherEmail);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Student answers retrieved successfully", answers));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving student answers: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null));
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
            String studentEmail = auth.getName();
            StudentResultDTO result = examService.startExam(examId, studentEmail);
            return ResponseEntity.status(VarList.CREATED)
                    .body(new ResponseDTO(VarList.CREATED, "Exam started successfully", result));
        } catch (ExamNotStartedException | ExamSubmissionException e) {
            logger.warn("Invalid exam start: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (EntityNotFoundException e) {
            logger.warn("Resource not found: {}", e.getMessage());
            return ResponseEntity.status(VarList.NOT_FOUND)
                    .body(new ResponseDTO(VarList.NOT_FOUND, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error starting exam: {}", e.getMessage(), e);
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
        } catch (RuntimeException e) {
            logger.warn("Student exam not found: {}", e.getMessage());
            return ResponseEntity.status(VarList.NOT_FOUND)
                    .body(new ResponseDTO(VarList.NOT_FOUND, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving time: {}", e.getMessage(), e);
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
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid grading data: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (RuntimeException e) {
            logger.warn("Answer not found: {}", e.getMessage());
            return ResponseEntity.status(VarList.NOT_FOUND)
                    .body(new ResponseDTO(VarList.NOT_FOUND, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error grading answer: {}", e.getMessage(), e);
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
        } catch (IllegalStateException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving students: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }

    @GetMapping("/answers-to-grade")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ResponseDTO> getAnswersToGrade(Authentication authentication) {
        try {
            String teacherEmail = authentication.getName();
            List<StudentAnswerDTO> answers = examService.getAnswersToGrade(teacherEmail);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Ungraded answers retrieved successfully", answers));
        } catch (IllegalArgumentException e) {
            logger.warn("Invalid request: {}", e.getMessage());
            return ResponseEntity.status(VarList.BAD_REQUEST)
                    .body(new ResponseDTO(VarList.BAD_REQUEST, e.getMessage(), null));
        } catch (Exception e) {
            logger.error("Error retrieving ungraded answers: {}", e.getMessage(), e);
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, "An unexpected error occurred", null));
        }
    }
}
