package edu.lms.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import static lombok.AccessLevel.PRIVATE;

@Entity
@Table(name = "teaching_language")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = PRIVATE)
public class TeachingLanguage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;                     // AUTO_INCREMENT

    @Column(name = "name_vi", nullable = false)
    String nameVi;               // Tiếng Anh, Tiếng Nhật...

    @Column(name = "name_en", nullable = false)
    String nameEn;               // English, Japanese...

    @Column(name = "is_active")
    Boolean isActive;            // dùng để ẩn/hiện

    @Column(name = "display_order")
    Integer displayOrder;        // thứ tự hiển thị

    String thumbnailUrl;         // ảnh cho trang /languages

    String difficulty;           // "Easy", "Medium", "Hard" (tuỳ bạn)

    String certificates;         // "IELTS,TOEFL,Cambridge"
}
