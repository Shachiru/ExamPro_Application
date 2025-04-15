package lk.ijse.exampro.service.impl;

import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.entity.Admin;
import lk.ijse.exampro.entity.Student;
import lk.ijse.exampro.entity.Teacher;
import lk.ijse.exampro.entity.User;
import lk.ijse.exampro.repository.AdminRepository;
import lk.ijse.exampro.repository.StudentRepository;
import lk.ijse.exampro.repository.TeacherRepository;
import lk.ijse.exampro.repository.UserRepository;
import lk.ijse.exampro.service.CloudinaryService;
import lk.ijse.exampro.service.UserService;
import lk.ijse.exampro.util.VarList;
import lk.ijse.exampro.util.enums.UserRole;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class
UserServiceImpl implements UserDetailsService, UserService {

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
            System.out.println("Email already exists: " + userDTO.getEmail());
            return VarList.NOT_ACCEPTABLE; // Email already in use
        }
        User user = modelMapper.map(userDTO, User.class);
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setActive(true);

        try {
            System.out.println("Saving user: " + user.getEmail());
            userRepository.save(user);
            System.out.println("User saved successfully: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("Error saving user: " + e.getMessage());
            throw e;
        }

        switch (user.getRole()) {
            case ADMIN:
                Admin admin = new Admin();
                admin.setUser(user);
                admin.setSchoolName(userDTO.getSchoolName());
                adminRepository.save(admin);
                break;
            case TEACHER:
                Teacher teacher = new Teacher();
                teacher.setUser(user);
                teacher.setSubject(userDTO.getSubject());
                teacherRepository.save(teacher);
                break;
            case STUDENT:
                Student student = new Student();
                student.setUser(user);
                student.setGrade(userDTO.getGrade());
                studentRepository.save(student);
                break;
            case SUPER_ADMIN:
                break;
        }
        return VarList.CREATED;
    }

    @Override
    public List<UserDTO> getAllUsers(UserRole authenticatedRole) {
        List<User> users;
        if (authenticatedRole == UserRole.SUPER_ADMIN) {
            // Super Admin can see all users except other Super Admins
            users = userRepository.findAllByRoleNot(UserRole.SUPER_ADMIN);
        } else if (authenticatedRole == UserRole.ADMIN) {
            // Admin can see Teachers and Students
            users = userRepository.findAllByRoleIn(List.of(UserRole.TEACHER, UserRole.STUDENT));
        } else {
            throw new IllegalStateException("Invalid role for accessing users");
        }

        return users.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    @Override
    public List<UserDTO> getAllAdmins() {
        List<User> admins = userRepository.findAllByRole(UserRole.ADMIN);
        return admins.stream().map(this::convertToDTO).collect(Collectors.toList());
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
                            teacherRepository.save(teacher);
                        });
                break;
            case STUDENT:
                studentRepository.findByUser_Email(email)
                        .ifPresent(student -> {
                            student.setGrade(userDTO.getGrade() != null ? userDTO.getGrade() : student.getGrade());
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
        logger.info("Deleting profile picture for email: {}", email);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found with email: " + email));

        if (user.getProfilePicturePublicId() == null) {
            logger.info("No profile picture to delete for email: {}", email);
            throw new IOException("No profile picture found for this user");
        }

        cloudinaryService.deleteImage(user.getProfilePicturePublicId());

        user.setProfilePicture(null);
        user.setProfilePicturePublicId(null);
        userRepository.save(user);
        logger.info("Profile picture deleted for email: {}", email);

        return convertToDTO(user);
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
            teacherRepository.findByUser(user).ifPresent(teacher -> userDTO.setSubject(teacher.getSubject()));
        } else if (user.getRole() == UserRole.STUDENT) {
            studentRepository.findByUser(user).ifPresent(student -> userDTO.setGrade(student.getGrade()));
        }

        return userDTO;
    }

}
