package lk.ijse.exampro.service.impl;

import lk.ijse.exampro.dto.AnswerDTO;
import lk.ijse.exampro.dto.ExamDTO;
import lk.ijse.exampro.dto.QuestionDTO;
import lk.ijse.exampro.dto.StudentExamDTO;
import lk.ijse.exampro.entity.*;
import lk.ijse.exampro.repository.*;
import lk.ijse.exampro.service.EmailService;
import lk.ijse.exampro.service.ExamService;
import lk.ijse.exampro.util.enums.UserRole;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
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
    private StudentExamRepository studentExamRepository;

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

    @Override
    public ExamDTO createExam(ExamDTO examDTO) {
        User user = userRepository.findByEmail(examDTO.getCreatedByEmail());
        if (user == null || user.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException("Only teachers can create exams");
        }
        Teacher teacher = teacherRepository.findByUser_Email(user.getEmail());
        if (teacher == null) {
            throw new IllegalArgumentException("Teacher not found for user: " + user.getEmail());
        }

        if (examDTO.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Start time must be in the future");
        }
        if (examDTO.getDuration() <= 0) {
            throw new IllegalArgumentException("Duration must be positive");
        }

        Exam exam = modelMapper.map(examDTO, Exam.class);
        exam.setCreatedBy(user); // Adjusted to use Teacher
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
        // 1. Validate the exam exists
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found with ID: " + examId));

        // 2. Ensure the current user is the exam creator (teacher)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName());

        if (currentUser == null || currentUser.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException("Only teachers can add questions");
        }

        if (!exam.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You are not the owner of this exam");
        }

        // 3. Validate question data
        if (questionDTO.getType() == null || !List.of("MCQ", "TRUE_FALSE", "SHORT_ANSWER").contains(questionDTO.getType())) {
            throw new IllegalArgumentException("Invalid question type");
        }

        if (questionDTO.getType().equals("MCQ") && (questionDTO.getOptions() == null || questionDTO.getOptions().isEmpty())) {
            throw new IllegalArgumentException("MCQ questions require options");
        }

        // 4. Map DTO to entity and save
        Question question = modelMapper.map(questionDTO, Question.class);
        question.setExam(exam); // Link to the exam
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
    public StudentExamDTO startExam(Long examId, String studentEmail) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found"));
        User user = userRepository.findByEmail(studentEmail);
        if (user == null || user.getRole() != UserRole.STUDENT) {
            throw new IllegalArgumentException("Only students can take exams");
        }
        Student student = studentRepository.findByUser_Email(user.getEmail());
        if (student == null) {
            throw new IllegalArgumentException("Student not found for user: " + user.getEmail());
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = exam.getStartTime().plusMinutes(exam.getDuration());
        if (now.isBefore(exam.getStartTime()) || now.isAfter(endTime)) {
            throw new IllegalStateException("Exam is not available at this time");
        }

        StudentExam studentExam = new StudentExam();
        studentExam.setStudent(user); // Assuming StudentExam uses User
        studentExam.setExam(exam);
        studentExam.setIsCompleted(false);
        studentExam = studentExamRepository.save(studentExam);
        return modelMapper.map(studentExam, StudentExamDTO.class);
    }

    @Override
    public void submitAnswers(Long studentExamId, List<AnswerDTO> answers) {
        StudentExam studentExam = studentExamRepository.findById(studentExamId)
                .orElseThrow(() -> new RuntimeException("StudentExam not found with ID: " + studentExamId));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = studentExam.getExam().getStartTime().plusMinutes(studentExam.getExam().getDuration());
        if (now.isAfter(endTime)) {
            throw new IllegalStateException("Exam time has expired");
        }

        int score = 0;
        for (AnswerDTO answerDTO : answers) {
            Question question = questionRepository.findById(answerDTO.getQuestionId())
                    .orElseThrow(() -> new RuntimeException("Question not found with ID: " + answerDTO.getQuestionId()));
            Answer answer = modelMapper.map(answerDTO, Answer.class);
            answer.setStudentExam(studentExam);
            answer.setQuestion(question);
            answerRepository.save(answer);

            if ("MCQ".equals(question.getType()) || "TRUE_FALSE".equals(question.getType())) {
                if (answer.getStudentAnswer().equals(question.getCorrectAnswer())) {
                    score += 1; // Assuming 1 point per correct answer
                }
            }
        }

        Integer currentScore = studentExam.getScore() != null ? studentExam.getScore() : 0;
        studentExam.setScore(currentScore + score);

        // Check if the exam has short-answer questions
        int shortAnswerCount = questionRepository.countByExamAndType(studentExam.getExam(), "SHORT_ANSWER");
        if (shortAnswerCount == 0) {
            // No short answers: Mark as completed and send email
            studentExam.setIsCompleted(true);
            emailService.sendResultNotification(
                    studentExam.getStudent().getEmail(),
                    studentExam.getExam().getTitle(),
                    studentExam.getScore()
            );
        } else {
            // Short answers exist: Wait for manual grading
            studentExam.setIsCompleted(false);
        }

        studentExamRepository.save(studentExam);
    }

    @Override
    public void gradeShortAnswer(Long answerId, int score) {

    }

    @Override
    public void autoSubmitExam(Long studentExamId) {
        StudentExam studentExam = studentExamRepository.findById(studentExamId)
                .orElseThrow(() -> new RuntimeException("StudentExam not found with ID: " + studentExamId));
        if (!studentExam.getIsCompleted()) {
            studentExam.setIsCompleted(true);
            studentExam.setScore(studentExam.getScore() != null ? studentExam.getScore() : 0);
            studentExamRepository.save(studentExam);
            emailService.sendResultNotification(
                    studentExam.getStudent().getEmail(),
                    studentExam.getExam().getTitle(),
                    studentExam.getScore()
            );
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
    public long getRemainingTime(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found with ID: " + examId));
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = exam.getStartTime().plusMinutes(exam.getDuration());
        long remainingSeconds = ChronoUnit.SECONDS.between(now, endTime);
        return Math.max(remainingSeconds, 0); // Ensure no negative time
    }
}