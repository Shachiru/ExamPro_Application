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
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
@Transactional
public class UserServiceImpl implements UserDetailsService, UserService {

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

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email);
        return new org.springframework.security.core.userdetails.User(user.getEmail(), user.getPassword(), getAuthority(user));
    }

    public UserDTO loadUserDetailsByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(username);
        return modelMapper.map(user, UserDTO.class);
    }

    private Set<SimpleGrantedAuthority> getAuthority(User user) {
        Set<SimpleGrantedAuthority> authorities = new HashSet<>();

        if (adminRepository.existsByUser(user)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        } else if (studentRepository.existsByUser(user)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_STUDENT"));
        } else if (teacherRepository.existsByUser(user)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_TEACHER"));
        } else {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }
        return authorities;
    }

    @Override
    public UserDTO searchUser(String username) {
        if (userRepository.existsByEmail(username)) {
            User user = userRepository.findByEmail(username);
            return modelMapper.map(user, UserDTO.class);
        } else {
            return null;
        }
    }

    @Override
    public int deleteUserByEmail(String email) {
        if (userRepository.existsByEmail(email)) {
            userRepository.deleteByEmail(email);
            return VarList.OK;
        } else {
            return VarList.NOT_FOUND;
        }
    }

    @Override
    public int saveUser(UserDTO userDTO) {
        if (userRepository.existsByEmail(userDTO.getEmail())) {
            return VarList.NOT_ACCEPTABLE;
        }

        if (userDTO.getRole() == null) {  // Check if role is null
            return VarList.NOT_ACCEPTABLE;  // Invalid role
        }

        UserRole role;
        try {
            role = userDTO.getRole();
        } catch (IllegalArgumentException e) {
            return VarList.NOT_ACCEPTABLE;  // Invalid role
        }

        BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        userDTO.setPassword(passwordEncoder.encode(userDTO.getPassword()));

        User user = modelMapper.map(userDTO, User.class);
        user.setNic(userDTO.getNic());
        user.setRole(role);
        userRepository.save(user);

        switch (role) {
            case ADMIN:
                Admin admin = new Admin();
                admin.setUser(user);
                admin.setSchoolName(userDTO.getSchoolName());
                adminRepository.save(admin);
                break;

            case STUDENT:
                Student student = new Student();
                student.setUser(user);
                student.setGrade(userDTO.getGrade());
                studentRepository.save(student);
                break;

            case TEACHER:
                Teacher teacher = new Teacher();
                teacher.setUser(user);
                teacher.setSubject(userDTO.getSubject());
                teacherRepository.save(teacher);
                break;
        }

        return VarList.CREATED;
    }

    @Override
    public int updateUserProfile(String email, UserDTO userDTO) {
        if (!userRepository.existsByEmail(email)) {
            return VarList.NOT_FOUND; // User doesn’t exist
        }

        User existingUser = userRepository.findByEmail(email);
        UserRole role = existingUser.getRole();

        // Update common fields
        existingUser.setFullName(userDTO.getFullName() != null ? userDTO.getFullName() : existingUser.getFullName());
        existingUser.setUsername(userDTO.getUsername() != null ? userDTO.getUsername() : existingUser.getUsername());
        existingUser.setPhoneNumber(userDTO.getPhoneNumber() != null ? userDTO.getPhoneNumber() : existingUser.getPhoneNumber());
       // existingUser.setProfilePicture(userDTO.getProfilePicture() != null ? userDTO.getProfilePicture() : existingUser.getProfilePicture());
        existingUser.setDateOfBirth(userDTO.getDateOfBirth() != null ? userDTO.getDateOfBirth() : existingUser.getDateOfBirth());

        // Update password if provided
        if (userDTO.getPassword() != null && !userDTO.getPassword().isEmpty()) {
            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
            existingUser.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        }

        // Save updated user
        userRepository.save(existingUser);

        // Update role-specific fields
        switch (role) {
            case ADMIN:
                if (adminRepository.existsByUser(existingUser)) {
                    Admin admin = adminRepository.findByUser_Email(email);
                    admin.setSchoolName(userDTO.getSchoolName() != null ? userDTO.getSchoolName() : admin.getSchoolName());
                    adminRepository.save(admin);
                }
                break;

            case STUDENT:
                if (studentRepository.existsByUser(existingUser)) {
                    Student student = studentRepository.findByUser_Email(email);
                    student.setGrade(userDTO.getGrade() != null ? userDTO.getGrade() : student.getGrade());
                    studentRepository.save(student);
                }
                break;

            case TEACHER:
                if (teacherRepository.existsByUser(existingUser)) {
                    Teacher teacher = teacherRepository.findByUser_Email(email);
                    teacher.setSubject(userDTO.getSubject() != null ? userDTO.getSubject() : teacher.getSubject());
                    teacherRepository.save(teacher);
                }
                break;
        }

        return VarList.OK; // Success
    }

}
