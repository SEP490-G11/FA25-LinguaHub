package edu.lms.dto.request;

import lombok.Data;

@Data
public class LessonProgressRequest {
    private Boolean isDone;
    private Integer watchedDuration; //giây
}
