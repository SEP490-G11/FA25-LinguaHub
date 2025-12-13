import React from 'react';
import Messages from '@/pages/MessagesPage/boxchat';
import { ROUTES } from '@/constants/routes';

const TutorMessages: React.FC = () => {
  return <Messages basePath={ROUTES.TUTOR_MESSAGES} isFullScreen={true} />;
};

export default TutorMessages;
