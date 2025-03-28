package lk.ijse.exampro.controller;

import lk.ijse.exampro.dto.*;
import lk.ijse.exampro.service.ExamService;
import lk.ijse.exampro.util.VarList;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/v1/exam")
@CrossOrigin(origins = "http://localhost:63342")
public class ExamController {
    @Autowired
    private ExamService examService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('TEACHER')")
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

    /*@PostMapping("/exams/{studentExamId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ResponseDTO> submitAnswers(@PathVariable Long studentExamId, @RequestBody List<AnswerDTO> answers) {
        try {
            examService.submitAnswers(studentExamId, answers);
            return ResponseEntity.ok(new ResponseDTO(VarList.OK, "Answers submitted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(VarList.INTERNAL_SERVER_ERROR)
                    .body(new ResponseDTO(VarList.INTERNAL_SERVER_ERROR, e.getMessage(), null));
        }
    }*/

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
}