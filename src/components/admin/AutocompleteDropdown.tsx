import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronDown, X } from 'lucide-react';

interface AutocompleteDropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: string[];
  label: string;
  id: string;
}

const AutocompleteDropdown = ({
  value,
  onChange,
  placeholder = '',
  options = [],
  label,
  id
}: AutocompleteDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter options based on input value
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options.slice(0, 10); // Show first 10 options if no input
    return options
      .filter(option => 
        option.toLowerCase().includes(inputValue.toLowerCase())
      )
      .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
      .slice(0, 10); // Limit to 10 options
  }, [inputValue, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
  };

  const handleSelect = (option: string) => {
    setInputValue(option);
    onChange(option);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleSelect(filteredOptions[0]);
    } else if (e.key === 'ArrowDown' && filteredOptions.length > 0) {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </label>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            id={id}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pr-10"
          />
          <div className="absolute right-0 top-0 h-full flex items-center pr-2">
            {inputValue ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(!isOpen)}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </Button>
            )}
          </div>
        </div>

        {isOpen && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <div
                  key={`${option}-${index}`}
                  className="px-4 py-2 hover:bg-muted cursor-pointer flex items-center justify-between"
                  onClick={() => handleSelect(option)}
                >
                  <span>{option}</span>
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-muted-foreground">
                No options found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AutocompleteDropdown;