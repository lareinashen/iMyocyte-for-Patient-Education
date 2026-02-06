/**
 * Enumerations for Simulation Modes and Action Types
 *
 * This file defines the different simulation modes and action types
 * used throughout the application for myocyte signal propagation.
 */

/**
 * SimulationMode - Defines the different modes of signal propagation
 *
 * - None: No mode selected (initial state)
 * - Neighbour: Cells manually select their neighbours for signal propagation
 * - Location: Cells are positioned based on physical location in a room
 * - NeighbourRing: Cells form a circular ring topology for reentrant arrhythmia simulation
 */
export enum SimulationMode {
    None = "",
    Neighbour = "Neighbour",
    Location = "Location",
    NeighbourRing = "Neighbour NeighbourRing",
  }

/**
 * ActionType - Defines the different types of actions/messages between cells
 *
 * - None: No action
 * - AddNeighbour: A cell is adding another cell as a neighbour
 * - BuildCircling: Building a ring topology with specified cells
 * - RemoveFromCircling: Removing a cell from the ring topology
 * - AddMember: A new cell has joined the channel
 * - DeleteNeighbour: Removing a neighbour connection
 * - DeleteMember: A cell has left the channel (user closed/refreshed page)
 * - FireNotification: A cell is firing an action potential signal
 * - SettingsChanged: Simulation parameters changed (RP, CV, healthy/unhealthy settings)
 */
export enum ActionType {
    None = 0,
    AddNeighbour,
    BuildCircling,
    RemoveFromCircling,
    AddMember,
    DeleteNeighbour,
    DeleteMember, // when user leaves or refreshes page
    FireNotification,
    SettingsChanged // when RP, CV, healthy and unhealthy cell settings are changed
  }