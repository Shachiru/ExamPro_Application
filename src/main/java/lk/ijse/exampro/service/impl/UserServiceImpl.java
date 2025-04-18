package lk.ijse.exampro.service.impl;

import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.entity.*;
import lk.ijse.exampro.repository.*;
import lk.ijse.exampro.service.CloudinaryService;
import lk.ijse.exampro.service.UserService;
import lk.ijse.exampro.util.VarList;
import lk.ijse.exampro.util.enums.UserRole;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserServiceImpl implements UserDetailsService, UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private StudentRepository studentRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private ModelMapper modelMapper;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private CloudinaryService cloudinaryService;

    @Autowired
    private StudentResultRepository studentResultRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    @Lazy
    private AuthenticationManager authenticationManager;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (!user.isActive()) {
            throw new DisabledException("User account is deactivated: " + email);
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
    }

    private Collection<? extends GrantedAuthority> getAuthorities(User user) {
        String role = "ROLE_" + user.getRole().name();
        return Collections.singletonList(new SimpleGrantedAuthority(role));
    }

    @Override
    public int saveUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            return VarList.NOT_ACCEPTABLE;
        }
        if ((userDTO.getRole() == UserRole.ADMIN || userDTO.getRole() == UserRole.TEACHER) &&
                (userDTO.getSchoolName() == null || userDTO.getSchoolName().isEmpty())) {
            logger.warn("School name is required for {} registration", userDTO.getRole());
            return VarList.BAD_REQUEST;
        }
        User user = modelMapper.map(userDTO, User.class);
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setActive(true);

        userRepository.save(user);

        String schoolName = null;
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isSuperAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));

        if (userDTO.getRole() != UserRole.SUPER_ADMIN) {
            if (isSuperAdmin) {
                schoolName = userDTO.getSchoolName();
            } else if (auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
                User adminUser = userRepository.findByEmail(auth.getName()).orElse(null);
                if (adminUser != null) {
                    Admin admin = adminRepository.findByUser(adminUser).orElse(null);
                    schoolName = admin != null ? admin.getSchoolName() : null;
                }
                if (schoolName == null) {
                    logger.warn("Admin has no associated schoolName for email: {}", auth.getName());
                    return VarList.BAD_REQUEST;
                }
            } else {
                schoolName = userDTO.getSchoolName();
            }
        }

        switch (user.getRole()) {
            case ADMIN:
                Admin admin = new Admin();
                admin.setUser(user);
                admin.setSchoolName(schoolName);
                adminRepository.save(admin);
                break;
            case TEACHER:
                Teacher teacher = new Teacher();
                teacher.setUser(user);
                teacher.setSubject(userDTO.getSubject());
                teacher.setSchoolName(schoolName);
                if (teacher.getSchoolName() == null) {
                    logger.error("Failed to set schoolName for teacher: {}", userDTO.getEmail());
                    return VarList.BAD_REQUEST;
                }
                teacherRepository.save(teacher);
                break;
            case STUDENT:
                Student student = new Student();
                student.setUser(user);
                student.setGrade(userDTO.getGrade());
                student.setSchoolName(schoolName != null ? schoolName : userDTO.getSchoolName());
                studentRepository.save(student);
                break;
            case SUPER_ADMIN:
                break;
        }
        logger.info("User {} registered with schoolName: {}", userDTO.getEmail(), schoolName);
        return VarList.CREATED;
    }

    @Override
    public List<UserDTO> getAllTeachers(int page, int size, String status, String search) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Teacher> teacherPage;

        boolean isActive = status != null && status.equalsIgnoreCase("ACTIVE");
        boolean isInactive = status != null && status.equalsIgnoreCase("INACTIVE");
        boolean filterByStatus = isActive || isInactive;

        if (search != null && !search.isEmpty()) {
            if (filterByStatus) {
                teacherPage = teacherRepository.findByUser_FullNameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(
                        search, search, pageable);
                teacherPage = new PageImpl<>(
                        teacherPage.getContent().stream()
                                .filter(t -> t.getUser().isActive() == isActive)
                                .collect(Collectors.toList()),
                        pageable,
                        teacherPage.getTotalElements()
                );
            } else {
                teacherPage = teacherRepository.findByUser_FullNameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(
                        search, search, pageable);
            }
        } else if (filterByStatus) {
            teacherPage = teacherRepository.findByUser_IsActive(isActive, pageable);
        } else {
            teacherPage = teacherRepository.findAll(pageable);
        }

        return teacherPage.getContent().stream()
                .map(teacher -> convertToDTO(teacher.getUser()))
                .collect(Collectors.toList());
    }

    @Override
    public long countAllTeachers(String status, String search) {
        boolean isActive = status != null && status.equalsIgnoreCase("ACTIVE");
        boolean isInactive = status != null && status.equalsIgnoreCase("INACTIVE");
        boolean filterByStatus = isActive || isInactive;

        if (search != null && !search.isEmpty()) {
            return teacherRepository.countBySearchAndStatus(search, filterByStatus ? isActive : null);
        } else if (filterByStatus) {
            return teacherRepository.countByUser_IsActive(isActive);
        }
        return teacherRepository.count();
    }

    @Override
    public List<UserDTO> getTeachersForInstitution(String schoolName, int page, int size, String status, String search) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Teacher> teacherPage;

        boolean isActive = status != null && status.equalsIgnoreCase("ACTIVE");
        boolean isInactive = status != null && status.equalsIgnoreCase("INACTIVE");
        boolean filterByStatus = isActive || isInactive;

        if (search != null && !search.isEmpty()) {
            if (filterByStatus) {
                teacherPage = teacherRepository.findBySchoolNameAndUser_FullNameContainingIgnoreCaseOrSchoolNameAndUser_EmailContainingIgnoreCase(
                        schoolName, search, schoolName, search, pageable);
                teacherPage = new PageImpl<>(
                        teacherPage.getContent().stream()
                                .filter(t -> t.getUser().isActive() == isActive)
                                .collect(Collectors.toList()),
                        pageable,
                        teacherPage.getTotalElements()
                );
            } else {
                teacherPage = teacherRepository.findBySchoolNameAndUser_FullNameContainingIgnoreCaseOrSchoolNameAndUser_EmailContainingIgnoreCase(
                        schoolName, search, schoolName, search, pageable);
            }
        } else if (filterByStatus) {
            teacherPage = teacherRepository.findBySchoolNameAndUser_IsActive(schoolName, isActive, pageable);
        } else {
            teacherPage = teacherRepository.findBySchoolName(schoolName, pageable);
        }

        return teacherPage.getContent().stream()
                .map(teacher -> convertToDTO(teacher.getUser()))
                .collect(Collectors.toList());
    }

    @Override
    public long countTeachersForInstitution(String schoolName, String status, String search) {
        boolean isActive = status != null && status.equalsIgnoreCase("ACTIVE");
        boolean isInactive = status != null && status.equalsIgnoreCase("INACTIVE");
        boolean filterByStatus = isActive || isInactive;

        if (search != null && !search.isEmpty()) {
            return teacherRepository.countBySchoolNameAndSearchAndStatus(schoolName, search, filterByStatus ? isActive : null);
        } else if (filterByStatus) {
            return teacherRepository.countBySchoolNameAndUser_IsActive(schoolName, isActive);
        }
        return teacherRepository.countBySchoolName(schoolName);
    }

    // Other methods remain unchanged; included here for completeness
    @Override
    public List<UserDTO> getAllUsers(UserRole authenticatedRole) {
        if (authenticatedRole == UserRole.SUPER_ADMIN) {
            return userRepository.findAllByRoleNot(UserRole.SUPER_ADMIN)
                    .stream().map(this::convertToDTO).collect(Collectors.toList());
        } else if (authenticatedRole == UserRole.ADMIN) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            User adminUser = userRepository.findByEmail(auth.getName()).orElseThrow();
            Admin admin = adminRepository.findByUser(adminUser).orElseThrow();
            String schoolName = admin.getSchoolName();

            List<UserDTO> teachers = getTeachersForInstitution(schoolName, 0, Integer.MAX_VALUE, null, null);
            List<UserDTO> students = getStudentsForInstitution(schoolName);
            List<UserDTO> combined = new ArrayList<>(teachers);
            combined.addAll(students);
            return combined;
        } else {
            throw new IllegalStateException("Invalid role for accessing users");
        }
    }

    public List<UserDTO> getAllAdmins(int page, int size, String status, String search) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<User> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("role"), UserRole.ADMIN));
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("isActive"), status.equalsIgnoreCase("ACTIVE"))); // Fixed field name
            }
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), searchPattern),
                        cb.like(cb.lower(root.get("email")), searchPattern),
                        cb.like(cb.lower(root.get("username")), searchPattern)
                ));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return userRepository.findAll(spec, pageable).map(this::convertToDTO).getContent();
    }

    public long countAllAdmins(String status, String search) {
        Specification<User> spec = (root, query, cb) -> {
            List<jakarta.persistence.criteria.Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("role"), UserRole.ADMIN));
            if (status != null && !status.isEmpty()) {
                predicates.add(cb.equal(root.get("isActive"), status.equalsIgnoreCase("ACTIVE"))); // Fixed field name
            }
            if (search != null && !search.isEmpty()) {
                String searchPattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("fullName")), searchPattern),
                        cb.like(cb.lower(root.get("email")), searchPattern),
                        cb.like(cb.lower(root.get("username")), searchPattern)
                ));
            }
            return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        };
        return userRepository.count(spec);
    }

    @Override
    public List<UserDTO> getTeachersForInstitution(String schoolName) {
        List<Teacher> teachers = teacherRepository.findBySchoolName(schoolName);
        return teachers.stream()
                .map(teacher -> convertToDTO(teacher.getUser()))
                .collect(Collectors.toList());
    }

    @Override
    public List<UserDTO> getStudentsForInstitution(String schoolName) {
        List<Student> students = studentRepository.findBySchoolName(schoolName);
        return students.stream()
                .map(student -> convertToDTO(student.getUser()))
                .collect(Collectors.toList());
    }

    @Override
    public UserDTO searchUser(String email) {
        return userRepository.findByEmail(email)
                .map(user -> modelMapper.map(user, UserDTO.class))
                .orElse(null);
    }

    @Override
    public int updateUserProfile(String email, UserDTO userDTO) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return VarList.NOT_FOUND;
        }

        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            if (userDTO.getOldPassword() == null || !passwordEncoder.matches(userDTO.getOldPassword(), user.getPassword())) {
                return VarList.UNAUTHORIZED;
            }
            user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        }

        user.setFullName(userDTO.getFullName() != null ? userDTO.getFullName() : user.getFullName());
        user.setUsername(userDTO.getUsername() != null ? userDTO.getUsername() : user.getUsername());
        user.setPhoneNumber(userDTO.getPhoneNumber() != null ? userDTO.getPhoneNumber() : user.getPhoneNumber());
        user.setDateOfBirth(userDTO.getDateOfBirth() != null ? userDTO.getDateOfBirth() : user.getDateOfBirth());
        user.setProfilePicture(userDTO.getProfilePicture() != null ? userDTO.getProfilePicture() : user.getProfilePicture());

        userRepository.save(user);

        switch (user.getRole()) {
            case ADMIN:
                adminRepository.findByUser_Email(email)
                        .ifPresent(admin -> {
                            admin.setSchoolName(userDTO.getSchoolName() != null ? userDTO.getSchoolName() : admin.getSchoolName());
                            adminRepository.save(admin);
                        });
                break;
            case TEACHER:
                teacherRepository.findByUser_Email(email)
                        .ifPresent(teacher -> {
                            teacher.setSubject(userDTO.getSubject() != null ? userDTO.getSubject() : teacher.getSubject());
                            teacher.setSchoolName(userDTO.getSchoolName() != null ? userDTO.getSchoolName() : teacher.getSchoolName());
                            teacherRepository.save(teacher);
                        });
                break;
            case STUDENT:
                studentRepository.findByUser_Email(email)
                        .ifPresent(student -> {
                            student.setGrade(userDTO.getGrade() != null ? userDTO.getGrade() : student.getGrade());
                            student.setSchoolName(userDTO.getSchoolName() != null ? userDTO.getSchoolName() : student.getSchoolName());
                            studentRepository.save(student);
                        });
                break;
            case SUPER_ADMIN:
                break;
        }
        return VarList.OK;
    }

    @Override
    public int deactivateUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return VarList.NOT_FOUND;
        }
        User user = userOpt.get();
        if (user.getProfilePicturePublicId() != null) {
            try {
                cloudinaryService.deleteImage(user.getProfilePicturePublicId());
                user.setProfilePicture(null);
                user.setProfilePicturePublicId(null);
            } catch (IOException e) {
                logger.warn("Failed to delete profile picture for email {}: {}", email, e.getMessage());
            }
        }
        user.setActive(false);
        userRepository.save(user);
        return VarList.OK;
    }

    @Override
    public int activateUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            logger.warn("User not found for email: {}", email);
            return VarList.NOT_FOUND;
        }
        User user = userOpt.get();
        if (user.isActive()) {
            logger.info("User is already active: {}", email);
            return VarList.CONFLICT;
        }
        user.setActive(true);
        userRepository.save(user);
        logger.info("User activated successfully: {}", email);
        return VarList.OK;
    }

    @Override
    public int deleteUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return VarList.NOT_FOUND;
        }
        User user = userOpt.get();

        if (user.getRole() == UserRole.STUDENT) {
            List<StudentResult> studentResults = studentResultRepository.findByStudent(user);
            if (!studentResults.isEmpty()) {
                for (StudentResult studentResult : studentResults) {
                    List<Answer> answers = answerRepository.findByStudentResult(studentResult);
                    if (!answers.isEmpty()) {
                        answerRepository.deleteAll(answers);
                    }
                }
                studentResultRepository.deleteAll(studentResults);
            }
        }

        switch (user.getRole()) {
            case ADMIN:
                adminRepository.findByUser_Email(email)
                        .ifPresent(adminRepository::delete);
                break;
            case TEACHER:
                teacherRepository.findByUser_Email(email)
                        .ifPresent(teacherRepository::delete);
                break;
            case STUDENT:
                studentRepository.findByUser_Email(email)
                        .ifPresent(studentRepository::delete);
                break;
            case SUPER_ADMIN:
                break;
        }

        if (user.getProfilePicturePublicId() != null) {
            try {
                cloudinaryService.deleteImage(user.getProfilePicturePublicId());
            } catch (IOException e) {
                logger.warn("Failed to delete profile picture for email {}: {}", email, e.getMessage());
            }
        }

        userRepository.delete(user);
        return VarList.OK;
    }

    @Override
    public UserDTO uploadProfilePicture(String email, MultipartFile file) throws IOException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        if (user.getProfilePicturePublicId() != null) {
            cloudinaryService.deleteImage(user.getProfilePicturePublicId());
        }

        Map uploadResult = cloudinaryService.uploadImage(file);
        String profilePictureUrl = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        user.setProfilePicture(profilePictureUrl);
        user.setProfilePicturePublicId(publicId);
        userRepository.save(user);

        return convertToDTO(user);
    }

    @Override
    public UserDTO deleteProfilePicture(String email) throws IOException {
        logger.info("Attempting to delete profile picture for: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (user.getProfilePicturePublicId() == null || user.getProfilePicturePublicId().isEmpty()) {
            logger.warn("No profile picture exists for: {}", email);
            throw new IllegalStateException("No profile picture to delete");
        }

        try {
            cloudinaryService.deleteImage(user.getProfilePicturePublicId());
            logger.info("Deleted image from Cloudinary: {}", user.getProfilePicturePublicId());

            user.setProfilePicture(null);
            user.setProfilePicturePublicId(null);
            userRepository.save(user);

            return convertToDTO(user);
        } catch (IOException e) {
            logger.error("Cloudinary deletion failed for {}: {}", email, e.getMessage());
            throw new IOException("Failed to delete image from storage service");
        }
    }

    private UserDTO convertToDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setEmail(user.getEmail());
        userDTO.setFullName(user.getFullName());
        userDTO.setUsername(user.getUsername());
        userDTO.setNic(user.getNic());
        userDTO.setPhoneNumber(user.getPhoneNumber());
        userDTO.setDateOfBirth(user.getDateOfBirth());
        userDTO.setRole(user.getRole());
        userDTO.setActive(user.isActive());
        userDTO.setProfilePicture(user.getProfilePicture());
        userDTO.setProfilePicturePublicId(user.getProfilePicturePublicId());

        if (user.getRole() == UserRole.ADMIN) {
            adminRepository.findByUser(user).ifPresent(admin -> userDTO.setSchoolName(admin.getSchoolName()));
        } else if (user.getRole() == UserRole.TEACHER) {
            teacherRepository.findByUser(user).ifPresent(teacher -> {
                userDTO.setSubject(teacher.getSubject());
                userDTO.setSchoolName(teacher.getSchoolName());
            });
        } else if (user.getRole() == UserRole.STUDENT) {
            studentRepository.findByUser(user).ifPresent(student -> {
                userDTO.setGrade(student.getGrade());
                userDTO.setSchoolName(student.getSchoolName());
            });
        }

        return userDTO;
    }
}