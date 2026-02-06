/**
 * Global Variables and Type Definitions
 *
 * This file contains all TypeScript interfaces and global variables used
 * throughout the application for managing myocyte cell state and communication.
 */

import { ActionType } from "./Enums";

/**
 * neighbourInterface - Represents a neighbouring cell
 * @property uid - Unique identifier of the neighbour cell
 * @property all - Flag indicating if this represents "all cells" selection
 */
export interface neighbourInterface{
  uid: string,
  all : boolean
}

/**
 * notificationTrackingInterface - Tracks processed notifications to prevent duplicates
 * @property uuid - Unique identifier of the notification
 */
export interface notificationTrackingInterface{
  uuid: number
}

/**
 * messagePostInterface - Data structure for posting notification data to the server
 * @property uuid - Unique identifier for this signal propagation event
 * @property cellId - ID of the current cell
 * @property initialCellId - ID of the cell that initiated the signal
 * @property fromCellId - ID of the cell that sent this message
 * @property toCellId - Comma-separated list of recipient cell IDs
 * @property circlingCellIds - Comma-separated list of cells in the ring
 * @property fireTime - Timestamp when the signal was fired
 * @property isHealthyRun - Whether this is a healthy tissue simulation
 * @property isBlocked - Whether this cell is blocked (unhealthy)
 * @property inReentryMode - Whether the simulation is in reentry mode
 * @property cv_ms - Conduction velocity in milliseconds
 * @property rp_ms - Refractory period in milliseconds
 * @property modeName - Name of the simulation mode
 * @property levelName - Activity level (rest, walking, jogging, sprinting)
 * @property isSleeping - Whether the cell is in refractory period
 */
export interface messagePostInterface {
  uuid: number,
  cellId: string,
  initialCellId: string,
  fromCellId: string,
  toCellId:string,
  circlingCellIds:string,
  fireTime: number
  isHealthyRun: boolean,
  isBlocked: boolean,
  inReentryMode: boolean,
  cv_ms: number,
  rp_ms: number,
  modeName: string,
  levelName: string,
  isSleeping: boolean
}

/**
 * cellStateInterface - Represents the current state of a myocyte cell
 * @property cellId - Unique identifier of this cell
 * @property ringMasterCellId - ID of the cell that controls the ring (if in ring mode)
 * @property isBlocked - Whether this cell is blocked/unhealthy
 * @property blockedUuid - UUID of the signal that caused blocking
 * @property isMaster - Whether this cell is the master/leader
 * @property inRing - Whether this cell is part of a ring topology
 * @property inRefractoryPeriod - Whether this cell is currently in refractory period
 */
export interface cellStateInterface
{
  cellId:string;
  ringMasterCellId: string;
  isBlocked: boolean;
  blockedUuid: number;
  isMaster: boolean;
  inRing: boolean;
  inRefractoryPeriod: boolean;
}

/**
 * messageInterface - Main message structure for cell-to-cell communication
 * @property uuid - Unique identifier for this message/signal
 * @property initialCellId - ID of the cell that initiated the signal
 * @property fromCellId - ID of the cell sending this message
 * @property toCellIds - Array of recipient cells
 * @property circlingCellIds - Array of cells in the ring topology
 * @property action - Type of action this message represents
 * @property fireTime - Timestamp when the signal was fired
 * @property selectedActivity - Activity configuration (rest, walking, etc.)
 * @property isHealthyRun - Whether simulating healthy tissue
 * @property blockedCellId - ID of the blocked/unhealthy cell
 * @property inReentryMode - Whether in reentrant arrhythmia mode
 * @property healthy_cv - Conduction velocity for healthy cells (ms)
 * @property unhealthy_cv - Conduction velocity for unhealthy cells (ms)
 * @property healthy_rp - Refractory period for healthy cells (ms)
 * @property unhealthy_rp - Refractory period for unhealthy cells (ms)
 * @property modeName - Simulation mode name
 * @property levelName - Activity level name
 */
export interface messageInterface {
  uuid: number,
  initialCellId: string,
  fromCellId: string,
  toCellIds:neighbourInterface[],
  circlingCellIds:neighbourInterface[],
  action: ActionType,
  fireTime: number
  selectedActivity:activityInterface | null,
  isHealthyRun: boolean,
  blockedCellId: string,
  inReentryMode: boolean,
  healthy_cv: number,
  unhealthy_cv: number,
  healthy_rp: number,
  unhealthy_rp: number,
  modeName: string,
  levelName: string,
}

