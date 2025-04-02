package lk.ijse.exampro.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lk.ijse.exampro.dto.AnswerDTO;
import lk.ijse.exampro.dto.ExamDTO;
import lk.ijse.exampro.dto.QuestionDTO;
import lk.ijse.exampro.dto.StudentResultDTO;
import lk.ijse.exampro.entity.*;
import lk.ijse.exampro.exeption.ExamNotStartedException;
import lk.ijse.exampro.exeption.ExamSubmissionException;
import lk.ijse.exampro.repository.*;
import lk.ijse.exampro.service.EmailService;
import lk.ijse.exampro.service.ExamService;
import lk.ijse.exampro.util.enums.UserRole;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class ExamServiceImpl implements ExamService {

    private static final Logger logger = LoggerFactory.getLogger(ExamServiceImpl.class);

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private StudentResultRepository studentResultRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private EmailService emailService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public ExamDTO createExam(ExamDTO examDTO) {
        User user = userRepository.findByEmail(examDTO.getCreatedByEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + examDTO.getCreatedByEmail()));
        if (user.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException("Only teachers can create exams");
        }
        Teacher teacher = teacherRepository.findByUser_Email(user.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found for user: " + user.getEmail()));

        if (examDTO.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Start time must be in the future");
        }
        if (examDTO.getDuration() <= 0) {
            throw new IllegalArgumentException("Duration must be positive");
        }

        Exam exam = modelMapper.map(examDTO, Exam.class);
        exam.setCreatedBy(user);
        exam.setSubject(examDTO.getSubject() != null ? examDTO.getSubject() : teacher.getSubject());
        exam = examRepository.save(exam);
        logger.info("Exam created: {} by {}", exam.getTitle(), teacher.getUser().getEmail());

        List<Student> students = studentRepository.findAll();
        for (Student student : students) {
            try {
                emailService.sendExamNotification(student.getUser().getEmail(), exam.getTitle(), exam.getStartTime());
            } catch (Exception e) {
                logger.error("Failed to notify {}: {}", student.getUser().getEmail(), e.getMessage());
            }
        }
        return modelMapper.map(exam, ExamDTO.class);
    }

    @Override
    public QuestionDTO addQuestionToExam(Long examId, QuestionDTO questionDTO) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found with ID: " + examId));
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user not found: " + auth.getName()));

        if (currentUser.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException("Only teachers can add questions");
        }
        if (!exam.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You are not the owner of this exam");
        }

        if (questionDTO.getType() == null || !List.of("MCQ", "TRUE_FALSE", "SHORT_ANSWER").contains(questionDTO.getType())) {
            throw new IllegalArgumentException("Invalid question type");
        }
        if (questionDTO.getType().equals("MCQ") && (questionDTO.getOptions() == null || questionDTO.getOptions().isEmpty())) {
            throw new IllegalArgumentException("MCQ questions require options");
        }

        Question question = modelMapper.map(questionDTO, Question.class);
        question.setExam(exam);
        question = questionRepository.save(question);
        return modelMapper.map(question, QuestionDTO.class);
    }

    @Override
    public QuestionDTO updateQuestion(Long questionId, QuestionDTO questionDTO) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found with ID: " + questionId));
        question.setType(questionDTO.getType());
        question.setContent(questionDTO.getContent());
        question.setCorrectAnswer(questionDTO.getCorrectAnswer());
        question.setOptions(questionDTO.getOptions());
        question = questionRepository.save(question);
        return modelMapper.map(question, QuestionDTO.class);
    }

    @Override
    public void deleteQuestion(Long questionId) {
        if (!questionRepository.existsById(questionId)) {
            throw new RuntimeException("Question not found with ID: " + questionId);
        }
        questionRepository.deleteById(questionId);
        logger.info("Question deleted with ID: {}", questionId);
    }

    @Override
    public List<QuestionDTO> getQuestionsByExam(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found with ID: " + examId));
        List<Question> questions = questionRepository.findByExam(exam);
        return questions.stream()
                .map(q -> modelMapper.map(q, QuestionDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public StudentResultDTO startExam(Long examId, String studentEmail) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found with ID: " + examId));
        User student = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with email: " + studentEmail));

        logger.info("Current time: {}, Exam start time: {}", LocalDateTime.now(), exam.getStartTime());
        if (LocalDateTime.now().isBefore(exam.getStartTime())) {
            throw new ExamNotStartedException("Exam has not started yet");
        }

        Optional<StudentResult> existingAttempt = studentResultRepository.findByStudentAndExam(student, exam);
        if (existingAttempt.isPresent()) {
            throw new ExamSubmissionException("You have already started this exam");
        }

        StudentResult studentResult = new StudentResult();
        studentResult.setStudent(student);
        studentResult.setExam(exam);
        studentResult.setIsCompleted(false);
        studentResult.setStartTime(LocalDateTime.now());
        studentResult = studentResultRepository.save(studentResult);

        return modelMapper.map(studentResult, StudentResultDTO.class);
    }

    @PreAuthorize("hasRole('STUDENT')")
    @Override
    public void submitAnswers(Long studentExamId, List<AnswerDTO> answers) {
        StudentResult studentResult = studentResultRepository.findById(studentExamId)
                .orElseThrow(() -> new RuntimeException("StudentExam not found with ID: " + studentExamId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            logger.error("Authentication is null for studentExamId: {}", studentExamId);
            throw new SecurityException("Authentication failed: No user authenticated");
        }
        String authenticatedEmail = auth.getName();
        String studentEmail = studentResult.getStudent().getEmail();
        logger.info("Authenticated email: {}, Student email: {}", authenticatedEmail, studentEmail);

        if (!authenticatedEmail.equals(studentEmail)) {
            logger.error("Email mismatch: {} vs {}", authenticatedEmail, studentEmail);
            throw new SecurityException("You are not authorized to submit answers for this exam");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startTime = studentResult.getStartTime();
        LocalDateTime endTime = startTime.plusMinutes(studentResult.getExam().getDuration());

        if (now.isBefore(startTime)) {
            throw new IllegalStateException("Exam has not yet started for you");
        }
        if (now.isAfter(endTime)) {
            throw new IllegalStateException("Exam time has expired");
        }

        for (AnswerDTO answerDTO : answers) {
            Question question = questionRepository.findById(answerDTO.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found with ID: " + answerDTO.getQuestionId()));
            Answer answer = new Answer();
            answer.setStudentResult(studentResult);
            answer.setQuestion(question);
            answer.setStudentAnswer(answerDTO.getStudentAnswer());
            if ("MCQ".equals(question.getType()) || "TRUE_FALSE".equals(question.getType())) {
                answer.setScore(answer.getStudentAnswer().equals(question.getCorrectAnswer()) ? 1 : 0);
            } else {
                answer.setScore(null);
            }
            answerRepository.save(answer);
        }

        int totalScore = answerRepository.findByStudentResult(studentResult).stream()
                .filter(a -> a.getScore() != null)
                .mapToInt(Answer::getScore)
                .sum();
        studentResult.setScore(totalScore);

        int shortAnswerCount = questionRepository.countByExamAndType(studentResult.getExam(), "SHORT_ANSWER");
        if (shortAnswerCount == 0) {
            studentResult.setIsCompleted(true);
            emailService.sendResultNotification(studentEmail, studentResult.getExam().getTitle(), studentResult.getScore());
        } else {
            studentResult.setIsCompleted(false);
            emailService.sendExamNotification(studentEmail, studentResult.getExam().getTitle(), studentResult.getExam().getStartTime());
        }
        studentResultRepository.save(studentResult);
    }

    @Override
    public void gradeShortAnswer(Long answerId, int score) {
        Answer answer = answerRepository.findById(answerId)
                .orElseThrow(() -> new RuntimeException("Answer not found with ID: " + answerId));
        if (!"SHORT_ANSWER".equals(answer.getQuestion().getType())) {
            throw new IllegalArgumentException("Can only grade SHORT_ANSWER questions");
        }
        answer.setScore(score);
        answerRepository.save(answer);

        StudentResult studentResult = answer.getStudentResult();
        List<Answer> allAnswers = answerRepository.findByStudentResult(studentResult);
        int totalScore = allAnswers.stream()
                .filter(a -> a.getScore() != null)
                .mapToInt(Answer::getScore)
                .sum();
        studentResult.setScore(totalScore);

        boolean allGraded = allAnswers.stream().allMatch(a -> a.getScore() != null);
        if (allGraded) {
            studentResult.setIsCompleted(true);
            emailService.sendResultNotification(
                    studentResult.getStudent().getEmail(),
                    studentResult.getExam().getTitle(),
                    studentResult.getScore()
            );
        }
        studentResultRepository.save(studentResult);
    }

    @Override
    public void autoSubmitExam(Long studentExamId) {
        StudentResult studentResult = studentResultRepository.findById(studentExamId)
                .orElseThrow(() -> new RuntimeException("StudentExam not found with ID: " + studentExamId));
        if (!studentResult.getIsCompleted()) {
            int totalScore = answerRepository.findByStudentResult(studentResult).stream()
                    .filter(a -> a.getScore() != null)
                    .mapToInt(Answer::getScore)
                    .sum();
            studentResult.setScore(totalScore);
            studentResult.setIsCompleted(true);
            studentResultRepository.save(studentResult);

            boolean hasUngraded = answerRepository.findByStudentResult(studentResult).stream()
                    .anyMatch(a -> a.getScore() == null);
            if (hasUngraded) {
                emailService.sendExamNotification(
                        studentResult.getStudent().getEmail(),
                        studentResult.getExam().getTitle(),
                        studentResult.getExam().getStartTime()
                );
            } else {
                emailService.sendResultNotification(
                        studentResult.getStudent().getEmail(),
                        studentResult.getExam().getTitle(),
                        studentResult.getScore()
                );
            }
            logger.info("Exam auto-submitted for studentExamId: {}", studentExamId);
        }
    }

    @Override
    public ExamDTO getExam(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        return modelMapper.map(exam, ExamDTO.class);
    }

    @Override
    public long getRemainingTimeForStudent(Long studentExamId) {
        StudentResult studentResult = studentResultRepository.findById(studentExamId)
                .orElseThrow(() -> new RuntimeException("StudentExam not found with ID: " + studentExamId));
        LocalDateTime endTime = studentResult.getStartTime().plusMinutes(studentResult.getExam().getDuration());
        LocalDateTime now = LocalDateTime.now();
        long remainingSeconds = ChronoUnit.SECONDS.between(now, endTime);
        return Math.max(remainingSeconds, 0);
    }

    @Override
    public List<StudentResultDTO> getStudentsBySubject(String subject) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new SecurityException("User not authenticated"));

        List<StudentResult> studentResults;
        if (currentUser.getRole() == UserRole.TEACHER) {
            Teacher teacher = teacherRepository.findByUser_Email(currentUser.getEmail())
                    .orElseThrow(() -> new IllegalStateException("Teacher profile not found"));
            if (!teacher.getSubject().equals(subject)) {
                throw new SecurityException("You can only view students for your subject: " + teacher.getSubject());
            }
            List<Exam> teacherExams = examRepository.findByCreatedByAndSubject(currentUser, subject);
            studentResults = studentResultRepository.findByExamIn(teacherExams);
        } else if (currentUser.getRole() == UserRole.ADMIN) {
            List<Exam> exams = examRepository.findBySubject(subject);
            studentResults = studentResultRepository.findByExamIn(exams);
        } else {
            throw new SecurityException("Only teachers and admins can access this information");
        }

        return studentResults.stream()
                .map(result -> {
                    StudentResultDTO dto = modelMapper.map(result, StudentResultDTO.class);
                    dto.setExamSubject(result.getExam().getSubject());
                    dto.setStudentEmail(result.getStudent().getEmail());
                    return dto;
                })
                .collect(Collectors.toList());
    }
}