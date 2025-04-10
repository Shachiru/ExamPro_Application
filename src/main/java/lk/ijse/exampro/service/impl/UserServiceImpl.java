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
import lk.ijse.exampro.service.UserService;
import lk.ijse.exampro.util.VarList;
import lk.ijse.exampro.util.enums.UserRole;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class
UserServiceImpl implements UserDetailsService, UserService {

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

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
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
        user.setActive(true); // Set user as active by default

        try {
            System.out.println("Saving user: " + user.getEmail());
            userRepository.save(user);
            System.out.println("User saved successfully: " + user.getEmail());
        } catch (Exception e) {
            System.err.println("Error saving user: " + e.getMessage());
            throw e; // Re-throw to rollback transaction and log in DataInitializer
        }

        // Create role-specific entity based on the user's role
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
                // No additional entity needed for SUPER_ADMIN
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
    public int deleteUserByEmail(String email) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return VarList.NOT_FOUND;
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
        }
        userRepository.delete(user);
        return VarList.OK;
    }

    @Override
    public int deactivateUser(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return VarList.NOT_FOUND;
        }
        User user = userOpt.get();
        user.setActive(false);
        userRepository.save(user);
        return VarList.OK;
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

        // If the user is an ADMIN, fetch the schoolName from the Admin entity
        if (user.getRole() == UserRole.ADMIN) {
            adminRepository.findByUser(user).ifPresent(admin -> userDTO.setSchoolName(admin.getSchoolName()));
        }

        return userDTO;
    }

    /*private User convertToEntity(UserDTO userDTO) {
        User user = new User();
        user.setEmail(userDTO.getEmail());
        user.setFullName(userDTO.getFullName());
        user.setUsername(userDTO.getUsername());
        user.setPassword(userDTO.getPassword());
        user.setNic(userDTO.getNic());
        user.setPhoneNumber(userDTO.getPhoneNumber());
        user.setDateOfBirth(userDTO.getDateOfBirth());
        user.setRole(userDTO.getRole());
        user.setActive(userDTO.isActive());
        // Note: schoolName is not set here; it will be handled in the Admin entity
        return user;
    }*/

}