/**
 * SiblingChangedInterface - Tracks changes from neighbouring cells
 * @property changed - Whether a change has occurred
 * @property message - The message containing the change details
 */
export interface SiblingChangedInterface{
  changed: boolean,
  message : null |messageInterface
}

/**
 * RunningInfoInterface - Current simulation parameters
 * @property modeName - Name of the simulation mode
 * @property levelName - Activity level (rest, walking, jogging, sprinting)
 * @property cvValue - Current conduction velocity value (ms)
 * @property rpValue - Current refractory period value (ms)
 * @property inReentry - Whether currently in reentrant arrhythmia mode
 */
export interface RunningInfoInterface{
  modeName: string,
  levelName: string,
  cvValue: number,
  rpValue: number,
  inReentry: boolean
}

/**
 * activityInterface - Configuration for different activity levels
 * @property displayName - Display name of the activity
 * @property rp_healthy_value - Refractory period for healthy cells (ms)
 * @property rp_unhealthy_value - Refractory period for unhealthy cells (ms)
 * @property cv_healthy_value - Conduction velocity for healthy cells (ms)
 * @property cv_unhealthy_value - Conduction velocity for unhealthy cells (ms)
 */
export interface activityInterface{
  displayName: string,
  rp_healthy_value:number,
  rp_unhealthy_value:number
  cv_healthy_value:number,
  cv_unhealthy_value:number
}

/**
 * RefractoryPeriodStatusInterface - Tracks refractory period status
 * @property inRefractoryPeriod - Whether the cell is currently in refractory period
 */
export interface RefractoryPeriodStatusInterface
{
  inRefractoryPeriod: boolean
}

// ============================================================================
// GLOBAL STATE VARIABLES
// ============================================================================

/**
 * circlingCells - Array of cells that form the ring topology
 * Used in NeighbourRing mode for circular signal propagation
 */
export var circlingCells:neighbourInterface[] = [];

/**
 * neighbours - Array of this cell's direct neighbours
 * Cells in this array will receive signals from this cell
 */
export const neighbours:neighbourInterface[] = [];

/**
 * available_members - Array of all cells currently connected to the channel
 * Updated when cells join or leave the session
 */
export const available_members:neighbourInterface[] = [];

/**
 * notificationTrackingItems - Tracks UUIDs of processed fire notifications
 * Prevents duplicate processing of the same signal
 */
export const notificationTrackingItems: notificationTrackingInterface[] = []

/**
 * changesTrackingItems - Tracks UUIDs of processed configuration changes
 * Prevents duplicate processing of setup/configuration messages
 */
export const changesTrackingItems: notificationTrackingInterface[] = []

/**
 * diagostic_list - Array for diagnostic logging (currently unused)
 */
export const diagostic_list=[""];

/**
 * cellID - Unique identifier for this cell instance
 * Generated automatically using the uid() function
 */
export let cellID = uid();

/**
 * refractoryPeriodStatus - Tracks whether this cell is in refractory period
 * During refractory period, the cell cannot fire again
 */
export let refractoryPeriodStatus : RefractoryPeriodStatusInterface = {inRefractoryPeriod : false}

/**
 * cellInfo - Complete state information for this cell
 * Includes role (master/follower), ring membership, and health status
 */
export const cellInfo:cellStateInterface = {
  cellId: cellID,
  isBlocked: false,        // Whether this cell is unhealthy/blocked
  isMaster: true,          // Whether this cell is the master/leader
  inRing: false,           // Whether this cell is part of a ring
  ringMasterCellId: "",    // ID of the ring master (if in a ring)
  blockedUuid: 0,          // UUID that caused blocking
  inRefractoryPeriod: false // Whether currently in refractory period
}

/**
 * uid - Generates a unique identifier for this cell
 *
 * Format: 2 random letters + 2 random digits (e.g., "ab12")
 * This creates a short, human-readable ID for easy identification
 *
 * @returns A unique 4-character identifier string
 */
function uid() {
    var result           = '';
    var characters       = 'abcdefghijklmnpqrstuvxyz';
    var charactersLength = characters.length;

    // Add 2 random letters
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    result += characters.charAt(Math.floor(Math.random() * charactersLength));

    // Add 2 random digits
    result += (Math.floor(Math.random() * 10).toString());
    result += (Math.floor(Math.random() * 10).toString());

    // Reset circling cells when generating new ID
    circlingCells = []

    return result;
  }