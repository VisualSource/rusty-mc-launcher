import { Button, AnchorButton, Menu, MenuItem, MenuDivider, Classes, Intent } from "@blueprintjs/core";
import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover2 } from '@blueprintjs/popover2';
import { appWindow } from '@tauri-apps/api/window';
import { useUser } from "../account/Account";
import css from './navbar.module.sass';

const GetIntent = {
  'info': Intent.PRIMARY,
  'success': Intent.SUCCESS,
  'warning': Intent.WARNING,
  'error': Intent.DANGER,
  'default': Intent.NONE,
}

// @see https://docs.microsoft.com/en-us/graph/api/profilephoto-get?view=graph-rest-1.0
export default function NavbarComponent() {
    //@ts-ignore
    const { unreadCount, notifications, markAsRead } = useNotificationCenter({ filter: (item) => !item.read  });
    const user = useUser();
    const navigate = useNavigate();
    const LIBRARY_MENU = useMemo(()=>(
        <Menu>
          <MenuItem text="HOME" onClick={()=>navigate("/")}/>
          <MenuDivider/>
          <MenuItem text="DOWNLOADS" onClick={()=>navigate("/download")}/>
        </Menu>
    ),[navigate]);
    const USER_MENU = useMemo(()=>(
        <Menu>
          { user.active ? <MenuItem text="Logout" onClick={()=>user.logout()}/> : <MenuItem text="Login" onClick={()=>user.login()}/> }
        </Menu>
    ),[user]);
    const LAUNCHER_MENU = useMemo(()=>(
      <Menu>
         <MenuItem text="Settings" onClick={()=>navigate("/settings")}/>
      </Menu>
    ),[navigate]);
    const HELP_MENU = useMemo(()=>(
      <Menu>
          <MenuItem text="Github" href="https://github.com/VisualSource/rusty-mc-launcher" target="_blank"/>
          <MenuItem text="Report Issue" href="https://github.com/VisualSource/rusty-mc-launcher/issues" target="_blank"/>
      </Menu>
    ),[]);
    
    return (
        <nav data-tauri-drag-region className={css.navbar}>
          <div data-tauri-drag-region>
              <div data-tauri-drag-region className={css.navbar_app_opt}>
                <Popover2 content={LAUNCHER_MENU} minimal placement="bottom-start">
                  <Button className={css.btn_gray} text="Launcher" minimal small/>
                </Popover2>
                <Popover2 content={HELP_MENU} minimal placement="bottom">
                  <Button text="Help" minimal small className={css.btn_gray}/>
                </Popover2>
              </div>
              <div data-tauri-drag-region className={css.navbar_main}>
                <AnchorButton text="MODS" minimal onClick={()=>navigate("/store/mods")}/>
                <AnchorButton text="MODPACKS" minimal onClick={()=>navigate("/store/modpacks")}/>
                <Popover2 content={LIBRARY_MENU} interactionKind="hover" modifiers={{ arrow: { enabled: false } }} >
                  <AnchorButton text="LIBRARY" minimal onClick={()=>navigate("/")}/>
                </Popover2>
                <AnchorButton text="NEWS" minimal onClick={()=>navigate("/news")}/>
              </div>
          </div>
          <div data-tauri-drag-region className={css.navbar_left}>
                <div className={css.user}> 
                  <Popover2 modifiers={{ arrow: { enabled: false } }} content={(
                    <Menu>
                        { notifications.length === 0 ? (<MenuItem text="No Notifications"/>) : notifications.map((item,i)=>(
                          <MenuItem key={i} text={item.content} intent={GetIntent[item.type ?? "default"]} onClick={()=>markAsRead(item.id)}>
                          
                          </MenuItem>
                        ))}
                    </Menu>
                  )}>
                    <Button icon="notifications">
                        { unreadCount }
                    </Button>
                  </Popover2>
                  <img alt="user profile" src="/images/Vanilla.webp"/>
                  <Popover2 modifiers={{ arrow: { enabled: false } }} content={USER_MENU} placement="bottom-end">
                    <Button className={user.loading ? Classes.SKELETON: ""} text={user.profile?.profile.name ?? "LOGIN"} rightIcon="caret-down"/>
                  </Popover2>
                </div>
              <Button icon="minus" minimal onClick={()=>appWindow.minimize()}/>
              <Button icon="maximize" minimal onClick={()=>appWindow.toggleMaximize()}/>
              <Button icon="cross" minimal onClick={()=>appWindow.close()}/>
          </div>
        </nav>
    );
}   