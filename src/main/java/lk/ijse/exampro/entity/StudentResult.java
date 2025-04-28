package lk.ijse.exampro.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(nullable = true)
    private Integer score;

    @Column(nullable = false)
    private Boolean isCompleted;

    @Column
    private LocalDateTime startTime;
}
