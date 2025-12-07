package edu.lms.mapper;

import edu.lms.dto.response.TutorBookingPlanResponse;
import edu.lms.entity.BookingPlan;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface TutorBookingPlanMapper {
    TutorBookingPlanResponse toResponse(BookingPlan plan);
}
