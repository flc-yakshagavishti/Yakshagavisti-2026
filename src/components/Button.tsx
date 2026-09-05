import React, { type HTMLAttributes } from "react";

export interface ButtonProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLDivElement, ButtonProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={`font-rhomdon tracking-widest px-3 py-2 lg:px-6 2xl:px-10 lg:py-3 2xl:py-5 text-sm sm:text-sm md:text-base lg:text-lg 2xl:text-2xl rounded-full font-semibold bg-gradient-to-br from-secondary-200 to-secondary-100 cursor-pointer align-middle hover:from-secondary-100 hover:to-secondary-200 active:scale-90 transition duration-150 ease-linear select-none ${className}`}
      >
        {children}
      </div>
    );
  }
);
Button.displayName = "Button";

export const OutlineButton = React.forwardRef<HTMLDivElement, ButtonProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={`font-rhomdon tracking-widest px-3 py-2 lg:px-6 2xl:px-10 lg:py-3 2xl:py-5 text-sm sm:text-sm md:text-base lg:text-lg 2xl:text-2xl rounded-full font-semibold cursor-pointer align-middle hover:border-secondary-200 hover:text-secondary-200 active:scale-90 transition duration-150 ease-linear select-none border-2 md:border-[3px] border-secondary-100 text-secondary-100 ${className}`}
      >
        {children}
      </div>
    );
  }
);
OutlineButton.displayName = "OutlineButton";

export const InactiveButton = React.forwardRef<HTMLDivElement, ButtonProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={`font-rhomdon tracking-widest px-3 py-2 lg:px-6 2xl:px-10 lg:py-3 2xl:py-5 text-sm sm:text-sm md:text-base lg:text-lg 2xl:text-2xl rounded-full font-light cursor-pointer align-middle select-none border-gray-400 border-2 text-gray-400 ${className}`}
      >
        {children}
      </div>
    );
  }
);
InactiveButton.displayName = "InactiveButton";

export const InactiveSmallButton = React.forwardRef<HTMLDivElement, ButtonProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={`font-rhomdon tracking-widest px-2 py-1 lg:px-4 2xl:px-6 lg:py-2 2xl:py-3 text-sm sm:text-sm md:text-sm lg:text-base 2xl:text-lg rounded-full font-light cursor-pointer align-middle select-none border-gray-400 border-2 text-gray-400 ${className}`}
      >
        {children}
      </div>
    );
  }
);
InactiveSmallButton.displayName = "InactiveSmallButton";

export const SmallButton = React.forwardRef<HTMLDivElement, ButtonProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        {...props}
        className={`font-rhomdon tracking-widest px-3 py-1 lg:px-4 2xl:px-6 lg:py-2 2xl:py-3 text-sm sm:text-sm md:text-sm lg:text-base 2xl:text-lg rounded-full font-semibold bg-gradient-to-br from-secondary-200 to-secondary-100 cursor-pointer align-middle hover:from-secondary-100 hover:to-secondary-200 active:scale-90 transition duration-150 ease-linear select-none ${className}`}
      >
        {children}
      </div>
    );
  }
);
SmallButton.displayName = "SmallButton";