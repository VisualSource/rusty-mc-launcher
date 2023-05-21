import { useContext } from "react";
import { NotificationContext } from "../context/NotificationContext";

const useNotification = () => {
    const ctx = useContext(NotificationContext);
    if (!ctx) throw new Error("Missing notification provider");
    return ctx;
}

export default useNotification;