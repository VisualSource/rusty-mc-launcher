import { createContext, useContext, useEffect, useState } from "react";
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { toast } from "react-toastify";
import { Log, TokenRefresh, InvokeLogin, InvokeLogout } from '../../lib/invoke';
import DB from "../../lib/db";
import type { Account } from "../../types";
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
    const [active,setActive] = useState<boolean>(false);
    const [profile,setProfile] = useState<Account | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(()=>{
        const init = async () => {
           try {
                setLoading(true);
                const xuid = localStorage.getItem("active_user");
                if(!xuid) {
                    setActive(false);
                    setProfile(null);
                    setLoading(false);
                    return;
                }

                const db = DB.Get();

                let user = await db.users.findOne({ xuid: active }) as Account;
                if(!user) throw new Error("Failed to find user");

                const jwt = user.access_token.split(".");
                if(jwt.length !== 3) throw new Error("JWT is invaild");
                
                const payload = jwt.at(1);
                if(!payload) throw new Error("Failed to get payload from JWT");

                const data: { exp: number } = JSON.parse(atob(payload));

                // @see https://github.com/auth0/node-jsonwebtoken/blob/74d5719bd03993fcf71e3b176621f133eb6138c0/verify.js#L50
                // https://github.com/auth0/node-jsonwebtoken/blob/74d5719bd03993fcf71e3b176621f133eb6138c0/verify.js#L151
                const clockTimestamp = Math.floor(Date.now() / 1000);
                if(clockTimestamp >= data.exp) {
                    console.log("Token expired, refreshing");
                    user = await TokenRefresh(user.refresh_token);
                    await db.users.update({ xuid }, user);
                }

                setProfile(user);
                setActive(true);
                setLoading(false);
           } catch (error: any) {
                setLoading(false);
                toast.error("Failed to log user in");
                Log(error.message,"error");
           }
        }
        init();
    },[]);

    const login = async () => {
        try {
            setLoading(true);

            const user = await new Promise<Account>(async (ok,reject)=>{
                    let error: UnlistenFn | undefined;
                    let done: UnlistenFn | undefined;
                    try {
                        error = await listen<string>("auth_error",(ev)=>{
                            throw new Error(ev.payload);
                        });
                        done = await listen<Account>("login_done",async(ev)=>{
                            const db = DB.Get();
                            await db.users.insert(ev.payload);

                            if(done) done();
                            if(error) error();
                            ok(ev.payload);
                        });
                        await InvokeLogin();
                    } catch (err: any) {
                        if(error) error();
                        if(done) done();
                        reject(err);
                    }
            });

            setActive(true);
            setProfile(user);
            window.localStorage.setItem("active_user",user.xuid);
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            setActive(false);
            setProfile(null);

            if(typeof error === "string") toast.error(error);
            Log(error,"error");
            // to help if webview caches login
            await InvokeLogout();
        }
    }
    
    const logout = async () => {
        try {
            setLoading(true);

            if(profile){
                const db = DB.Get();
                await db.users.remove({ xuid: profile.xuid });
            }

            await new Promise<void>(async(ok,reject)=>{
                let error: UnlistenFn | undefined;
                try {
                    error = await listen<string>("auth_error",(ev)=>{
                        throw new Error(ev.payload);
                    });

                    await InvokeLogout();

                    if(error) error();
                    ok();
                } catch (err: any) {
                    if(error) error();
                    reject(err);
                }
            });

            setActive(false);
            setProfile(null);
            window.localStorage.removeItem("active_user");
            setLoading(false);
        } catch (error: any) {
            setLoading(false);
            Log(error.message,"error");
            console.error(error);
        }
    }

    return <UserContext.Provider value={{ profile, active, login, logout, loading }}>{props.children}</UserContext.Provider>
}


export function useUser(){
    return useContext(UserContext);
}