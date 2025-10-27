import { useState, FormEvent } from 'react';
import { WiFiNetwork, WiFiSecurityType } from '@/types';
import { SecurityBadge } from './SecurityBadge';
import { SignalStrengthIndicator } from './SignalStrengthIndicator';

/**
 * WiFi connection dialog component
 * Modal dialog for connecting to a WiFi network with password input
 */

interface WiFiConnectionDialogProps {
  network: WiFiNetwork | null;
  isOpen: boolean;
  connecting: boolean;
  errorMessage?: string;
  onConnect: (ssid: string, password?: string) => void;
  onCancel: () => void;
}

/**
 * Check if a security type requires a password
 */
function requiresPassword(securityType: WiFiSecurityType): boolean {
  return securityType !== WiFiSecurityType.OPEN;
}

/**
 * Modal dialog for connecting to a WiFi network
 * Includes SSID display, password input (if required), and show/hide password toggle
 */
export function WiFiConnectionDialog({
  network,
  isOpen,
  connecting,
  errorMessage,
  onConnect,
  onCancel,
}: WiFiConnectionDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [customSSID, setCustomSSID] = useState('');
  const [isCustomSSID, setIsCustomSSID] = useState(false);

  const needsPassword = network ? requiresPassword(network.security) : true;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const ssid = isCustomSSID ? customSSID : network?.ssid || '';

    if (!ssid.trim()) {
      return;
    }

    onConnect(ssid, needsPassword ? password : undefined);
  };

  const handleClose = () => {
    setPassword('');
    setShowPassword(false);
    setCustomSSID('');
    setIsCustomSSID(false);
    onCancel();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                Connect to WiFi Network
              </h3>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Network info (if not custom SSID) */}
                {network && !isCustomSSID && (
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <SignalStrengthIndicator strength={network.signalStrength} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">{network.ssid}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{network.frequency}</span>
                          <SecurityBadge type={network.security} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom SSID toggle */}
                <div className="flex items-center justify-between">
                  <label htmlFor="custom-ssid-toggle" className="text-sm text-gray-700 dark:text-gray-300">
                    Enter network name manually
                  </label>
                  <input
                    id="custom-ssid-toggle"
                    type="checkbox"
                    checked={isCustomSSID}
                    onChange={(e) => setIsCustomSSID(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* Custom SSID input */}
                {isCustomSSID && (
                  <div>
                    <label htmlFor="ssid" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Network name (SSID)
                    </label>
                    <input
                      type="text"
                      id="ssid"
                      value={customSSID}
                      onChange={(e) => setCustomSSID(e.target.value)}
                      placeholder="Enter network name"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                      autoFocus
                      required
                    />
                  </div>
                )}

                {/* Password input (if needed) */}
                {needsPassword && (
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password
                    </label>
                    <div className="mt-1 relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter network password"
                        className="block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
                        autoFocus={!isCustomSSID}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? (
                          // Eye slash icon (hide)
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          // Eye icon (show)
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {errorMessage && (
                  <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg
                          className="h-5 w-5 text-red-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    disabled={connecting || (isCustomSSID && !customSSID.trim())}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {connecting ? 'Connecting...' : 'Connect'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={connecting}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
