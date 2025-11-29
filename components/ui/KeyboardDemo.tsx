'use client';

import { useState } from 'react';
import { KeyboardInput, KeyboardTextarea } from './KeyboardInput';

/**
 * Demo component to test the virtual keyboard functionality
 * This can be added to any page for testing purposes
 */
export function KeyboardDemo() {
  const [textValue, setTextValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [numberValue, setNumberValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [textareaValue, setTextareaValue] = useState('');

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Virtual Keyboard Demo
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Text Input (Full Keyboard)
          </label>
          <KeyboardInput
            inputType="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Enter text with full QWERTY keyboard"
            className="input"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current value: {textValue || '(empty)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Email Input (With @ and domain shortcuts)
          </label>
          <KeyboardInput
            inputType="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder="Enter email address"
            className="input"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current value: {emailValue || '(empty)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Number Input (Numeric Keypad)
          </label>
          <KeyboardInput
            inputType="number"
            value={numberValue}
            onChange={(e) => setNumberValue(e.target.value)}
            placeholder="Enter numbers only"
            className="input"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current value: {numberValue || '(empty)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Phone Input (Numeric Keypad)
          </label>
          <KeyboardInput
            inputType="tel"
            value={phoneValue}
            onChange={(e) => setPhoneValue(e.target.value)}
            placeholder="Enter phone number"
            className="input"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current value: {phoneValue || '(empty)'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Textarea (Multi-line text)
          </label>
          <KeyboardTextarea
            value={textareaValue}
            onChange={(e) => setTextareaValue(e.target.value)}
            placeholder="Enter multiple lines of text..."
            className="w-full min-h-[150px] p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            maxLength={500}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Character count: {textareaValue.length}/500
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
          Instructions:
        </h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>Click on any input field to show the virtual keyboard</li>
          <li>Text inputs show full QWERTY keyboard with special characters</li>
          <li>Email inputs include quick shortcuts (@, .com, .net, .org)</li>
          <li>Number and phone inputs show numeric keypad</li>
          <li>Click the keyboard icon button or tap the input field to activate</li>
          <li>Press the down arrow or close button to hide the keyboard</li>
        </ul>
      </div>
    </div>
  );
}