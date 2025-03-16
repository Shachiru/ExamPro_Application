package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Student;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudentRepository extends JpaRepository<Student, Long> {

    boolean existsByUser(User user);

    boolean existsByUser_Email(String email);

    Student findByUser_Email(String email);

    void deleteByUser_Email(String email);
}
