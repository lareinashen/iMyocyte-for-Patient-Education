/**
 * Application Constants
 *
 * This file contains all constant values used throughout the application,
 * including channel names for real-time communication and API configuration.
 */

// Channel name for setup-related messages (adding/removing neighbours, building rings)
export const CHANNEL_SETUP = "setup"

// Channel name for action notifications (firing signals, settings changes)
export const ACTION_NOTIFICATION = "notification"

// Event name when a cell enters/joins the channel
export const CHANNEL_ENTER = "enter"

// Event name when a cell leaves/exits the channel
export const CHANNEL_LEAVE = "leave"

// Main channel name for cell communication (CA = Cardiac Action)
export const CHANNEL_NAME = "CA"

// Ably API key for real-time messaging service
// IMPORTANT: Replace '***' with your actual Ably API key from https://ably.com
export const ABLY_API_KEY='***';

// Client ID for the server/control instance
export const SERVER_CLIENTID = "serverCA"

// API endpoint for posting notification data to the backend server
export const CELL_API_URL = "https://cell-server.vercel.app/notification"