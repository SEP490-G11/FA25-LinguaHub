import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock login API
  http.post('*/auth/token', async ({ request }) => {
    const body = (await request.json()) as {
      username: string;
      password: string;
    };

    // Success case
    if (body.username === 'testuser' && body.password === 'password123') {
      return HttpResponse.json({
        result: {
          accessToken: 'mock-access-token-123',
          refreshToken: 'mock-refresh-token-456',
        },
      });
    }

    // Error case
    return HttpResponse.json(
      { message: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Mock get user info
  http.get('*/users/myInfo', () => {
    return HttpResponse.json({
      result: {
        userID: 1,
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'Student',
        phone: '0123456789',
        dob: '1990-01-01',
        gender: 'Male',
        country: 'Vietnam',
        address: '123 Test Street',
        bio: 'This is my bio',
        avatarURL: 'https://example.com/avatar.jpg',
      },
    });
  }),

  // Mock update user profile
  http.patch('*/users/:userId', async ({ request, params }) => {
    const body = (await request.json()) as {
      fullName?: string;
      phone?: string;
      dob?: string;
      country?: string;
      address?: string;
      bio?: string;
      avatarURL?: string;
    };

    return HttpResponse.json({
      userID: Number(params.userId),
      username: 'testuser',
      email: 'test@example.com',
      fullName: body.fullName || 'Test User',
      role: 'Student',
      phone: body.phone || '0123456789',
      dob: body.dob || '1990-01-01',
      gender: 'Male',
      country: body.country || 'Vietnam',
      address: body.address || '123 Test Street',
      bio: body.bio || 'This is my bio',
      avatarURL: body.avatarURL || 'https://example.com/avatar.jpg',
    });
  }),

  // Mock get courses list
  http.get('*/courses', () => {
    return HttpResponse.json({
      result: {
        content: [
          {
            id: 1,
            title: 'English for Beginners',
            shortDescription: 'Learn English from scratch',
            thumbnailURL: 'https://example.com/thumb1.jpg',
            categoryName: 'English',
            level: 'Beginner',
            tutorName: 'John Doe',
            learnerCount: 150,
            avgRating: 4.5,
            totalRatings: 30,
            duration: 20,
            language: 'English',
            price: 500000,
            createdAt: '2024-01-01',
            isWishListed: false,
          },
          {
            id: 2,
            title: 'Advanced Spanish',
            shortDescription: 'Master Spanish conversation',
            thumbnailURL: 'https://example.com/thumb2.jpg',
            categoryName: 'Spanish',
            level: 'Advanced',
            tutorName: 'Maria Garcia',
            learnerCount: 80,
            avgRating: 4.8,
            totalRatings: 20,
            duration: 30,
            language: 'Spanish',
            price: 750000,
            createdAt: '2024-02-01',
            isWishListed: true,
          },
        ],
        totalElements: 2,
      },
    });
  }),

  // Mock add to wishlist
  http.post('*/wishlist/:courseId', () => {
    return HttpResponse.json({ message: 'Added to wishlist' });
  }),

  // Mock remove from wishlist
  http.delete('*/wishlist/:courseId', () => {
    return HttpResponse.json({ message: 'Removed from wishlist' });
  }),

  // Mock get chat rooms
  http.get('*/chat/rooms', () => {
    return HttpResponse.json({
      result: [
        {
          chatRoomID: 1,
          tutorID: 2,
          tutorName: 'John Doe',
          tutorAvatarURL: 'https://example.com/avatar1.jpg',
          userID: 1,
          userName: 'Test User',
          userAvatarURL: 'https://example.com/avatar-user.jpg',
          chatRoomType: 'Training',
          messages: [
            {
              messageID: 1,
              content: 'Hello, how are you?',
              messageType: 'Text',
              createdAt: '2024-01-01T10:00:00Z',
            },
            {
              messageID: 2,
              content: 'I am fine, thank you!',
              messageType: 'Text',
              createdAt: '2024-01-01T10:01:00Z',
            },
          ],
        },
        {
          chatRoomID: 2,
          tutorID: 3,
          tutorName: 'Maria Garcia',
          tutorAvatarURL: 'https://example.com/avatar2.jpg',
          userID: 1,
          userName: 'Test User',
          userAvatarURL: 'https://example.com/avatar-user.jpg',
          chatRoomType: 'Advice',
          messages: [
            {
              messageID: 3,
              content: 'Thanks for the lesson!',
              messageType: 'Text',
              createdAt: '2024-01-01T09:30:00Z',
            },
          ],
        },
      ],
    });
  }),

  // Mock get chat room by ID
  http.get('*/chat/room/:roomId', ({ params }) => {
    const roomId = params.roomId;
    if (roomId === '1') {
      return HttpResponse.json({
        result: {
          chatRoomID: 1,
          title: 'Chat with John Doe',
          description: 'Training session',
          tutorID: 2,
          tutorName: 'John Doe',
          tutorAvatarURL: 'https://example.com/avatar1.jpg',
          userID: 1,
          userName: 'Test User',
          userAvatarURL: 'https://example.com/avatar-user.jpg',
          chatRoomType: 'Training',
          createdAt: '2024-01-01T09:00:00Z',
          canSendMessage: true,
          allowedMessageTypes: ['Text', 'Link', 'Image', 'File'],
          messages: [
            {
              messageID: 1,
              chatRoomID: 1,
              senderID: 2,
              senderName: 'John Doe',
              senderAvatarURL: 'https://example.com/avatar1.jpg',
              content: 'Hello, how are you?',
              messageType: 'Text',
              createdAt: '2024-01-01T10:00:00Z',
            },
            {
              messageID: 2,
              chatRoomID: 1,
              senderID: 1,
              senderName: 'Test User',
              senderAvatarURL: 'https://example.com/avatar-user.jpg',
              content: 'I am fine, thank you!',
              messageType: 'Text',
              createdAt: '2024-01-01T10:01:00Z',
            },
          ],
        },
      });
    }
    return HttpResponse.json({ result: null }, { status: 404 });
  }),

  // Mock send message
  http.post('*/chat/message', async ({ request }) => {
    const body = (await request.json()) as {
      chatRoomID: number;
      content: string;
      messageType: string;
    };
    return HttpResponse.json({
      result: {
        messageID: Date.now(),
        chatRoomID: body.chatRoomID,
        senderID: 1,
        senderName: 'Test User',
        senderAvatarURL: 'https://example.com/avatar-user.jpg',
        content: body.content,
        messageType: body.messageType,
        createdAt: new Date().toISOString(),
      },
    });
  }),

  // Mock send Google Meet link
  http.post('*/chat/room/:roomId/meeting-link', async ({ request, params }) => {
    const body = (await request.json()) as {
      content: string;
      messageType: string;
    };
    const roomId = params.roomId;
    return HttpResponse.json({
      result: {
        messageID: Date.now(),
        chatRoomID: Number(roomId),
        senderID: 2,
        senderName: 'John Doe',
        senderAvatarURL: 'https://example.com/avatar1.jpg',
        content: body.content,
        messageType: body.messageType,
        createdAt: new Date().toISOString(),
      },
    });
  }),  
  // Mock get course detail (unpurchased)
  http.get('*/courses/detail/1', () => {
    return HttpResponse.json({
      code: 200,
      result: {
        isPurchased: false,
        id: 1,
        title: 'English for Beginners',
        description: 'Learn English from scratch with comprehensive lessons',
        requirement: 'No prior knowledge required',
        objectives: ['Learn basic grammar', 'Build vocabulary', 'Practice speaking'],
        duration: 20,
        price: 500000,
        language: 'English',
        thumbnailURL: 'https://example.com/thumb1.jpg',
        categoryName: 'English',
        tutorName: 'John Doe',
        tutorAvatarURL: 'https://example.com/avatar1.jpg',
        tutorAddress: 'Hanoi, Vietnam',
        avgRating: 4.5,
        totalRatings: 30,
        createdAt: '2024-01-01',
        tutorID: 2,
        learnerCount: 150,
        section: [
          {
            sectionID: 1,
            courseID: 1,
            title: 'Section 1: Introduction',
            description: 'Introduction to the course',
            orderIndex: 1,
            lessons: [
              {
                lessonID: 1,
                title: 'Lesson 1: Welcome',
                duration: 10,
                lessonType: 'Video',
                videoURL: 'https://example.com/video1.mp4',
                content: 'Welcome to the course',
                orderIndex: 1,
                createdAt: '2024-01-01',
                resources: [],
              },
            ],
          },
        ],
        review: [
          {
            feedbackID: 1,
            userFullName: 'Student 1',
            userAvatarURL: 'https://example.com/student1.jpg',
            rating: 5,
            comment: 'Great course!',
            createdAt: '2024-01-15',
          },
        ],
        isWishListed: false,
        contentSummary: {
          totalVideoHours: 10,
          totalPracticeTests: 5,
          totalArticles: 3,
          totalDownloadableResources: 2,
        },
      },
    });
  }),

  // Mock get course detail (purchased)
  http.get('*/courses/detail/2', () => {
    return HttpResponse.json({
      code: 200,
      result: {
        isPurchased: true,
        id: 2,
        title: 'Advanced Spanish',
        description: 'Master Spanish conversation',
        requirement: 'Basic Spanish knowledge',
        objectives: ['Advanced grammar', 'Fluent speaking', 'Writing skills'],
        duration: 30,
        price: 750000,
        language: 'Spanish',
        thumbnailURL: 'https://example.com/thumb2.jpg',
        categoryName: 'Spanish',
        tutorName: 'Maria Garcia',
        tutorAvatarURL: 'https://example.com/avatar2.jpg',
        tutorAddress: 'Madrid, Spain',
        avgRating: 4.8,
        totalRatings: 20,
        createdAt: '2024-02-01',
        tutorID: 3,
        learnerCount: 80,
        section: [
          {
            sectionID: 2,
            courseID: 2,
            title: 'Section 1: Advanced Grammar',
            description: 'Deep dive into Spanish grammar',
            orderIndex: 1,
            lessons: [
              {
                lessonID: 10,
                title: 'Lesson 1: Subjunctive Mood',
                duration: 15,
                lessonType: 'Video',
                videoURL: 'https://example.com/video10.mp4',
                content: 'Learn subjunctive mood',
                orderIndex: 1,
                createdAt: '2024-02-01',
                resources: [],
              },
            ],
          },
        ],
        review: [],
        isWishListed: false,
        contentSummary: {
          totalVideoHours: 15,
          totalPracticeTests: 8,
          totalArticles: 5,
          totalDownloadableResources: 3,
        },
      },
    });
  }),

  // Mock create payment
  http.post('*/api/payments/create', async ({ request }) => {
    const body = (await request.json()) as {
      userId: number;
      targetId: number;
      paymentType: string;
    };

    return HttpResponse.json({
      checkoutUrl: 'https://pay.payos.vn/mock-checkout-url',
      paymentId: Date.now(),
      targetId: body.targetId,
      amount: body.paymentType === 'Course' ? 500000 : 750000,
    });
  }),

  // Mock get tutor detail
  http.get('*/tutors/:tutorId', ({ params }) => {
    return HttpResponse.json({
      result: {
        tutorID: Number(params.tutorId),
        fullName: 'John Smith',
        email: 'john@example.com',
        phone: '0987654321',
        avatarURL: 'https://example.com/tutor-avatar.jpg',
        bio: 'Experienced English Teacher with 10 years of teaching',
        address: 'New York, USA',
        rating: 4.8,
        totalReviews: 45,
        hourlyRate: 50,
        languages: ['English', 'Spanish'],
        specialties: ['Business English', 'IELTS Preparation'],
        education: 'Master in Education',
        experience: '10 years',
        teachingStyle: 'Interactive and student-centered',
      },
    });
  }),

  // Mock get tutor availability
  http.get('*/tutors/:tutorId/availability', () => {
    return HttpResponse.json({
      result: [
        {
          slotID: 1,
          date: '2024-12-01',
          startTime: '09:00',
          endTime: '10:00',
          isAvailable: true,
        },
        {
          slotID: 2,
          date: '2024-12-01',
          startTime: '10:00',
          endTime: '11:00',
          isAvailable: true,
        },
        {
          slotID: 3,
          date: '2024-12-01',
          startTime: '14:00',
          endTime: '15:00',
          isAvailable: true,
        },
        {
          slotID: 4,
          date: '2024-12-02',
          startTime: '09:00',
          endTime: '10:00',
          isAvailable: false,
        },
      ],
    });
  }),

  // Mock get tutor packages
  http.get('*/tutors/:tutorId/packages', () => {
    return HttpResponse.json({
      result: [
        {
          packageID: 1,
          name: 'Basic Package',
          description: '5 sessions',
          sessions: 5,
          price: 200,
          duration: 60,
        },
        {
          packageID: 2,
          name: 'Standard Package',
          description: '10 sessions',
          sessions: 10,
          price: 380,
          duration: 60,
        },
        {
          packageID: 3,
          name: 'Premium Package',
          description: '20 sessions',
          sessions: 20,
          price: 700,
          duration: 60,
        },
      ],
    });
  }),

  // Mock create booking
  http.post('*/bookings', async ({ request }) => {
    const body = (await request.json()) as {
      tutorID: number;
      slotID: number;
      packageID?: number;
      notes?: string;
    };

    // Check if mock error is set
    if (typeof localStorage !== 'undefined' && localStorage.getItem('mockBookingError') === 'true') {
      return HttpResponse.json(
        { message: 'Booking failed. Slot is no longer available.' },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      result: {
        bookingID: Date.now(),
        tutorID: body.tutorID,
        slotID: body.slotID,
        packageID: body.packageID,
        status: 'Confirmed',
        totalPrice: 50,
        createdAt: new Date().toISOString(),
        notes: body.notes,
      },
    });
  }),

  // Mock get my bookings
  http.get('*/bookings/my-bookings', () => {
    return HttpResponse.json({
      result: [
        {
          bookingID: 1,
          tutorID: 2,
          tutorName: 'John Smith',
          tutorAvatarURL: 'https://example.com/tutor-avatar.jpg',
          date: '2024-12-01',
          startTime: '09:00',
          endTime: '10:00',
          status: 'Confirmed',
          totalPrice: 50,
          packageName: 'Basic Package',
          createdAt: '2024-11-20T10:00:00Z',
        },
        {
          bookingID: 2,
          tutorID: 3,
          tutorName: 'Maria Garcia',
          tutorAvatarURL: 'https://example.com/avatar2.jpg',
          date: '2024-12-05',
          startTime: '14:00',
          endTime: '15:00',
          status: 'Pending',
          totalPrice: 60,
          packageName: 'Standard Package',
          createdAt: '2024-11-21T11:00:00Z',
        },
      ],
    });
  }),

  // Mock cancel booking
  http.delete('*/bookings/:bookingId', ({ params }) => {
    return HttpResponse.json({
      message: 'Booking cancelled successfully',
      bookingID: Number(params.bookingId),
    });
  }),

  // Mock get approved tutors list
  http.get('*/tutors/approved', () => {
    return HttpResponse.json({
      result: [
        {
          tutorId: 1,
          userName: 'John Smith',
          teachingLanguage: 'English',
          country: 'USA',
          rating: 4.8,
          pricePerHour: 50000,
          specialization: 'Business English, IELTS',
          avatarURL: 'https://example.com/john.jpg',
          availability: 'Available',
        },
        {
          tutorId: 2,
          userName: 'Maria Garcia',
          teachingLanguage: 'Spanish',
          country: 'Spain',
          rating: 4.9,
          pricePerHour: 45000,
          specialization: 'Conversation, Grammar',
          avatarURL: 'https://example.com/maria.jpg',
          availability: 'Available',
        },
        {
          tutorId: 3,
          userName: 'Yuki Tanaka',
          teachingLanguage: 'Japanese',
          country: 'Japan',
          rating: 4.7,
          pricePerHour: 60000,
          specialization: 'JLPT, Business Japanese',
          avatarURL: 'https://example.com/yuki.jpg',
          availability: 'Available',
        },
      ],
    });
  }),

  // Mock get tutor detail by ID
  http.get('*/tutors/:tutorId', ({ params }) => {
    const tutorId = Number(params.tutorId);
    const tutorDetails: Record<number, any> = {
      1: {
        tutorId: 1,
        userName: 'John Smith',
        email: 'john@example.com',
        phone: '0987654321',
        avatarURL: 'https://example.com/john.jpg',
        bio: 'Experienced English teacher with 10 years of teaching',
        country: 'USA',
        teachingLanguage: 'English',
        rating: 4.8,
        pricePerHour: 50000,
        specialization: 'Business English, IELTS',
        feedbacks: [
          { rating: 5, comment: 'Great teacher!' },
          { rating: 5, comment: 'Very helpful' },
          { rating: 4, comment: 'Good lessons' },
        ],
      },
      2: {
        tutorId: 2,
        userName: 'Maria Garcia',
        email: 'maria@example.com',
        phone: '0987654322',
        avatarURL: 'https://example.com/maria.jpg',
        bio: 'Native Spanish speaker, passionate about teaching',
        country: 'Spain',
        teachingLanguage: 'Spanish',
        rating: 4.9,
        pricePerHour: 45000,
        specialization: 'Conversation, Grammar',
        feedbacks: [
          { rating: 5, comment: 'Excellent!' },
          { rating: 5, comment: 'Amazing teacher' },
        ],
      },
      3: {
        tutorId: 3,
        userName: 'Yuki Tanaka',
        email: 'yuki@example.com',
        phone: '0987654323',
        avatarURL: 'https://example.com/yuki.jpg',
        bio: 'Certified Japanese teacher, specializing in JLPT preparation',
        country: 'Japan',
        teachingLanguage: 'Japanese',
        rating: 4.7,
        pricePerHour: 60000,
        specialization: 'JLPT, Business Japanese',
        feedbacks: [
          { rating: 5, comment: 'Very knowledgeable' },
          { rating: 4, comment: 'Good preparation' },
          { rating: 5, comment: 'Passed JLPT thanks to her!' },
        ],
      },
    };

    const tutor = tutorDetails[tutorId];
    if (tutor) {
      return HttpResponse.json(tutor);
    }
    return HttpResponse.json({ message: 'Tutor not found' }, { status: 404 });
  }),

  // Mock get tutor booking plans
  http.get('*/tutor/:tutorId/booking-plan', ({ params }) => {
    const tutorId = Number(params.tutorId);
    return HttpResponse.json({
      plans: [
        {
          booking_planid: 1,
          tutor_id: tutorId,
          title: 'T2',
          start_hours: '09:00',
          end_hours: '12:00',
          is_open: true,
          is_active: true,
        },
        {
          booking_planid: 2,
          tutor_id: tutorId,
          title: 'T3',
          start_hours: '14:00',
          end_hours: '17:00',
          is_open: true,
          is_active: true,
        },
      ],
    });
  }),
];
