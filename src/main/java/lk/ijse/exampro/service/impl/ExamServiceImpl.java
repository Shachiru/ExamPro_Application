package lk.ijse.exampro.service.impl;

import jakarta.persistence.EntityNotFoundException;
import lk.ijse.exampro.dto.*;
import lk.ijse.exampro.entity.*;
import lk.ijse.exampro.exception.ExamNotStartedException;
import lk.ijse.exampro.exception.ExamSubmissionException;
import lk.ijse.exampro.repository.*;
import lk.ijse.exampro.service.EmailService;
import lk.ijse.exampro.service.ExamService;
import lk.ijse.exampro.service.UserService;
import lk.ijse.exampro.util.enums.UserRole;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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
    private AdminRepository adminRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    public ExamServiceImpl(ModelMapper modelMapper) {
        this.modelMapper = modelMapper;
        TypeMap<Exam, ExamDTO> examToExamDTO = modelMapper.createTypeMap(Exam.class, ExamDTO.class);
        examToExamDTO.addMappings(mapper -> {
            mapper.map(src -> src.getCreatedBy().getEmail(), ExamDTO::setCreatedByEmail);
            mapper.map(Exam::getSchoolName, ExamDTO::setSchoolName);
        });
        TypeMap<ExamDTO, Exam> examDTOToExam = modelMapper.createTypeMap(ExamDTO.class, Exam.class);
        examDTOToExam.addMappings(mapper -> {
            mapper.map(ExamDTO::getSchoolName, Exam::setSchoolName);
        });
    }

    @Override
    public List<ExamDTO> getExamsForTeacher(String teacherEmail) {
        Teacher teacher = teacherRepository.findByUser_Email(teacherEmail)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found for email: " + teacherEmail));

        String subject = teacher.getSubject();
        if (subject == null || subject.isEmpty()) {
            throw new IllegalArgumentException("Teacher has no assigned subject");
        }
        List<Exam> exams = examRepository.findBySubject(subject);
        return exams.stream()
                .map(exam -> new ExamDTO(exam))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void addQuestionToExam(QuestionDTO questionDTO, String teacherEmail) {
        Teacher teacher = teacherRepository.findByUser_Email(teacherEmail)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found for email: " + teacherEmail));

        String teacherSubject = teacher.getSubject();
        if (teacherSubject == null || teacherSubject.isEmpty()) {
            throw new IllegalArgumentException("Teacher has no assigned subject");
        }

        Exam exam = examRepository.findById(questionDTO.getExamId())
                .orElseThrow(() -> new IllegalArgumentException("Exam not found with ID: " + questionDTO.getExamId()));

        if (!exam.getSubject().equals(teacherSubject)) {
            throw new IllegalArgumentException("Teacher is not authorized to add questions to this exam");
        }

        if (!List.of("MCQ", "TRUE_FALSE", "SHORT_ANSWER").contains(questionDTO.getType())) {
            throw new IllegalArgumentException("Invalid question type: " + questionDTO.getType());
        }

        Question question = new Question();
        question.setExam(exam);
        question.setType(questionDTO.getType());
        question.setContent(questionDTO.getContent());
        question.setCorrectAnswer(questionDTO.getCorrectAnswer());
        question.setOptions(questionDTO.getOptions());

        questionRepository.save(question);
    }

    @Override
    public List<QuestionDTO> getQuestionsForExam(Long examId, String teacherEmail) {
        Teacher teacher = teacherRepository.findByUser_Email(teacherEmail)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found for email: " + teacherEmail));
        String teacherSubject = teacher.getSubject();
        if (teacherSubject == null || teacherSubject.isEmpty()) {
            throw new IllegalArgumentException("Teacher has no assigned subject");
        }

        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found with ID: " + examId));
        if (!exam.getSubject().equals(teacherSubject)) {
            throw new IllegalArgumentException("Teacher is not authorized to view questions for this exam");
        }

        List<Question> questions = questionRepository.findByExamId(examId);
        return questions.stream()
                .map(question -> {
                    QuestionDTO dto = new QuestionDTO();
                    dto.setExamId(examId);
                    dto.setType(question.getType());
                    dto.setContent(question.getContent());
                    dto.setCorrectAnswer(question.getCorrectAnswer());
                    dto.setOptions(question.getOptions());
                    dto.setSubject(exam.getSubject());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentAnswerDTO> getStudentAnswersForExam(Long examId, String teacherEmail) {
        Teacher teacher = teacherRepository.findByUser_Email(teacherEmail)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found for email: " + teacherEmail));
        String teacherSubject = teacher.getSubject();
        if (teacherSubject == null || teacherSubject.isEmpty()) {
            throw new IllegalArgumentException("Teacher has no assigned subject");
        }
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new IllegalArgumentException("Exam not found with ID: " + examId));
        if (!exam.getSubject().equals(teacherSubject)) {
            throw new IllegalArgumentException("Teacher is not authorized to view answers for this exam");
        }
        List<Answer> answers = answerRepository.findByQuestion_Exam_Id(examId);
        return answers.stream()
                .map(answer -> {
                    Question question = answer.getQuestion();
                    StudentResult studentResult = answer.getStudentResult();
                    Student student = studentRepository.findByUser_Email(studentResult.getStudent().getEmail())
                            .orElseThrow(() -> new IllegalArgumentException("Student not found for email: " + studentResult.getStudent().getEmail()));
                    StudentAnswerDTO dto = new StudentAnswerDTO();
                    dto.setStudentId(student.getStudent_id());
                    dto.setStudentName(student.getUser().getFullName());
                    dto.setStudentEmail(student.getUser().getEmail());
                    dto.setQuestionId(question.getId());
                    dto.setQuestionContent(question.getContent());
                    dto.setStudentAnswer(answer.getStudentAnswer());
                    dto.setCorrectAnswer(question.getCorrectAnswer());
                    dto.setAnswerScore(answer.getScore());
                    dto.setTotalScore(studentResult.getScore());
                    dto.setIsCompleted(studentResult.getIsCompleted());
                    dto.setSubject(exam.getSubject());
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Override
    public ExamDTO createExam(ExamDTO examDTO) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + auth.getName()));

        if (user.getRole() != UserRole.SUPER_ADMIN && user.getRole() != UserRole.ADMIN) {
            throw new IllegalArgumentException("Only super admins and admins can create exams");
        }

        if (examDTO.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Start time must be in the future");
        }
        if (examDTO.getDuration() <= 0) {
            throw new IllegalArgumentException("Duration must be positive");
        }
        if (examDTO.getSubject() == null) {
            throw new IllegalArgumentException("Subject is required for exam creation");
        }

        Exam exam = modelMapper.map(examDTO, Exam.class);
        exam.setCreatedBy(user);
        exam.setSubject(examDTO.getSubject());

        if (user.getRole() == UserRole.ADMIN) {
            Admin admin = adminRepository.findByUser(user)
                    .orElseThrow(() -> new IllegalArgumentException("Admin profile not found for user: " + user.getEmail()));
            exam.setSchoolName(admin.getSchoolName());
        }
        if (user.getRole() == UserRole.SUPER_ADMIN && examDTO.getSchoolName() != null) {
            exam.setSchoolName(examDTO.getSchoolName());
        }

        exam = examRepository.save(exam);
        logger.info("Exam created: {} by {}", exam.getTitle(), user.getEmail());

        List<Student> students;
        if (user.getRole() == UserRole.ADMIN) {
            Admin admin = adminRepository.findByUser(user)
                    .orElseThrow(() -> new IllegalArgumentException("Admin profile not found for user: " + user.getEmail()));
            students = studentRepository.findBySchoolName(admin.getSchoolName());
        } else {
            students = studentRepository.findAll();
        }
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
    public List<ExamDTO> getAllExams() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + auth.getName()));

        List<Exam> exams;
        if (user.getRole() == UserRole.ADMIN) {
            Admin admin = adminRepository.findByUser(user)
                    .orElseThrow(() -> new IllegalArgumentException("Admin profile not found for user: " + user.getEmail()));
            exams = examRepository.findBySchoolName(admin.getSchoolName());
        } else if (user.getRole() == UserRole.SUPER_ADMIN) {
            exams = examRepository.findAll();
        } else {
            throw new SecurityException("Only super admins and admins can retrieve exams");
        }
        return exams.stream()
                .map(exam -> modelMapper.map(exam, ExamDTO.class))
                .collect(Collectors.toList());
    }

    @Override
    public ExamDTO updateExam(Long examId, ExamDTO examDTO) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found with ID: " + examId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user not found: " + auth.getName()));

        if (!exam.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new SecurityException("You are not authorized to update this exam");
        }

        if (examDTO.getStartTime().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Start time must be in the future");
        }
        if (examDTO.getDuration() <= 0) {
            throw new IllegalArgumentException("Duration must be positive");
        }
        if (examDTO.getSubject() == null) {
            throw new IllegalArgumentException("Subject is required");
        }

        exam.setTitle(examDTO.getTitle());
        exam.setSubject(examDTO.getSubject());
        exam.setStartTime(examDTO.getStartTime());
        exam.setDuration(examDTO.getDuration());
        exam.setExamType(examDTO.getExamType());

        if (currentUser.getRole() == UserRole.ADMIN) {
            Admin admin = adminRepository.findByUser(currentUser)
                    .orElseThrow(() -> new IllegalArgumentException("Admin profile not found for user: " + currentUser.getEmail()));
            exam.setSchoolName(admin.getSchoolName());
        }
        if (currentUser.getRole() == UserRole.SUPER_ADMIN) {
            exam.setSchoolName(examDTO.getSchoolName());
        }

        exam = examRepository.save(exam);
        logger.info("Exam updated: {} by {}", exam.getTitle(), currentUser.getEmail());
        return modelMapper.map(exam, ExamDTO.class);
    }

    @Override
    public void deleteExam(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new RuntimeException("Exam not found with ID: " + examId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user not found: " + auth.getName()));

        if (!exam.getCreatedBy().getId().equals(currentUser.getId())) {
            throw new SecurityException("You are not authorized to delete this exam");
        }

        List<StudentResult> studentResults = studentResultRepository.findByExam(exam);
        if (!studentResults.isEmpty()) {
            for (StudentResult studentResult : studentResults) {
                List<Answer> answers = answerRepository.findByStudentResult(studentResult);
                if (!answers.isEmpty()) {
                    answerRepository.deleteAll(answers);
                }
            }
            studentResultRepository.deleteAll(studentResults);
        }
        List<Question> questions = questionRepository.findByExam(exam);
        if (!questions.isEmpty()) {
            questionRepository.deleteAll(questions);
        }
        examRepository.delete(exam);
        logger.info("Exam deleted with ID: {}", examId);
    }

    @Override
    public QuestionDTO updateQuestion(Long questionId, QuestionDTO questionDTO) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new RuntimeException("Question not found with ID: " + questionId));

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user not found: " + auth.getName()));

        if (currentUser.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException("Only teachers can update questions");
        }

        Teacher teacher = teacherRepository.findByUser_Email(currentUser.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Teacher profile not found for user: " + currentUser.getEmail()));
        if (!teacher.getSubject().equals(question.getExam().getSubject())) {
            throw new IllegalArgumentException("You can only update questions for exams in your subject: " + teacher.getSubject());
        }

        if ("MCQ".equals(questionDTO.getType())) {
            if (questionDTO.getOptions() == null || questionDTO.getOptions().isEmpty()) {
                throw new IllegalArgumentException("MCQ questions require options");
            }
            if (questionDTO.getCorrectAnswer() == null || !questionDTO.getOptions().contains(questionDTO.getCorrectAnswer())) {
                throw new IllegalArgumentException("MCQ questions require a valid correct answer from the options");
            }
        }
        if ("TRUE_FALSE".equals(questionDTO.getType()) && (questionDTO.getCorrectAnswer() == null || !List.of("TRUE", "FALSE").contains(questionDTO.getCorrectAnswer().toUpperCase()))) {
            throw new IllegalArgumentException("True/False questions require a valid correct answer (TRUE or FALSE)");
        }

        question.setType(questionDTO.getType());
        question.setContent(questionDTO.getContent());
        question.setCorrectAnswer(questionDTO.getCorrectAnswer());
        question.setOptions(questionDTO.getOptions());
        question = questionRepository.save(question);
        logger.info("Question updated: {}", question.getContent());
        return modelMapper.map(question, QuestionDTO.class);
    }

    @Override
    public void deleteQuestion(Long questionId) {
        if (!questionRepository.existsById(questionId)) {
            throw new RuntimeException("Question not found with ID: " + questionId);
        }
        Question question = questionRepository.findById(questionId).orElseThrow();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new SecurityException("Authenticated user not found: " + auth.getName()));

        if (currentUser.getRole() != UserRole.TEACHER) {
            throw new IllegalArgumentException("Only teachers can delete questions");
        }

        Teacher teacher = teacherRepository.findByUser_Email(currentUser.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Teacher profile not found for user: " + currentUser.getEmail()));
        if (!teacher.getSubject().equals(question.getExam().getSubject())) {
            throw new IllegalArgumentException("You can only delete questions for exams in your subject: " + teacher.getSubject());
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
        User studentUser = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new EntityNotFoundException("Student not found with email: " + studentEmail));
        Student student = studentRepository.findByUser_Email(studentEmail)
                .orElseThrow(() -> new EntityNotFoundException("Student profile not found for email: " + studentEmail));

        logger.info("Current time: {}, Exam start time: {}", LocalDateTime.now(), exam.getStartTime());
        if (LocalDateTime.now().isBefore(exam.getStartTime())) {
            throw new ExamNotStartedException("Exam has not started yet");
        }

        Optional<StudentResult> existingAttempt = studentResultRepository.findByStudentAndExam(studentUser, exam);
        if (existingAttempt.isPresent()) {
            throw new ExamSubmissionException("You have already started this exam");
        }

        StudentResult studentResult = new StudentResult();
        studentResult.setStudent(studentUser);
        studentResult.setExam(exam);
        studentResult.setIsCompleted(false);
        studentResult.setStartTime(LocalDateTime.now());
        studentResult = studentResultRepository.save(studentResult);

        return modelMapper.map(studentResult, StudentResultDTO.class);
    }

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

        if (!authenticatedEmail.equals(studentEmail)) {
            throw new SecurityException("You are not authorized to submit answers for this exam");
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endTime = studentResult.getStartTime().plusMinutes(studentResult.getExam().getDuration());
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
                if (question.getCorrectAnswer() == null) {
                    throw new IllegalStateException("Correct answer not set for question ID: " + question.getId());
                }
                answer.setScore(answerDTO.getStudentAnswer().equals(question.getCorrectAnswer()) ? 1 : 0);
            } else {
                answer.setScore(null);
            }
            answerRepository.save(answer);
        }

        List<Answer> allAnswers = answerRepository.findByStudentResult(studentResult);
        int autoGradedScore = allAnswers.stream()
                .filter(a -> a.getScore() != null)
                .mapToInt(Answer::getScore)
                .sum();
        studentResult.setScore(autoGradedScore);

        int shortAnswerCount = questionRepository.countByExamAndType(studentResult.getExam(), "SHORT_ANSWER");
        if (shortAnswerCount == 0) {
            studentResult.setIsCompleted(true);
            studentResultRepository.save(studentResult);
            emailService.sendResultNotification(studentEmail, studentResult.getExam().getTitle(), autoGradedScore);
        } else {
            studentResult.setIsCompleted(false);
            studentResultRepository.save(studentResult);
            Teacher teacher = teacherRepository.findByUser_Email(studentResult.getExam().getCreatedBy().getEmail())
                    .orElseThrow(() -> new IllegalStateException("Teacher not found"));
            emailService.sendGradingNotification(teacher.getUser().getEmail(), studentResult.getExam().getTitle(), studentEmail);
            emailService.sendSubmissionNotification(studentEmail, studentResult.getExam().getTitle());
        }
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
        boolean allGraded = allAnswers.stream().allMatch(a -> a.getScore() != null);

        if (allGraded) {
            int totalScore = allAnswers.stream().mapToInt(Answer::getScore).sum();
            studentResult.setScore(totalScore);
            studentResult.setIsCompleted(true);
            studentResultRepository.save(studentResult);
            emailService.sendResultNotification(studentResult.getStudent().getEmail(), studentResult.getExam().getTitle(), totalScore);
        }
    }

    @Override
    public void autoSubmitExam(Long studentExamId) {
        StudentResult studentResult = studentResultRepository.findById(studentExamId)
                .orElseThrow(() -> new RuntimeException("StudentExam not found with ID: " + studentExamId));
        if (!studentResult.getIsCompleted()) {
            List<Answer> allAnswers = answerRepository.findByStudentResult(studentResult);
            int autoGradedScore = allAnswers.stream()
                    .filter(a -> a.getScore() != null)
                    .mapToInt(Answer::getScore)
                    .sum();
            studentResult.setScore(autoGradedScore);
            studentResult.setIsCompleted(true);
            studentResultRepository.save(studentResult);

            boolean hasUngraded = allAnswers.stream().anyMatch(a -> a.getScore() == null);
            if (hasUngraded) {
                Teacher teacher = teacherRepository.findByUser_Email(studentResult.getExam().getCreatedBy().getEmail())
                        .orElseThrow(() -> new IllegalStateException("Teacher not found"));
                emailService.sendGradingNotification(teacher.getUser().getEmail(), studentResult.getExam().getTitle(), studentResult.getStudent().getEmail());
            } else {
                emailService.sendResultNotification(studentResult.getStudent().getEmail(), studentResult.getExam().getTitle(), autoGradedScore);
            }
            logger.info("Exam auto-submitted for studentExamId: {}", studentExamId);
        }
    }

    @Override
    public List<StudentAnswerDTO> getAnswersToGrade(String teacherEmail) {
        Teacher teacher = teacherRepository.findByUser_Email(teacherEmail)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found for email: " + teacherEmail));
        String teacherSubject = teacher.getSubject();
        if (teacherSubject == null || teacherSubject.isEmpty()) {
            throw new IllegalArgumentException("Teacher has no assigned subject");
        }

        List<Exam> exams = examRepository.findBySubject(teacherSubject);
        if (exams.isEmpty()) {
            return List.of();
        }

        List<StudentAnswerDTO> ungradedAnswers = new ArrayList<>();
        for (Exam exam : exams) {
            // Get answers for the exam
            List<Answer> answers = answerRepository.findByQuestion_Exam_Id(exam.getId());
            for (Answer answer : answers) {
                if (answer.getScore() == null && "SHORT_ANSWER".equals(answer.getQuestion().getType())) {
                    Question question = answer.getQuestion();
                    StudentResult studentResult = answer.getStudentResult();
                    Student student = studentRepository.findByUser_Email(studentResult.getStudent().getEmail())
                            .orElseThrow(() -> new IllegalArgumentException("Student not found for email: " + studentResult.getStudent().getEmail()));

                    StudentAnswerDTO dto = new StudentAnswerDTO();
                    dto.setStudentId(student.getStudent_id());
                    dto.setStudentName(student.getUser().getFullName());
                    dto.setStudentEmail(student.getUser().getEmail());
                    dto.setQuestionId(question.getId());
                    dto.setQuestionContent(question.getContent());
                    dto.setStudentAnswer(answer.getStudentAnswer());
                    dto.setCorrectAnswer(question.getCorrectAnswer());
                    dto.setAnswerScore(answer.getScore());
                    dto.setTotalScore(studentResult.getScore());
                    dto.setIsCompleted(studentResult.getIsCompleted());
                    dto.setSubject(exam.getSubject());
                    ungradedAnswers.add(dto);
                }
            }
        }

        return ungradedAnswers;
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
