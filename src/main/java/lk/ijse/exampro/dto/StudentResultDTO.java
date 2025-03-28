package lk.ijse.exampro.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StudentResultDTO {
    private Long id;

    @NotNull
    private Long examId;

    @NotNull
    private String studentEmail;

    private Integer score;

    private Boolean isCompleted;
    private LocalDateTime startTime;
}