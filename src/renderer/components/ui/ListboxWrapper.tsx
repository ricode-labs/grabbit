import React from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { Check, ChevronDown } from 'lucide-react';

interface ListboxWrapperProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  className?: string;
}

export const ListboxWrapper: React.FC<ListboxWrapperProps> = ({
  value,
  onChange,
  options,
  label,
  className = 'w-auto'
}) => {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        {label && (
          <Listbox.Label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            {label}
          </Listbox.Label>
        )}
        <Listbox.Button
          className={`${className} relative pl-3 pr-10 py-2 text-left bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer`}
        >
          <span className="block truncate">{value}</span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown size={18} className="text-zinc-400 dark:text-zinc-500" />
          </span>
        </Listbox.Button>

        <Transition
          as={React.Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options
            className={`${className} absolute z-10 w-full py-1 mt-1 overflow-auto text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg shadow-lg focus:outline-none`}
          >
            {options.map((option) => (
              <Listbox.Option
                key={option}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 text-xs ${
                    active
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100'
                      : 'text-zinc-900 dark:text-zinc-100'
                  }`
                }
                value={option}
              >
                {({ selected }) => (
                  <>
                    <span className={`block truncate ${selected ? 'font-semibold' : 'font-normal'}`}>
                      {option}
                    </span>
                    {selected ? (
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600 dark:text-indigo-400">
                        <Check size={18} />
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
};
