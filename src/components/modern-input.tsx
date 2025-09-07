"use client";

import React, { useState } from "react";
import { Controller } from "react-hook-form";
import type {
  Control,
  FieldErrors,
  RegisterOptions,
  FieldValues,
  Path,
} from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface ModernInputProps<TFormValues extends FieldValues> {
  label: string;
  name: Path<TFormValues>;
  control: Control<TFormValues>;
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  errors?: FieldErrors<TFormValues>;
  required?: boolean;
  description?: string;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  rules?: RegisterOptions<TFormValues, Path<TFormValues>>;
  multiline?: boolean;
  rows?: number;
}

export function ModernInput<TFormValues extends FieldValues>({
  label,
  name,
  control,
  type = "text",
  placeholder,
  icon: Icon,
  errors,
  required = false,
  description,
  showPasswordToggle = false,
  showPassword = false,
  onTogglePassword,
  rules,
  multiline = false,
  rows = 4,
}: ModernInputProps<TFormValues>) {
  const [isFocused, setIsFocused] = useState(false);

  const errorMessage = errors?.[name]?.message as string | undefined;

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block text-sm font-semibold text-gray-900 dark:text-white">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="relative group">
        <div
          className={`relative flex items-center transition-all duration-300 ${
            isFocused ? "scale-[1.02]" : "scale-100"
          }`}
        >
          {Icon && (
            <Icon
              className={`absolute left-4 z-10 h-5 w-5 transition-colors duration-300 ${
                isFocused ? "text-blue-500" : "text-gray-400"
              }`}
            />
          )}

          <Controller
            name={name}
            control={control}
            rules={rules}
            render={({ field }) =>
              multiline ? (
                <textarea
                  {...field}
                  placeholder={placeholder}
                  rows={rows}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`w-full px-4 py-3 ${
                    Icon ? "pl-12" : ""
                  } bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 rounded-xl font-medium
                    transition-all duration-300 ease-in-out placeholder:text-gray-400 dark:placeholder:text-gray-500
                    text-gray-900 dark:text-white ${
                      errorMessage
                        ? "border-red-300 bg-red-50/50 dark:bg-red-900/10"
                        : isFocused
                        ? "border-blue-400 shadow-lg shadow-blue-500/25 bg-white dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    } focus:outline-none focus:ring-0`}
                />
              ) : (
                <input
                  {...field}
                  type={showPasswordToggle ? (showPassword ? "text" : "password") : type}
                  placeholder={placeholder}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className={`w-full h-14 px-4 ${
                    Icon ? "pl-12" : ""
                  } ${showPasswordToggle ? "pr-12" : ""} bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 rounded-xl font-medium
                    transition-all duration-300 ease-in-out placeholder:text-gray-400 dark:placeholder:text-gray-500
                    text-gray-900 dark:text-white ${
                      errorMessage
                        ? "border-red-300 bg-red-50/50 dark:bg-red-900/10"
                        : isFocused
                        ? "border-blue-400 shadow-lg shadow-blue-500/25 bg-white dark:bg-gray-800"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                    } focus:outline-none focus:ring-0`}
                />
              )
            }
          />

          {showPasswordToggle && (
            <button
              type="button"
              onClick={onTogglePassword}
              className="absolute right-4 z-10 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
            </button>
          )}
        </div>

        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-xl transition-opacity duration-300
            bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl
            ${isFocused ? "opacity-100" : "opacity-0"}`}
          style={{ zIndex: -1 }}
        />
      </div>

      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {!errorMessage && description && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
