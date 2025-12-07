package edu.lms.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "setting")
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Setting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    // Hoa hồng cho khóa học
    @Column(nullable = false)
    BigDecimal commissionCourse;

    // Hoa hồng cho booking 1:1
    @Column(nullable = false)
    BigDecimal commissionBooking;
}
