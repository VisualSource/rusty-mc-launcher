import { Listbox, Transition } from "@headlessui/react";
import { HiCheck, HiSelector } from "react-icons/hi";
import { Fragment } from "react";

type Props = {
    value: any,
    values: any[],
    onChange: (value: unknown) => void,
    nameKey: string;
    idKey: string;
    CustomElement?: React.FC<{ value: any, selected: boolean }>
}
const SelectBox: React.FC<Props> = ({ CustomElement, values, nameKey, idKey, value, onChange }) => {
    return (
        <Listbox value={value[idKey]} onChange={onChange}>
            <div className="relative">
                <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-700 bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                    {CustomElement ? <CustomElement selected={false} value={value} /> : (
                        <span className="block truncate">{value[nameKey]}</span>
                    )}
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                        <HiSelector
                            className="h-5 w-5 text-gray-400"
                            aria-hidden="true"
                        />
                    </span>
                </Listbox.Button>
                <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0">
                    <Listbox.Options className="absolute mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border-gray-700 bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                        {values.map((item, i) => (
                            <Listbox.Option key={i} value={item[idKey]} className={({ active }) => `relative cursor-default select-none py-2 pl-10 pr-4 text-white ${active ? 'bg-blue-600' : ''}`}>
                                {({ selected }) => (
                                    <>
                                        {CustomElement ? <CustomElement selected={selected} value={item} /> : (
                                            <span
                                                className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                    }`}
                                            >
                                                {item[nameKey]}
                                            </span>)}
                                        {selected ? (
                                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                                                <HiCheck className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                        ) : null}
                                    </>
                                )}
                            </Listbox.Option>
                        ))}
                    </Listbox.Options>
                </Transition>
            </div>
        </Listbox>
    );
}

export default SelectBox;