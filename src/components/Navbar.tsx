import { appWindow } from '@tauri-apps/api/window';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { HiX, HiMinus, HiChevronDown, HiLogout, HiOutlineBell, HiSelector, HiLogin } from 'react-icons/hi';
import { Menu, Transition } from '@headlessui/react'
import { loginRequest } from '../lib/auth/config';
import useUser from '../lib/hooks/useUser';

const Navbar = () => {
    const { user, instance, isLoading } = useUser();
    return (
        <div data-tauri-drag-region>
            <div data-tauri-drag-region className="bg-gray-900 flex justify-end gap-2">
                <button onClick={() => appWindow.minimize()} className="py-1">
                    <HiMinus />
                </button>
                <button onClick={() => appWindow.close()} className="bg-red-700 hover:bg-red-600 p-1">
                    <HiX />
                </button>
            </div>
            <header data-tauri-drag-region aria-label="Page Header" className="bg-gray-800 shadow">
                <div data-tauri-drag-region className="mx-auto max-w-screen-xl px-4 py-2 sm:px-6 lg:px-8">
                    <div data-tauri-drag-region className="flex items-center sm:justify-between sm:gap-2">
                        <div data-tauri-drag-region className="flex flex-1 items-center justify-between gap-4 sm:justify-end">
                            <div data-tauri-drag-region className="flex gap-4" >
                                <AuthenticatedTemplate>
                                    <button className="block shrink-0 rounded-lg bg-black bg-opacity-20 p-2.5 text-white shadow-sm hover:text-gray-50 relative">
                                        <span className="absolute right-2 top-2 inline-flex items-center justify-center rounded-full bg-red-600 px-1 py-1">
                                        </span>
                                        <span className="sr-only">Notifications</span>
                                        <HiOutlineBell className="h-5 w-5" />
                                    </button>
                                </AuthenticatedTemplate>
                            </div>

                            <button type="button" className="group flex shrink-0 items-center rounded-lg transition">
                                <span className="sr-only">Menu</span>
                                <AuthenticatedTemplate>
                                    {!isLoading ? (<>
                                        <img src={user?.photo} alt="Man" className="h-10 w-10 rounded-full object-cover" />

                                        <p className="ml-2 hidden text-left text-xs sm:block text-white">
                                            <strong className="block font-medium">{user?.minecraft?.profile.name}</strong>
                                            <span className="text-ellipsis whitespace-nowrap overflow-hidden w-14">{user?.userPrincipalName}</span>
                                        </p>
                                    </>) : (<>
                                        <span>Loading...</span>
                                    </>)}
                                </AuthenticatedTemplate>
                                <UnauthenticatedTemplate>
                                    <button onClick={() => instance.loginPopup(loginRequest)} className="flex items-center gap-2 shadow py-1 px-2.5 bg-gray-700 hover:bg-gray-600 rounded" >
                                        <HiLogin />
                                        <span>Login</span>
                                    </button>
                                </UnauthenticatedTemplate>

                                <Menu as="div" className="relative inline-block text-left">
                                    <Menu.Button className="ml-4 hidden h-5 w-5 text-gray-500 transition group-hover:text-gray-700 sm:block">
                                        <HiChevronDown className="h-5 w-5 text-gray-500 transition group-hover:text-gray-700 sm:block" />
                                    </Menu.Button>
                                    <Transition enter="transition duration-100 ease-out" enterFrom="transform scale-95 opacity-0" enterTo="transform scale-100 opacity-100" leave="transition duration-75 ease-out" leaveFrom="transform scale-100 opacity-100" leaveTo="transform scale-95 opacity-0">
                                        <Menu.Items className="absolute right-0 top-3 shadow-lg origin-top-right flex flex-col bg-gray-900 w-56 divide-y divide-gray-700">
                                            <Menu.Item as="div">
                                                <button className='w-full flex items-center gap-2 border-l-[3px] border-transparent px-4 py-3 text-gray-500 hover:border-gray-100 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200' onClick={() => instance.logoutPopup()}>
                                                    <HiLogout className="h-5 w-5 opacity-75" />
                                                    <span className="text-sm font-medium">Signout</span>
                                                </button>
                                            </Menu.Item>
                                            <Menu.Item as="div">
                                                <button className='w-full flex items-center gap-2 border-l-[3px] border-transparent px-4 py-3 text-gray-500 hover:border-gray-100 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200'>
                                                    <HiSelector className="h-5 w-5 opacity-75" />
                                                    <span className="text-sm font-medium">Select Account</span>
                                                </button>
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
}

export default Navbar;


/*
  {isAuthenticated ? (
                <div classNameName="flex justify-center">
                    <img src={data?.photo} classNameName="h-10 w-10" />
                    <div classNameName="bg-black bg-opacity-20 whitespace-nowrap text-ellipsis text-center text-gray-200 overflow-hidden px-2 w-24 text-sm font-medium">{data?.userPrincipalName}</div>
                    <Menu as="div" classNameName="relative inline-block text-left">
                        <Menu.Button classNameName="inline-flex w-full justify-center rounded-r-md bg-black bg-opacity-20 px-4 py-2 text-sm font-medium text-white hover:bg-opacity-30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                            <HiChevronDown />
                        </Menu.Button>
                        <Transition
                            enter="transition duration-100 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-75 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                        >
                            <Menu.Items classNameName="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div classNameName="px-1 py-1 ">
                                    <Menu.Item>
                                        <button classNameName='hover:bg-gray-500 hover:text-white text-gray-100 group flex w-full items-center rounded-md px-2 py-2 text-sm' onClick={() => instance.logoutPopup()}>Signout</button>
                                    </Menu.Item>
                                    <Menu.Item>
                                        <button classNameName='hover:bg-gray-500 hover:text-white text-gray-100 group flex w-full items-center rounded-md px-2 py-2 text-sm'>Select Account</button>
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            ) : (
                <div>
                    <button onClick={() => {
                        instance.loginPopup(loginRequest);
                    }}>Signin</button>
                </div>
            )}

            <button onClick={() => appWindow.minimize()} classNameName="px-2 py-1 hover:bg-slate-700">
                <HiMinus />
            </button>
            <button onClick={() => appWindow.close()} classNameName="bg-red-700 hover:bg-red-600 px-2 py-1">
                <HiX />
            </button>

*/