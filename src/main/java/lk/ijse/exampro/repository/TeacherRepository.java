package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Teacher;
import lk.ijse.exampro.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUser(User user);

    Optional<Teacher> findByUser_Email(String email);

    List<Teacher> findBySchoolName(String schoolName);
}
