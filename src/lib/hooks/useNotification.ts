import { useRef } from 'react';
import Notification from '../system/Notification';
const useNotification = () => {
    const notify = useRef(Notification.getInstance());

    return {
        notify: notify.current.notify
    }
}

export default useNotification;