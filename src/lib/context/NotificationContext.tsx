import { isPermissionGranted, requestPermission, sendNotification, type Options } from '@tauri-apps/api/notification';
import { createContext, useState } from 'react';
import update from 'immutability-helper';
import { toast } from 'react-toastify';

type NotificationProp = Options & { type: "success" | "error" | "warn" }

type NotificationClient = {
    notify: (msg: NotificationProp, openToast?: boolean) => Promise<void>,
    toast: {
        success: (msg: NotificationProp) => void,
        alert: (msg: NotificationProp) => void
    },
    history: NotificationProp[]
}

const TOAST_TIMEOUT = 10_000;

export const NotificationContext = createContext<NotificationClient | null>(null);

const NotificationProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [history, setHistory] = useState<NotificationProp[]>([]);

    return (
        <NotificationContext.Provider value={{
            history,
            toast: {
                alert(msg) {
                    setHistory(data => update(data, { $push: [msg] }))
                    toast.error(msg.title, {
                        position: "bottom-right",
                        autoClose: TOAST_TIMEOUT,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: false,
                        theme: "dark",
                    });
                },
                success(msg) {
                    setHistory(data => update(data, { $push: [msg] }))
                    toast.success(msg.title, {
                        position: "bottom-right",
                        autoClose: TOAST_TIMEOUT,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: false,
                        theme: "dark",
                    });
                },
            },
            async notify(msg, openToast = false) {
                setHistory(data => update(data, { $push: [msg] }));

                const allowed = await new Promise(async (ok) => {
                    let permission = await isPermissionGranted();
                    if (!permission) {
                        const request = await requestPermission();
                        permission = request === "granted";
                    }
                    ok(allowed)
                });

                if (openToast) {
                    switch (msg.type) {
                        case "success": {
                            toast.success(msg.title, {
                                position: "bottom-right",
                                autoClose: TOAST_TIMEOUT,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: false,
                                theme: "dark",
                            });
                            break;
                        }
                        case "error": {
                            toast.error(msg.title, {
                                position: "bottom-right",
                                autoClose: TOAST_TIMEOUT,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: false,
                                theme: "dark",
                            });
                            break;
                        }
                        case "warn": {
                            toast.warn(msg.title, {
                                position: "bottom-right",
                                autoClose: TOAST_TIMEOUT,
                                hideProgressBar: false,
                                closeOnClick: true,
                                pauseOnHover: true,
                                draggable: false,
                                theme: "dark",
                            });
                            break;
                        }
                    }
                }

                if (allowed) sendNotification({ ...msg, icon: "./logo.svg" });
            },
        }}>
            {children}
        </NotificationContext.Provider>
    )
}

export default NotificationProvider;