package edu.lms.listener;//package edu.lms.listener;
//
//import edu.lms.enums.BookingStatus;
//import edu.lms.service.ChatService;
//import jakarta.persistence.PostPersist;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.BeansException;
//import org.springframework.context.ApplicationContext;
//import org.springframework.context.ApplicationContextAware;
//import org.springframework.stereotype.Component;
//
//@Slf4j
//@Component
//public class BookingListener implements ApplicationContextAware {
//
//    private static ApplicationContext applicationContext;
//
//    @Override
//    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
//        BookingListener.applicationContext = applicationContext;
//    }
//
//    @PostPersist
//    public void afterBookingPersisted(Booking booking) {
//        // Only create Training room when Booking status is Booked
//        if (booking.getStatus() == BookingStatus.Booked &&
//                booking.getUser() != null &&
//                booking.getTutor() != null) {
//
//            try {
//                if (applicationContext != null) {
//                    ChatService chatService = applicationContext.getBean(ChatService.class);
//                    chatService.ensureTrainingRoomExists(
//                            booking.getUser().getUserID(),
//                            booking.getTutor().getTutorID()
//                    );
//                    log.info("Training room ensured for Learner {} and Tutor {} after Booking creation",
//                            booking.getUser().getUserID(), booking.getTutor().getTutorID());
//                }
//            } catch (Exception e) {
//                log.error("Failed to create Training room after Booking creation", e);
//            }
//        }
//    }
//}
//
