import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { InvokeLogin, InvokeLogout, TokenRefresh } from './invoke';
import DB from './db';
import type {Account} from '../types';


export async function Logout(xuid: string | undefined){
   if(!xuid) return;

   return new Promise<void>(async (ok,err)=>{
      let errorFn: UnlistenFn | undefined;
      try {
         errorFn = await listen("auth_error",(ev)=>{throw ev.payload;});
         await InvokeLogout();
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
      
         await InvokeLogin();
      } catch (error) {
         reject(error);
      }   
   });
}


export async function RefreshToken(xuid: string | undefined){
      if(!xuid) throw new Error("Invaild user xuid")
      const db = DB.Get();

      const user = await db.users.findOne({ xuid }) as Account;

      const jwt = user.access_token.split(".");
      if(jwt.length !== 3) throw new Error("JWT does not have the current number of parts.");
      const payload = jwt.at(1);

      if(!payload) throw new Error("Failed to get JWT payload");

      const data: { exp: number } = JSON.parse(atob(payload));

      // @see https://github.com/auth0/node-jsonwebtoken/blob/74d5719bd03993fcf71e3b176621f133eb6138c0/verify.js#L50
      // https://github.com/auth0/node-jsonwebtoken/blob/74d5719bd03993fcf71e3b176621f133eb6138c0/verify.js#L151
      const clockTimestamp = Math.floor(Date.now() / 1000);
      if(clockTimestamp >= data.exp) {
         console.log("Token expired, refreshing");
         const account = await TokenRefresh(user.refresh_token);
         await db.users.update({ xuid }, account);
      }

      return user;
}