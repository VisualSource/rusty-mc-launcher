import { createContext, useContext, useEffect, useState } from "react";
import { Account } from "../../types";
import {Logout,Login, RefreshToken} from '../../lib/auth';
import { toast } from "react-toastify";
interface User {
    profile: Account | null;
    active: boolean;
    loading: boolean;
    login: () => {}
    logout: () => {}
}

//@ts-ignore
export const UserContext = createContext<User>();

export function UserProvider(props: any) {
    const [active,setActice] = useState<boolean>(false);
    const [profile,setProfile] = useState<Account | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(()=>{
        const init = async () => {
           try {
                setLoading(true);
                const active = localStorage.getItem("active_user");
                if(!active) {
                    setActice(false);
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                const user = await RefreshToken(active);
            
                setProfile(user);
                setActice(true);

                setLoading(false);
           } catch (error) {
                setLoading(false);
                toast.error("Failed to log user in");
                console.error(error);
           }
        }
        init();
    },[]);

    const login = async () => {
        try {
            const user = await Login();
            setActice(true);
            setProfile(user);
            localStorage.setItem("active_user",user.xuid);
        } catch (error) {
            console.error(error);
        }
    }
    const logout = async () => {
        try {
            await Logout(profile?.xuid);
            setActice(false);
            setProfile(null);
            localStorage.removeItem("active_user");
        } catch (error) {
            console.error(error);
        }
    }

    return <UserContext.Provider value={{ profile, active, login, logout, loading }}>{props.children}</UserContext.Provider>
}


export function useUser(){
    return useContext(UserContext);
}