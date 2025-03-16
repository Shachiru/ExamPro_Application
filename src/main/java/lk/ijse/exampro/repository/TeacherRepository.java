package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Teacher;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {

    boolean existsByUser(User user);

    boolean existsByUser_Email(String email);

    Teacher findByUser_Email(String email);

    void deleteByUser_Email(String email);
}
