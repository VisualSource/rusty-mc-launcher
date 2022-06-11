import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api';
import DB from './db';
import type {Account} from '../types';
export async function Logout(xuid: string | undefined){
   if(!xuid) return;

   return new Promise<void>(async (ok,err)=>{
      let errorFn: UnlistenFn | undefined;
      try {
         errorFn = await listen("auth_error",(ev)=>{throw ev.payload;});
         await invoke("logout");
         const db = DB.Get();
         await db.users.remove({ xuid });
         if(errorFn) errorFn();
         ok();
      } catch (error) {
         if(errorFn) errorFn();
         err(error);
      }
   });
}

export async function Login(){
   return new Promise<Account>(async (ok,reject)=>{
      let errorFn: UnlistenFn | undefined;
      let doneFn: UnlistenFn | undefined;
      try {
         doneFn = await listen<Account>("login_done",async(ev)=>{
            const db = DB.Get();
            await db.users.insert(ev.payload);
            
            if(doneFn) doneFn();
            if(errorFn) errorFn();
            ok(ev.payload);
         });
         errorFn = await listen("auth_error",(ev)=>{
            if(errorFn) errorFn();
            if(doneFn) doneFn();
            throw ev.payload;
         });
      
         await invoke<string>("login");
      } catch (error) {
         reject(error);
      }   
   });
}


export async function RefreshToken(xuid: string | undefined){
      if(!xuid) throw new Error("Invaild user xuid")
      const db = DB.Get();

      const user = await db.users.findOne({ xuid }) as Account;

      const payload = user.access_token.split(".").at(1);

      if(!payload) throw new Error("Invaild jwt token");

      const data: { exp: number } = JSON.parse(atob(payload));

      const exp = new Date(data.exp  * 1000);
      const now = new Date(Date.now());
      
      if(!(exp > now)) {
         const account = await invoke<Account>("token_refresh",{ token: user.refresh_token });
         await db.users.update({ xuid }, account);
      }

      return user;
}