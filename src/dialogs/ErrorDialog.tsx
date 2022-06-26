import { Dialog, Classes, Button, Intent } from "@blueprintjs/core";
import { atom, useRecoilState, useSetRecoilState } from 'recoil';


const ERROR_DIALOG = atom<{open: boolean, error: Error }>({ 
    key: "ERROR_DIALOG",
    default: {
        open: false,
        error: new Error("")
    }
 });

export const useErrorDialog = () => {
    const state = useSetRecoilState(ERROR_DIALOG);
    return state;
}

export default function ErrorDialog(){
    const [state,setState] = useRecoilState(ERROR_DIALOG);

    const close = () => setState({ open: false, error: new Error("") });

    return (
        <Dialog isOpen={state.open} title="Error" onClose={close} canEscapeKeyClose className="bp4-dark">
            <div className={Classes.DIALOG_BODY}>
             {state.error.message}
            </div>
            <div className={Classes.DIALOG_FOOTER}>
                <div className={Classes.DIALOG_FOOTER_ACTIONS}>
                        <Button intent={Intent.PRIMARY} text="Ok" onClick={close}/>
                </div>
            </div>
        </Dialog>
    );
}