import React from 'react';

// Explicitly defining props ensures TypeScript catches missing or invalid data at compile time.
interface ButtonProps {
  children: React.ReactNode;
  isLoading?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  disabled?: boolean;
}

/*
 * A highly reusable, standardized button component.
 * Features built-in loading state management to prevent double-submissions.
 */
export default function Button({ 
  children, 
  isLoading = false, 
  type = "button", 
  onClick,
  disabled 
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      // SECURITY & UX: If the API call is in progress (isLoading), disable the button 
      // so the user can't spam the backend with 10 identical POST requests.
      disabled={isLoading || disabled}
      className="mt-4 flex w-full min-h-[44px] items-center justify-center rounded-xl bg-[#155DFC] py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-[#0C4DDA] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-[#155DFC] disabled:text-white disabled:opacity-60"
    >
      {children}
    </button>
  );
}
