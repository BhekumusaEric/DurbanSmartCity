import { useState } from "react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterPanelProps {
  title: string;
  options: FilterOption[];
  selectedValue: string;
  onChange: (value: string) => void;
  showClearButton?: boolean;
}

export default function FilterPanel({
  title,
  options,
  selectedValue,
  onChange,
  showClearButton = true
}: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleClear = () => {
    onChange(options[0].value);
  };

  return (
    <div className="relative">
      <div className="flex flex-col space-y-1">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </label>
          {showClearButton && selectedValue !== options[0].value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Clear
            </button>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-3 text-left text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <span className="block truncate">
              {options.find(option => option.value === selectedValue)?.label || options[0].label}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
          </button>

          {isOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 text-sm ring-1 ring-black ring-opacity-5 focus:outline-none">
              <ul className="max-h-60 overflow-auto">
                {options.map((option) => (
                  <li
                    key={option.value}
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      option.value === selectedValue
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-900 dark:text-white"
                    }`}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                  >
                    <span className="block truncate">{option.label}</span>
                    {option.value === selectedValue && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg
                          className="h-5 w-5 text-blue-600 dark:text-blue-400"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
