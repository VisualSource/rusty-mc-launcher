import { type Id, toast, type ToastOptions } from "react-toastify";
import { Toast, type ToastData } from "@/components/ui/toast";

export const createToast = ({ closeButton = false, ...opts }: ToastOptions<ToastData>) => toast(Toast as never, { closeButton, ...opts });
export const toastSuccess = (data: Omit<ToastData, "error">) => createToast({ data, type: "success" });
export const toastWarning = (data: Omit<ToastData, "error">) => createToast({ data, type: "warning" });
export const toastError = (data: ToastData) => createToast({ data, type: "error" });
export const toastInfo = (data: Omit<ToastData, "error">) => createToast({ data, type: "info" });

export const toastLoading = (data: Pick<ToastData, "title">) => createToast({ data: { ...data, showCloseBtn: false }, isLoading: true, type: "default" });
export const toastUpdateInfo = (id: Id, data: Omit<ToastData, "error" | "showCloseBtn">) => toast.update(id, { data, type: "info", isLoading: false, autoClose: 5000 });
export const toastUpdateSuccess = (id: Id, data: Omit<ToastData, "error" | "showCloseBtn">) => toast.update(id, { data, type: "success", isLoading: false, autoClose: 5000 });
export const toastUpdateError = (id: Id, data: Omit<ToastData, "showCloseBtn">) => toast.update(id, { data, type: "error", isLoading: false, autoClose: 5000 });
export const toastUpdateProgress = (id: Id, data: ToastData & { progress: number }) => toast.update(id, { data, isLoading: true, progress: data.progress });

export const toastAwaitProimse = async <TData = unknown>(promise: Promise<TData>, data: { loading: string; error: string; success: { title: string; text?: string; } }): Promise<[TData, null] | [null, Error]> => {
    const toastId = toastLoading({ title: data.loading });
    try {
        const result = await promise;
        toastUpdateSuccess(toastId, {
            title: data.success.title,
            description: data.success.text
        });
        return [result, null];
    } catch (error) {
        toastUpdateError(toastId, { error: error as Error, title: data.error, description: (error as Error).message });
        return [null, error as Error];
    }
}

