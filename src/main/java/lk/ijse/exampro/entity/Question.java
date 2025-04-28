package lk.ijse.exampro.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "questions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(nullable = false)
    private String type; // "MCQ", "TRUE_FALSE", "SHORT_ANSWER"

    @Column(nullable = false)
    private String content;

    @Column
    private String correctAnswer; // For MCQ and TRUE_FALSE

    @Column
    private String options; // JSON string for MCQ options, e.g., {"A": "Option1", "B": "Option2"}
}
